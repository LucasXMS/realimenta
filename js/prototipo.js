/* =============================================================
   PROTÓTIPO — lógica da demonstração (dados fictícios)
   -------------------------------------------------------------
   1. Formatação, armazenamento e estado
   2. Abas "Ver como", avisos e diálogo de confirmação
   3. Visão do estabelecimento
   4. Visão de pessoa ou instituição
   5. Painel de monitoramento e leituras automáticas
   Texto digitado pelo usuário entra na página só por textContent.
   ============================================================= */
(function () {
  "use strict";

  var D = window.DADOS_DEMO;
  var G = window.Graficos;
  if (!D || !G) return;

  var datas = D.datas;
  var CHAVE_DADOS = "realimenta-demo-dados-v" + D.VERSAO;
  var CHAVE_PREFERENCIAS = "realimenta-demo-preferencias";
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* =========================================================
     1. FORMATAÇÃO, ARMAZENAMENTO E ESTADO
     ========================================================= */
  var formatoKg = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var formatoInteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  var formatoDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  var formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

  function kg(valor) { return formatoKg.format(valor) + " kg"; }
  function dataBR(texto) { return formatoData.format(datas.textoParaData(texto)); }
  function diaMes(texto) { return formatoDiaMes.format(datas.textoParaData(texto)); }
  function percentual(valor) { return formatoInteiro.format(valor) + "%"; }
  function hoje() { return datas.hojeTexto(); }
  function soma(lista) { return lista.reduce(function (total, item) { return total + item.kg; }, 0); }

  function diasEntre(inicio, fim) {
    return Math.round((datas.textoParaData(fim) - datas.textoParaData(inicio)) / 86400000);
  }

  // Remove acentos e maiúsculas para a busca
  function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  // localStorage sempre dentro de try/catch, com cópia em memória
  var memoria = {};
  var armazenamentoDisponivel = true;

  function lerArmazenado(chave) {
    try {
      var valor = window.localStorage.getItem(chave);
      return valor !== null ? valor : (memoria[chave] || null);
    } catch (erro) {
      armazenamentoDisponivel = false;
      return memoria[chave] || null;
    }
  }

  function gravarArmazenado(chave, valor) {
    memoria[chave] = valor;
    try {
      window.localStorage.setItem(chave, valor);
    } catch (erro) {
      armazenamentoDisponivel = false;
    }
  }

  var estado = null;

  function dadosValidos(dados) {
    return dados && dados.meta && dados.meta.versao === D.VERSAO &&
      Array.isArray(dados.excedentes) && Array.isArray(dados.descartes);
  }

  function carregarDados() {
    var dados = null;
    try { dados = JSON.parse(lerArmazenado(CHAVE_DADOS)); } catch (erro) { dados = null; }

    // Exemplo sem alterações gerado em outro dia: gera de novo para nunca aparecer "vencido"
    var exemploAntigo = dadosValidos(dados) && dados.meta.origem === "exemplo" &&
      !dados.meta.modificado && dados.meta.geradoEm !== hoje();

    if (!dadosValidos(dados) || exemploAntigo) {
      estado = D.gerarDadosExemplo();
      salvar(false);
    } else {
      estado = dados;
    }
  }

  function salvar(marcarAlteracao) {
    if (marcarAlteracao !== false) estado.meta.modificado = true;
    gravarArmazenado(CHAVE_DADOS, JSON.stringify(estado));
  }

  var preferencias = (function () {
    try { return JSON.parse(lerArmazenado(CHAVE_PREFERENCIAS)) || {}; } catch (erro) { return {}; }
  })();

  function salvarPreferencias() {
    gravarArmazenado(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  }

  // Acesso rápido aos cadastros
  var estabelecimentoPorId = {};
  D.estabelecimentos.forEach(function (e) { estabelecimentoPorId[e.id] = e; });
  var receptorPorId = {};
  D.receptores.forEach(function (r) { receptorPorId[r.id] = r; });

  // "Expirado" é calculado na exibição: prazo vencido sem retirada
  function statusExibido(excedente) {
    if ((excedente.status === "disponivel" || excedente.status === "reservado") && excedente.consumirAte < hoje()) {
      return "expirado";
    }
    return excedente.status;
  }

  var ROTULO_STATUS = {
    disponivel: "Disponível",
    reservado: "Reservado",
    retirado: "Retirado",
    expirado: "Expirado",
    cancelado: "Cancelado"
  };

  /* ---------- Pequenos construtores de DOM ---------- */
  function criar(tag, classe, conteudo) {
    var elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (conteudo !== undefined && conteudo !== null) elemento.textContent = conteudo;
    return elemento;
  }

  function icone(nome, classe) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icone" + (classe ? " " + classe : ""));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var uso = document.createElementNS(SVG_NS, "use");
    uso.setAttribute("href", "#" + nome);
    svg.appendChild(uso);
    return svg;
  }

  // Botão com texto visível + complemento só para leitores de tela
  function botao(texto, classe, complementoOculto) {
    var b = criar("button", classe, texto);
    b.type = "button";
    if (complementoOculto) b.appendChild(criar("span", "visualmente-oculto", " " + complementoOculto));
    return b;
  }

  function preencherSelect(select, opcoes, valor) {
    select.textContent = "";
    opcoes.forEach(function (opcao) {
      var o = criar("option", null, opcao.texto);
      o.value = opcao.valor;
      select.appendChild(o);
    });
    if (valor !== undefined && valor !== null) select.value = valor;
    if (select.selectedIndex === -1 && select.options.length) select.selectedIndex = 0;
  }

  function seloStatus(excedente) {
    var status = statusExibido(excedente);
    return criar("span", "status status--" + status, ROTULO_STATUS[status]);
  }

  /* =========================================================
     2. ABAS, AVISOS E DIÁLOGO
     ========================================================= */
  var areaAnuncio = document.getElementById("anuncio");
  var temporizadorAnuncio = null;

  // Mensagem em região aria-live (também aparece como aviso na tela)
  function anunciar(mensagem) {
    window.clearTimeout(temporizadorAnuncio);
    areaAnuncio.textContent = "";
    window.setTimeout(function () {
      areaAnuncio.textContent = mensagem;
      temporizadorAnuncio = window.setTimeout(function () { areaAnuncio.textContent = ""; }, 5000);
    }, 60);
  }

  var VISOES = ["estabelecimento", "receptor", "painel"];
  var abas = {};
  var paineis = {};
  var visaoAtual = null;

  VISOES.forEach(function (nome) {
    abas[nome] = document.getElementById("aba-" + nome);
    paineis[nome] = document.getElementById("painel-" + nome);
  });

  function mostrarVisao(nome, focarAba) {
    if (VISOES.indexOf(nome) === -1) nome = "estabelecimento";
    visaoAtual = nome;

    VISOES.forEach(function (v) {
      var ativa = v === nome;
      abas[v].setAttribute("aria-selected", String(ativa));
      abas[v].tabIndex = ativa ? 0 : -1;
      paineis[v].hidden = !ativa;
    });

    // A visão ativa fica no endereço (#estabelecimento, #receptor, #painel)
    if (window.location.hash !== "#" + nome) {
      try {
        window.history.replaceState(null, "", "#" + nome);
      } catch (erro) {
        window.location.hash = nome;
      }
    }

    renderizarVisaoAtual();
    if (focarAba) abas[nome].focus();
  }

  function renderizarVisaoAtual() {
    if (visaoAtual === "estabelecimento") renderizarEstabelecimento();
    else if (visaoAtual === "receptor") renderizarReceptor();
    else if (visaoAtual === "painel") renderizarPainel();
  }

  function iniciarAbas() {
    VISOES.forEach(function (nome, indice) {
      abas[nome].addEventListener("click", function () { mostrarVisao(nome); });
      abas[nome].addEventListener("keydown", function (evento) {
        var novo = null;
        if (evento.key === "ArrowRight") novo = (indice + 1) % VISOES.length;
        else if (evento.key === "ArrowLeft") novo = (indice - 1 + VISOES.length) % VISOES.length;
        else if (evento.key === "Home") novo = 0;
        else if (evento.key === "End") novo = VISOES.length - 1;
        if (novo === null) return;
        evento.preventDefault();
        mostrarVisao(VISOES[novo], true);
      });
    });

    window.addEventListener("hashchange", function () {
      var nome = window.location.hash.replace("#", "");
      if (VISOES.indexOf(nome) !== -1 && nome !== visaoAtual) mostrarVisao(nome);
    });
  }

  // Diálogo de confirmação acessível (com fallback para confirm()).
  // A ação roda no clique de "Confirmar"; Cancelar e Esc só fecham.
  var dialogo = document.getElementById("dialogo-confirmar");
  var acaoPendente = null;

  function iniciarDialogo() {
    if (!dialogo || typeof dialogo.showModal !== "function") return;
    dialogo.querySelector('[value="confirmar"]').addEventListener("click", function (evento) {
      evento.preventDefault();
      var acao = acaoPendente;
      acaoPendente = null;
      dialogo.close("confirmar");
      if (acao) acao();
    });
    dialogo.querySelector('[value="cancelar"]').addEventListener("click", function (evento) {
      evento.preventDefault();
      acaoPendente = null;
      dialogo.close("cancelar");
    });
    // Esc fecha o diálogo sem executar nada; a próxima confirmação substitui a ação pendente
  }

  function confirmar(opcoes, aoConfirmar) {
    if (!dialogo || typeof dialogo.showModal !== "function") {
      if (window.confirm(opcoes.titulo + "\n\n" + opcoes.texto)) aoConfirmar();
      return;
    }
    document.getElementById("dialogo-titulo").textContent = opcoes.titulo;
    document.getElementById("dialogo-texto").textContent = opcoes.texto;
    document.getElementById("dialogo-confirmar-botao").textContent = opcoes.rotulo;
    acaoPendente = aoConfirmar;
    dialogo.showModal();
  }

  function iniciarFaixaAviso() {
    document.getElementById("botao-restaurar").addEventListener("click", function () {
      confirmar({
        titulo: "Restaurar dados de exemplo?",
        texto: "Tudo o que foi cadastrado nesta demonstração será substituído pelo histórico fictício de 8 semanas, terminando hoje.",
        rotulo: "Restaurar"
      }, function () {
        estado = D.gerarDadosExemplo();
        salvar(false);
        renderizarVisaoAtual();
        anunciar("Dados de exemplo restaurados.");
      });
    });

    document.getElementById("botao-apagar").addEventListener("click", function () {
      confirmar({
        titulo: "Apagar todos os registros?",
        texto: "Todos os excedentes e descartes serão apagados. Os cadastros fictícios de estabelecimentos e receptores continuam disponíveis.",
        rotulo: "Apagar tudo"
      }, function () {
        estado = D.gerarDadosVazios();
        salvar();
        renderizarVisaoAtual();
        anunciar("Todos os registros foram apagados.");
      });
    });
  }

  /* =========================================================
     3. VISÃO DO ESTABELECIMENTO
     ========================================================= */
  function $(id) { return document.getElementById(id); }

  var selEstabelecimento = $("sel-estabelecimento");
  var formExcedente = $("form-excedente");
  var formDescarte = $("form-descarte");
  var areaMeusExcedentes = $("meus-excedentes");
  var areaDica = $("dica-descarte");
  var LIMITE_HISTORICO = 6;
  var historicoCompleto = false;
  var OPCAO_SELECIONE = { valor: "", texto: "Selecione…" };

  function buscarExcedente(id) {
    for (var i = 0; i < estado.excedentes.length; i++) {
      if (estado.excedentes[i].id === id) return estado.excedentes[i];
    }
    return null;
  }

  function iniciarEstabelecimento() {
    preencherSelect(selEstabelecimento, D.estabelecimentos.map(function (e) {
      return { valor: e.id, texto: e.nome + " (" + e.bairro + ")" };
    }), preferencias.estabelecimento);

    var opcoesCategoria = [OPCAO_SELECIONE].concat(D.categorias.map(function (c) { return { valor: c, texto: c }; }));
    preencherSelect($("exc-categoria"), opcoesCategoria, "");
    preencherSelect($("des-categoria"), opcoesCategoria, "");
    preencherSelect($("des-motivo"), [OPCAO_SELECIONE].concat(D.motivos.map(function (m) { return { valor: m, texto: m }; })), "");
    prepararDatas();

    selEstabelecimento.addEventListener("change", function () {
      preferencias.estabelecimento = selEstabelecimento.value;
      salvarPreferencias();
      historicoCompleto = false;
      areaDica.hidden = true;
      $("des-excedente-id").value = "";
      renderizarEstabelecimento();
      anunciar("Agora você está como " + estabelecimentoPorId[selEstabelecimento.value].nome + ".");
    });

    formExcedente.addEventListener("submit", enviarExcedente);
    formDescarte.addEventListener("submit", enviarDescarte);

    // O erro de um campo some assim que a pessoa o corrige
    [formExcedente, formDescarte].forEach(function (form) {
      ["input", "change"].forEach(function (tipo) {
        form.addEventListener(tipo, function (evento) {
          if (evento.target.getAttribute("aria-invalid") === "true") definirErro(evento.target, "");
        });
      });
    });

    areaMeusExcedentes.setAttribute("tabindex", "-1");
    areaMeusExcedentes.addEventListener("click", aoClicarMeusExcedentes);
  }

  // Datas padrão e limites (sempre no horário local)
  function prepararDatas() {
    var h = hoje();
    ["exc-consumir", "exc-retirada-data"].forEach(function (id) {
      $(id).min = h;
      if (!$(id).value) $(id).value = h;
    });
    if (!$("exc-retirada-inicio").value) $("exc-retirada-inicio").value = "14:00";
    if (!$("exc-retirada-fim").value) $("exc-retirada-fim").value = "17:00";
    $("des-data").max = h;
    if (!$("des-data").value) $("des-data").value = h;
  }

  /* ---------- Validação ---------- */
  function definirErro(campo, mensagem) {
    var erro = $(campo.id + "-erro");
    if (mensagem) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
    if (erro) erro.textContent = mensagem || "";
  }

  // Aceita "2,5" ou "2.5"
  function lerKg(texto) {
    var limpo = String(texto).trim().replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(limpo)) return NaN;
    return Number(limpo);
  }

  function mensagemKg(valor) {
    if (!(valor > 0)) return "Informe a quantidade em kg, maior que zero (ex.: 2,5).";
    if (valor > 5000) return "Confira a quantidade: o valor parece alto demais.";
    return "";
  }

  // regras: [{ campo, mensagem }] — mensagem vazia significa campo válido
  function validar(regras) {
    var primeiro = null;
    var total = 0;
    regras.forEach(function (regra) {
      definirErro(regra.campo, regra.mensagem);
      if (regra.mensagem) {
        total += 1;
        if (!primeiro) primeiro = regra.campo;
      }
    });
    if (primeiro) {
      primeiro.focus();
      anunciar(total === 1 ? "Há 1 campo para corrigir." : "Há " + total + " campos para corrigir.");
      return false;
    }
    return true;
  }

  function enviarExcedente(evento) {
    evento.preventDefault();
    var h = hoje();
    var alimento = $("exc-alimento").value.trim();
    var categoria = $("exc-categoria").value;
    var quantidade = lerKg($("exc-kg").value);
    var consumirAte = $("exc-consumir").value;
    var retiradaData = $("exc-retirada-data").value;
    var inicio = $("exc-retirada-inicio").value;
    var fim = $("exc-retirada-fim").value;

    var valido = validar([
      { campo: $("exc-alimento"), mensagem: alimento.length < 2 ? "Informe o nome do alimento." : "" },
      { campo: $("exc-categoria"), mensagem: !categoria ? "Escolha uma categoria." : "" },
      { campo: $("exc-kg"), mensagem: mensagemKg(quantidade) },
      { campo: $("exc-consumir"), mensagem: !consumirAte ? "Informe até quando o alimento pode ser consumido." : consumirAte < h ? "O prazo não pode ser anterior a hoje." : "" },
      { campo: $("exc-retirada-data"), mensagem: !retiradaData ? "Informe a data da retirada." : retiradaData < h ? "A retirada não pode ser antes de hoje." : (consumirAte && retiradaData > consumirAte) ? "A retirada precisa acontecer até a data de consumo." : "" },
      { campo: $("exc-retirada-inicio"), mensagem: !inicio ? "Informe a hora inicial." : "" },
      { campo: $("exc-retirada-fim"), mensagem: !fim ? "Informe a hora final." : (inicio && fim <= inicio) ? "A hora final precisa ser depois da inicial." : "" },
      { campo: $("exc-confirmo"), mensagem: !$("exc-confirmo").checked ? "Marque a confirmação para anunciar o excedente." : "" }
    ]);
    if (!valido) return;

    estado.excedentes.push({
      id: D.novoId(),
      estabelecimentoId: selEstabelecimento.value,
      alimento: alimento,
      categoria: categoria,
      kg: Math.round(quantidade * 10) / 10,
      consumirAte: consumirAte,
      retiradaData: retiradaData,
      retiradaInicio: inicio,
      retiradaFim: fim,
      observacoes: $("exc-observacoes").value.trim(),
      status: "disponivel",
      receptorId: null,
      criadoEm: h,
      reservadoEm: null,
      retiradoEm: null,
      descarteId: null
    });
    salvar();
    formExcedente.reset();
    prepararDatas();
    renderizarEstabelecimento();
    anunciar("Excedente cadastrado: " + alimento + ", " + kg(quantidade) + ". Ele já aparece para pessoas e instituições.");
  }

  function enviarDescarte(evento) {
    evento.preventDefault();
    var h = hoje();
    var alimento = $("des-alimento").value.trim();
    var categoria = $("des-categoria").value;
    var quantidade = lerKg($("des-kg").value);
    var data = $("des-data").value;
    var motivo = $("des-motivo").value;

    var valido = validar([
      { campo: $("des-alimento"), mensagem: alimento.length < 2 ? "Informe o nome do alimento." : "" },
      { campo: $("des-categoria"), mensagem: !categoria ? "Escolha uma categoria." : "" },
      { campo: $("des-kg"), mensagem: mensagemKg(quantidade) },
      { campo: $("des-data"), mensagem: !data ? "Informe a data do descarte." : data > h ? "A data do descarte não pode ser no futuro." : "" },
      { campo: $("des-motivo"), mensagem: !motivo ? "Escolha o motivo do descarte." : "" }
    ]);
    if (!valido) return;

    var descarte = {
      id: D.novoId(),
      estabelecimentoId: selEstabelecimento.value,
      alimento: alimento,
      categoria: categoria,
      kg: Math.round(quantidade * 10) / 10,
      data: data,
      motivo: motivo
    };
    estado.descartes.push(descarte);

    // Se veio de um excedente vencido, liga os dois registros
    var origem = buscarExcedente($("des-excedente-id").value);
    if (origem) origem.descarteId = descarte.id;

    salvar();
    formDescarte.reset();
    $("des-excedente-id").value = "";
    prepararDatas();
    renderizarEstabelecimento();
    anunciar("Descarte registrado: " + alimento + ", " + kg(quantidade) + ". O painel já considera este registro.");
    mostrarDica(motivo);
  }

  // Conteúdo educativo integrado: dica ligada ao motivo do descarte
  function mostrarDica(motivo) {
    var dica = D.dicasPorMotivo[motivo] || D.dicasPorMotivo.Outro;
    $("dica-tema").textContent = "Dica · " + dica.tema;
    $("dica-texto").textContent = dica.texto;
    areaDica.hidden = false;
    areaDica.focus();
  }

  /* ---------- Resumo e lista "Meus excedentes" ---------- */
  function renderizarEstabelecimento() {
    var id = selEstabelecimento.value;
    renderizarResumo(id);
    renderizarMeusExcedentes(id);
  }

  function itemResumo(rotulo, valor, descarte) {
    var p = criar("p", "resumo__item" + (descarte ? " resumo__item--descarte" : ""));
    p.appendChild(criar("span", "resumo__rotulo", rotulo));
    p.appendChild(criar("span", "resumo__valor", valor));
    return p;
  }

  function renderizarResumo(id) {
    var mes = hoje().slice(0, 7);
    var nomeMes = formatoMes.format(new Date());
    var redistribuido = soma(estado.excedentes.filter(function (e) {
      return e.estabelecimentoId === id && e.status === "retirado" && e.retiradoEm && e.retiradoEm.slice(0, 7) === mes;
    }));
    var descartado = soma(estado.descartes.filter(function (d) {
      return d.estabelecimentoId === id && d.data.slice(0, 7) === mes;
    }));
    var area = $("resumo-estabelecimento");
    area.textContent = "";
    area.appendChild(itemResumo("Redistribuídos em " + nomeMes, kg(redistribuido), false));
    area.appendChild(itemResumo("Descartados em " + nomeMes, kg(descartado), true));
  }

  function botaoAcao(texto, classe, acao, id, complemento) {
    var b = botao(texto, classe, complemento);
    b.setAttribute("data-acao", acao);
    b.setAttribute("data-id", id);
    return b;
  }

  function itemMeuExcedente(e) {
    var status = statusExibido(e);
    var li = criar("li", "item-excedente");
    var cabeca = criar("div", "item-excedente__cabeca");
    cabeca.appendChild(criar("p", "item-excedente__nome", e.alimento + " · " + kg(e.kg)));
    cabeca.appendChild(seloStatus(e));
    li.appendChild(cabeca);

    li.appendChild(criar("p", "item-excedente__dados",
      e.categoria + " · consumir até " + dataBR(e.consumirAte) +
      " · retirada em " + diaMes(e.retiradaData) + ", das " + e.retiradaInicio + " às " + e.retiradaFim));

    if (e.receptorId && receptorPorId[e.receptorId] && e.status !== "cancelado") {
      var quem = receptorPorId[e.receptorId].nome;
      li.appendChild(criar("p", "item-excedente__dados", e.status === "retirado"
        ? "Retirado por " + quem + (e.retiradoEm ? " em " + dataBR(e.retiradoEm) : "")
        : "Reservado por " + quem));
    }
    if (e.observacoes) li.appendChild(criar("p", "item-excedente__dados", "Observações: " + e.observacoes));
    if (status === "expirado" && e.descarteId) li.appendChild(criar("p", "item-excedente__dados", "Registrado como descarte."));

    var acoes = criar("div", "item-excedente__acoes");
    var descricao = e.alimento + ", " + kg(e.kg);
    if (status === "reservado") acoes.appendChild(botaoAcao("Confirmar retirada", "botao-pequeno", "confirmar", e.id, "de " + descricao));
    if (status === "disponivel" || status === "reservado") acoes.appendChild(botaoAcao("Cancelar anúncio", "botao-pequeno botao-pequeno--perigo", "cancelar", e.id, "de " + descricao));
    if (status === "expirado" && !e.descarteId) acoes.appendChild(botaoAcao("Registrar como descarte", "botao-pequeno botao-pequeno--perigo", "descartar", e.id, descricao));
    if (acoes.childNodes.length) li.appendChild(acoes);
    return li;
  }

  function grupoLista(titulo, itens, total, mensagemVazia) {
    var grupo = criar("div", "grupo-lista");
    grupo.appendChild(criar("h4", "grupo-lista__titulo", titulo + " (" + total + ")"));
    if (!itens.length) {
      grupo.appendChild(criar("p", "vazio", mensagemVazia));
      return grupo;
    }
    var lista = criar("ul", "lista-excedentes");
    lista.setAttribute("role", "list");
    itens.forEach(function (e) { lista.appendChild(itemMeuExcedente(e)); });
    grupo.appendChild(lista);
    return grupo;
  }

  function renderizarMeusExcedentes(id) {
    var meus = estado.excedentes.filter(function (e) { return e.estabelecimentoId === id; });
    var ativos = [];
    var vencidos = [];
    var historico = [];
    meus.forEach(function (e) {
      var status = statusExibido(e);
      if (status === "disponivel" || status === "reservado") ativos.push(e);
      else if (status === "expirado" && !e.descarteId) vencidos.push(e);
      else historico.push(e);
    });
    ativos.sort(function (a, b) { return a.consumirAte.localeCompare(b.consumirAte); });
    vencidos.sort(function (a, b) { return b.consumirAte.localeCompare(a.consumirAte); });
    historico.sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });

    areaMeusExcedentes.textContent = "";
    areaMeusExcedentes.appendChild(grupoLista("Ativos", ativos, ativos.length, "Nenhum excedente ativo. Use o formulário “Anunciar excedente”."));
    if (vencidos.length) {
      areaMeusExcedentes.appendChild(grupoLista("Vencidos sem retirada", vencidos, vencidos.length, ""));
    }
    var visiveis = historicoCompleto ? historico : historico.slice(0, LIMITE_HISTORICO);
    areaMeusExcedentes.appendChild(grupoLista("Histórico", visiveis, historico.length, "Ainda não há histórico."));
    if (historico.length > LIMITE_HISTORICO) {
      var b = botao(historicoCompleto ? "Mostrar menos" : "Mostrar todo o histórico (" + historico.length + ")", "botao-pequeno mais-historico");
      b.setAttribute("data-acao", "historico");
      b.setAttribute("aria-expanded", String(historicoCompleto));
      areaMeusExcedentes.appendChild(b);
    }
  }

  function aoClicarMeusExcedentes(evento) {
    var alvo = evento.target.closest("[data-acao]");
    if (!alvo) return;
    var acao = alvo.getAttribute("data-acao");

    if (acao === "historico") {
      historicoCompleto = !historicoCompleto;
      renderizarMeusExcedentes(selEstabelecimento.value);
      areaMeusExcedentes.querySelector('[data-acao="historico"]').focus();
      return;
    }

    var excedente = buscarExcedente(alvo.getAttribute("data-id"));
    if (!excedente) return;

    if (acao === "descartar") {
      preencherDescarteCom(excedente);
      return;
    }
    if (acao === "confirmar") {
      excedente.status = "retirado";
      excedente.retiradoEm = hoje();
      anunciar("Retirada confirmada: " + excedente.alimento + " ganhou um novo destino.");
    } else if (acao === "cancelar") {
      excedente.status = "cancelado";
      anunciar("Anúncio cancelado: " + excedente.alimento + ".");
    }
    salvar();
    renderizarEstabelecimento();
    areaMeusExcedentes.focus();
  }

  // "Registrar como descarte": pré-preenche o formulário com o excedente vencido
  function preencherDescarteCom(excedente) {
    $("des-alimento").value = excedente.alimento;
    $("des-categoria").value = excedente.categoria;
    $("des-kg").value = String(excedente.kg).replace(".", ",");
    $("des-data").value = hoje();
    $("des-motivo").value = "Vencimento";
    $("des-excedente-id").value = excedente.id;
    areaDica.hidden = true;
    formDescarte.scrollIntoView({ block: "start", behavior: movimentoReduzido() ? "auto" : "smooth" });
    $("des-alimento").focus({ preventScroll: true });
    anunciar("Formulário de descarte preenchido com " + excedente.alimento + ". Confira e registre.");
  }

  function movimentoReduzido() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* =========================================================
     4. VISÃO DE PESSOA OU INSTITUIÇÃO
     ========================================================= */
  var selReceptor = $("sel-receptor");
  var filtroCategoria = $("filtro-categoria");
  var filtroBairro = $("filtro-bairro");
  var filtroBusca = $("filtro-busca");
  var listaDisponiveis = $("lista-disponiveis");
  var listaReservas = $("lista-reservas");
  var temporizadorBusca = null;

  function iniciarReceptor() {
    preencherSelect(selReceptor, D.receptores.map(function (r) {
      return { valor: r.id, texto: r.nome + " (" + r.bairro + ")" };
    }), preferencias.receptor);
    preencherSelect(filtroCategoria, [{ valor: "", texto: "Todas" }].concat(D.categorias.map(function (c) {
      return { valor: c, texto: c };
    })), "");

    var bairros = [];
    D.estabelecimentos.forEach(function (e) { if (bairros.indexOf(e.bairro) === -1) bairros.push(e.bairro); });
    bairros.sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    preencherSelect(filtroBairro, [{ valor: "", texto: "Todos" }].concat(bairros.map(function (b) {
      return { valor: b, texto: b };
    })), "");

    selReceptor.addEventListener("change", function () {
      preferencias.receptor = selReceptor.value;
      salvarPreferencias();
      renderizarReceptor();
      anunciar("Agora você está como " + receptorPorId[selReceptor.value].nome + ".");
    });
    filtroCategoria.addEventListener("change", renderizarReceptor);
    filtroBairro.addEventListener("change", renderizarReceptor);
    filtroBusca.addEventListener("input", function () {
      window.clearTimeout(temporizadorBusca);
      temporizadorBusca = window.setTimeout(renderizarReceptor, 300);
    });

    $("titulo-reservas").setAttribute("tabindex", "-1");
    listaDisponiveis.addEventListener("click", aoClicarDisponiveis);
    listaReservas.addEventListener("click", aoClicarReservas);
  }

  function linhaDetalhe(nomeIcone, rotulo, valor) {
    var linha = criar("div");
    var dt = criar("dt");
    dt.appendChild(icone(nomeIcone));
    dt.appendChild(criar("span", "visualmente-oculto", rotulo));
    linha.appendChild(dt);
    linha.appendChild(criar("dd", null, valor));
    return linha;
  }

  function cardExcedente(e, h, amanha) {
    var est = estabelecimentoPorId[e.estabelecimentoId];
    var li = criar("li", "card-excedente");

    var topo = criar("div", "card-excedente__topo");
    topo.appendChild(criar("span", "card-excedente__categoria", e.categoria));
    if (e.consumirAte === h) topo.appendChild(criar("span", "selo-prazo", "Vence hoje"));
    else if (e.consumirAte === amanha) topo.appendChild(criar("span", "selo-prazo selo-prazo--amanha", "Vence amanhã"));
    li.appendChild(topo);

    var titulo = criar("h4", null, e.alimento + " ");
    titulo.appendChild(criar("span", "card-excedente__kg", "· " + kg(e.kg)));
    li.appendChild(titulo);

    var dl = criar("dl");
    dl.appendChild(linhaDetalhe("i-mercado", "Estabelecimento:", est.nome));
    dl.appendChild(linhaDetalhe("i-local", "Bairro:", est.bairro));
    dl.appendChild(linhaDetalhe("i-calendario", "Prazo:", "Consumir até " + dataBR(e.consumirAte)));
    dl.appendChild(linhaDetalhe("i-relogio", "Janela:", "Retirada em " + diaMes(e.retiradaData) + ", das " + e.retiradaInicio + " às " + e.retiradaFim));
    li.appendChild(dl);

    if (e.observacoes) li.appendChild(criar("p", "card-excedente__obs", "“" + e.observacoes + "”"));

    var b = botao("Solicitar retirada", "botao botao--primario", "de " + e.alimento + ", " + est.nome);
    b.setAttribute("data-acao", "solicitar");
    b.setAttribute("data-id", e.id);
    li.appendChild(b);
    return li;
  }

  function renderizarReceptor() {
    var h = hoje();
    var amanha = datas.somarDias(h, 1);
    var categoria = filtroCategoria.value;
    var bairro = filtroBairro.value;
    var termo = normalizar(filtroBusca.value);

    var disponiveis = estado.excedentes.filter(function (e) {
      if (e.status !== "disponivel" || e.consumirAte < h) return false;
      var est = estabelecimentoPorId[e.estabelecimentoId];
      if (categoria && e.categoria !== categoria) return false;
      if (bairro && est.bairro !== bairro) return false;
      if (termo && normalizar(e.alimento + " " + est.nome + " " + e.categoria).indexOf(termo) === -1) return false;
      return true;
    }).sort(function (a, b) {
      return a.consumirAte.localeCompare(b.consumirAte) || a.retiradaData.localeCompare(b.retiradaData);
    });

    $("contagem-disponiveis").textContent = disponiveis.length === 0
      ? "Nenhum excedente disponível com esses filtros."
      : disponiveis.length === 1 ? "1 excedente disponível" : disponiveis.length + " excedentes disponíveis";

    listaDisponiveis.textContent = "";
    disponiveis.forEach(function (e) { listaDisponiveis.appendChild(cardExcedente(e, h, amanha)); });
    renderizarReservas();
  }

  function renderizarReservas() {
    var id = selReceptor.value;
    var h = hoje();
    var reservas = estado.excedentes.filter(function (e) {
      return e.status === "reservado" && e.receptorId === id && e.consumirAte >= h;
    }).sort(function (a, b) { return a.retiradaData.localeCompare(b.retiradaData); });

    listaReservas.textContent = "";
    if (!reservas.length) {
      listaReservas.appendChild(criar("li", "vazio", "Nenhuma reserva ativa. Escolha um excedente e use “Solicitar retirada”."));
    }
    reservas.forEach(function (e) {
      var est = estabelecimentoPorId[e.estabelecimentoId];
      var li = criar("li");
      li.appendChild(criar("p", "item-excedente__nome", e.alimento + " · " + kg(e.kg)));
      li.appendChild(criar("p", "item-excedente__dados", est.nome + " (" + est.bairro + ")"));
      li.appendChild(criar("p", "item-excedente__dados",
        "Retirada em " + diaMes(e.retiradaData) + ", das " + e.retiradaInicio + " às " + e.retiradaFim));
      var b = botao("Cancelar reserva", "botao-pequeno botao-pequeno--perigo", "de " + e.alimento);
      b.setAttribute("data-acao", "cancelar-reserva");
      b.setAttribute("data-id", e.id);
      li.appendChild(b);
      listaReservas.appendChild(li);
    });
  }

  function aoClicarDisponiveis(evento) {
    var alvo = evento.target.closest('[data-acao="solicitar"]');
    if (!alvo) return;
    var excedente = buscarExcedente(alvo.getAttribute("data-id"));
    if (!excedente || excedente.status !== "disponivel") return;
    excedente.status = "reservado";
    excedente.receptorId = selReceptor.value;
    excedente.reservadoEm = hoje();
    salvar();
    renderizarReceptor();
    $("titulo-reservas").focus();
    anunciar("Retirada solicitada: " + excedente.alimento + " (" + estabelecimentoPorId[excedente.estabelecimentoId].nome + "). Veja em Minhas reservas.");
  }

  function aoClicarReservas(evento) {
    var alvo = evento.target.closest('[data-acao="cancelar-reserva"]');
    if (!alvo) return;
    var excedente = buscarExcedente(alvo.getAttribute("data-id"));
    if (!excedente) return;
    excedente.status = "disponivel";
    excedente.receptorId = null;
    excedente.reservadoEm = null;
    salvar();
    renderizarReceptor();
    $("titulo-reservas").focus();
    anunciar("Reserva cancelada: " + excedente.alimento + " voltou a ficar disponível.");
  }

  /* =========================================================
     5. PAINEL DE MONITORAMENTO
     ========================================================= */
  var selPeriodo = $("filtro-painel-periodo");
  var selPainelEstabelecimento = $("filtro-painel-estabelecimento");
  var DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0]; // de segunda a domingo
  var NOMES_DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var NOMES_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var DIAS_FRASE = ["Aos domingos", "Às segundas-feiras", "Às terças-feiras", "Às quartas-feiras", "Às quintas-feiras", "Às sextas-feiras", "Aos sábados"];
  var TEMA_CATEGORIA = {
    "Hortifrúti": "armazenamento",
    "Laticínios": "armazenamento",
    "Grãos e não perecíveis": "armazenamento",
    "Panificação": "planejamento de compras",
    "Refeições prontas": "planejamento de compras",
    "Outros": "aproveitamento integral"
  };
  // Verde para aproveitamento, laranja para descarte; tracejado e marcadores distinguem as séries
  var SERIES = [
    { chave: "disponibilizado", nome: "Disponibilizado", cor: "#1F4D3A", marcador: "circulo", tracejado: false },
    { chave: "redistribuido", nome: "Redistribuído", cor: "#2E7D5B", marcador: "quadrado", tracejado: true },
    { chave: "descartado", nome: "Descartado", cor: "#C9652D", marcador: "triangulo", tracejado: false }
  ];
  var ultimoCalculo = null;

  function iniciarPainel() {
    preencherSelect(selPainelEstabelecimento, [{ valor: "", texto: "Todos" }].concat(D.estabelecimentos.map(function (e) {
      return { valor: e.id, texto: e.nome };
    })), "");
    selPeriodo.addEventListener("change", renderizarPainel);
    selPainelEstabelecimento.addEventListener("change", renderizarPainel);
    document.querySelectorAll(".grafico").forEach(prepararFigura);
    $("leituras").addEventListener("click", alternarRegra);

    // Redesenha os gráficos na nova largura da tela
    var temporizador = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(function () {
        if (visaoAtual === "painel" && ultimoCalculo) desenharGraficos(ultimoCalculo);
      }, 200);
    });
  }

  // Botão "Ver dados em tabela" de cada gráfico
  function prepararFigura(figura) {
    var tabela = criar("div", "grafico__tabela");
    tabela.id = figura.id + "-tabela";
    tabela.hidden = true;

    var b = criar("button", "botao-pequeno grafico__botao");
    b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", tabela.id);
    b.appendChild(icone("i-tabela"));
    var rotulo = criar("span", null, "Ver dados em tabela");
    b.appendChild(rotulo);
    b.addEventListener("click", function () {
      var aberto = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", String(!aberto));
      tabela.hidden = aberto;
      rotulo.textContent = aberto ? "Ver dados em tabela" : "Ocultar tabela";
    });

    figura.appendChild(b);
    figura.appendChild(tabela);
  }

  /* ---------- Cálculos ---------- */
  function calcularPeriodo() {
    var h = hoje();
    var semanas;
    if (selPeriodo.value === "tudo") {
      var maisAntiga = h;
      estado.descartes.forEach(function (d) { if (d.data < maisAntiga) maisAntiga = d.data; });
      estado.excedentes.forEach(function (e) { if (e.criadoEm < maisAntiga) maisAntiga = e.criadoEm; });
      semanas = Math.max(1, Math.ceil((diasEntre(maisAntiga, h) + 1) / 7));
    } else {
      semanas = Number(selPeriodo.value);
    }
    return { inicio: datas.somarDias(h, -(semanas * 7 - 1)), fim: h, semanas: semanas };
  }

  function dentro(data, periodo) {
    return !!data && data >= periodo.inicio && data <= periodo.fim;
  }

  // Soma os kg por um campo e ordena do maior para o menor
  function agrupar(lista, campo) {
    var mapa = {};
    lista.forEach(function (item) { mapa[item[campo]] = (mapa[item[campo]] || 0) + item.kg; });
    return Object.keys(mapa).map(function (chave) { return { chave: chave, kg: mapa[chave] }; })
      .sort(function (a, b) { return b.kg - a.kg; });
  }

  function calcularPainel() {
    var periodo = calcularPeriodo();
    var estId = selPainelEstabelecimento.value;
    var h = hoje();
    function doFiltro(item) { return !estId || item.estabelecimentoId === estId; }

    var descartes = estado.descartes.filter(function (d) { return doFiltro(d) && dentro(d.data, periodo); });
    var disponibilizados = estado.excedentes.filter(function (e) {
      return doFiltro(e) && e.status !== "cancelado" && dentro(e.criadoEm, periodo);
    });
    var redistribuidos = estado.excedentes.filter(function (e) {
      return doFiltro(e) && e.status === "retirado" && dentro(e.retiradoEm, periodo);
    });

    // Média de descarte por dia da semana (total ÷ quantas vezes o dia aparece no período)
    var ocorrencias = [0, 0, 0, 0, 0, 0, 0];
    var totaisDia = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < periodo.semanas * 7; i++) {
      ocorrencias[datas.textoParaData(datas.somarDias(periodo.inicio, i)).getDay()] += 1;
    }
    descartes.forEach(function (d) { totaisDia[datas.textoParaData(d.data).getDay()] += d.kg; });
    var medias = totaisDia.map(function (t, dia) { return ocorrencias[dia] ? t / ocorrencias[dia] : 0; });
    var diaMaior = -1;
    medias.forEach(function (m, dia) { if (m > 0 && (diaMaior === -1 || m > medias[diaMaior])) diaMaior = dia; });

    // Evolução semanal
    var semanas = [];
    for (var s = 0; s < periodo.semanas; s++) {
      var semana = { inicio: datas.somarDias(periodo.inicio, s * 7) };
      semana.fim = datas.somarDias(semana.inicio, 6);
      semana.disponibilizado = soma(disponibilizados.filter(function (e) { return dentro(e.criadoEm, semana); }));
      semana.redistribuido = soma(redistribuidos.filter(function (e) { return dentro(e.retiradoEm, semana); }));
      semana.descartado = soma(descartes.filter(function (d) { return dentro(d.data, semana); }));
      semanas.push(semana);
    }

    // Variação: últimas 4 semanas em relação às 4 anteriores (não depende do período escolhido)
    var ultimas = { inicio: datas.somarDias(h, -27), fim: h };
    var anteriores = { inicio: datas.somarDias(h, -55), fim: datas.somarDias(h, -28) };
    var kgUltimas = soma(estado.descartes.filter(function (d) { return doFiltro(d) && dentro(d.data, ultimas); }));
    var kgAnteriores = soma(estado.descartes.filter(function (d) { return doFiltro(d) && dentro(d.data, anteriores); }));

    // Participantes com alguma atividade no período
    var estAtivos = {};
    var recAtivos = {};
    estado.excedentes.forEach(function (e) {
      if (!doFiltro(e)) return;
      if (dentro(e.criadoEm, periodo)) estAtivos[e.estabelecimentoId] = true;
      if (e.receptorId && (dentro(e.reservadoEm, periodo) || dentro(e.retiradoEm, periodo))) recAtivos[e.receptorId] = true;
    });
    descartes.forEach(function (d) { estAtivos[d.estabelecimentoId] = true; });

    // Ranking considera todos os estabelecimentos, inclusive os sem descarte
    var todosNoPeriodo = estado.descartes.filter(function (d) { return dentro(d.data, periodo); });
    var porEst = agrupar(todosNoPeriodo, "estabelecimentoId");
    D.estabelecimentos.forEach(function (e) {
      if (!porEst.some(function (g) { return g.chave === e.id; })) porEst.push({ chave: e.id, kg: 0 });
    });

    // Excedentes sem reserva que vencem hoje ou amanhã
    var amanha = datas.somarDias(h, 1);
    var vencendo = estado.excedentes.filter(function (e) {
      return doFiltro(e) && e.status === "disponivel" && e.consumirAte >= h && e.consumirAte <= amanha;
    });

    return {
      periodo: periodo,
      estId: estId,
      descartes: descartes,
      kgDisponibilizado: soma(disponibilizados),
      nDisponibilizados: disponibilizados.length,
      kgRedistribuido: soma(redistribuidos),
      nRedistribuidos: redistribuidos.length,
      kgDescartado: soma(descartes),
      medias: medias,
      totaisDia: totaisDia,
      diaMaior: diaMaior,
      porCategoria: agrupar(descartes, "categoria"),
      porMotivo: agrupar(descartes, "motivo"),
      porEstabelecimento: porEst,
      kgTodosNoPeriodo: soma(todosNoPeriodo),
      semanas: semanas,
      kgUltimas: kgUltimas,
      kgAnteriores: kgAnteriores,
      nEstabelecimentos: Object.keys(estAtivos).length,
      nReceptores: Object.keys(recAtivos).length,
      nVencendo: vencendo.length
    };
  }

  /* ---------- Desenho ---------- */
  function renderizarPainel() {
    var c = calcularPainel();
    ultimoCalculo = c;
    var nomeEst = c.estId ? estabelecimentoPorId[c.estId].nome : "Todos os estabelecimentos";
    $("painel-descricao-periodo").textContent = "De " + dataBR(c.periodo.inicio) + " a " + dataBR(c.periodo.fim) +
      " (" + c.periodo.semanas + (c.periodo.semanas === 1 ? " semana" : " semanas") + ") · " + nomeEst;
    renderizarIndicadores(c);
    renderizarLeituras(c);
    desenharGraficos(c);
    preencherTabelas(c);
  }

  function kpi(rotulo, valor, detalhe, descarte, nomeIcone) {
    var li = criar("li", "kpi" + (descarte ? " kpi--descarte" : ""));
    li.appendChild(criar("p", "kpi__rotulo", rotulo));
    li.appendChild(criar("p", "kpi__valor", valor));
    var p = criar("p", "kpi__detalhe");
    if (nomeIcone) p.appendChild(icone(nomeIcone));
    p.appendChild(document.createTextNode(detalhe));
    li.appendChild(p);
    return li;
  }

  function plural(n, singular, plural) {
    return n + " " + (n === 1 ? singular : plural);
  }

  function renderizarIndicadores(c) {
    var lista = $("indicadores");
    lista.textContent = "";
    lista.appendChild(kpi("Disponibilizados para reaproveitamento", kg(c.kgDisponibilizado),
      plural(c.nDisponibilizados, "anúncio", "anúncios") + " no período", false));
    lista.appendChild(kpi("Redistribuídos a pessoas e instituições", kg(c.kgRedistribuido),
      plural(c.nRedistribuidos, "retirada confirmada", "retiradas confirmadas"), false));
    lista.appendChild(kpi("Descartados", kg(c.kgDescartado),
      plural(c.descartes.length, "registro", "registros") + " de descarte", true));

    if (c.kgAnteriores > 0) {
      var variacao = (c.kgUltimas / c.kgAnteriores - 1) * 100;
      var sinal = variacao > 0.05 ? "+" : variacao < -0.05 ? "−" : "";
      var tipo = variacao > 0.05 ? "Aumento" : variacao < -0.05 ? "Redução" : "Estável";
      lista.appendChild(kpi("Variação do descarte", sinal + formatoKg.format(Math.abs(variacao)) + "%",
        tipo + ": últimas 4 semanas (" + kg(c.kgUltimas) + ") em relação às 4 anteriores (" + kg(c.kgAnteriores) + ")",
        variacao > 0.05, variacao > 0.05 ? "i-subida" : "i-queda"));
    } else {
      lista.appendChild(kpi("Variação do descarte", "—", "Sem registros nas 4 semanas anteriores para comparar.", false));
    }

    lista.appendChild(kpi("Participantes", String(c.nEstabelecimentos + c.nReceptores),
      plural(c.nEstabelecimentos, "estabelecimento", "estabelecimentos") + " e " +
      plural(c.nReceptores, "pessoa ou instituição", "pessoas ou instituições") + " com atividade", false));
  }

  function areaGrafico(id) {
    return document.querySelector("#" + id + " .grafico__area");
  }

  function participacao(valor, total) {
    return total > 0 ? percentual((valor / total) * 100) : "0%";
  }

  function desenharGraficos(c) {
    // 1. Descarte médio por dia da semana
    G.barrasVerticais(areaGrafico("grafico-dias"), {
      dados: DIAS_ORDEM.map(function (dia) {
        return { rotulo: NOMES_DIAS[dia], rotuloCurto: NOMES_DIAS_CURTOS[dia], valor: c.medias[dia], destaque: dia === c.diaMaior };
      }),
      formatar: function (v) { return formatoKg.format(v); },
      descricao: "Gráfico de barras do descarte médio por dia da semana, em kg." +
        (c.diaMaior >= 0 ? " Maior média: " + NOMES_DIAS[c.diaMaior].toLowerCase() + ", " + kg(c.medias[c.diaMaior]) + "." : "")
    });

    // 2. Descarte por categoria
    G.barrasHorizontais(areaGrafico("grafico-categorias"), {
      dados: c.porCategoria.map(function (g) {
        return { rotulo: g.chave, valor: g.kg, complemento: " (" + participacao(g.kg, c.kgDescartado) + ")" };
      }),
      formatar: kg,
      descricao: "Gráfico de barras horizontais do descarte por categoria." +
        (c.porCategoria.length ? " Maior: " + c.porCategoria[0].chave + ", " + kg(c.porCategoria[0].kg) + "." : "")
    });

    // 3. Motivos de descarte
    G.barrasHorizontais(areaGrafico("grafico-motivos"), {
      dados: c.porMotivo.map(function (g) {
        return { rotulo: g.chave, valor: g.kg, complemento: " (" + participacao(g.kg, c.kgDescartado) + ")" };
      }),
      formatar: kg,
      descricao: "Gráfico de barras horizontais dos motivos de descarte." +
        (c.porMotivo.length ? " Principal motivo: " + c.porMotivo[0].chave + ", " + kg(c.porMotivo[0].kg) + "." : "")
    });

    // 4. Evolução semanal
    var areaSemanas = areaGrafico("grafico-semanas");
    G.linhas(areaSemanas, {
      series: SERIES.map(function (s) {
        return {
          nome: s.nome, cor: s.cor, marcador: s.marcador, tracejado: s.tracejado,
          valores: c.semanas.map(function (semana) { return semana[s.chave]; })
        };
      }),
      rotulosX: c.semanas.map(function (semana) { return diaMes(semana.inicio); }),
      formatar: kg,
      formatarEixo: function (v) { return formatoInteiro.format(v); },
      descricao: "Gráfico de linhas com os kg disponibilizados, redistribuídos e descartados em cada semana do período. Os valores estão na tabela."
    });
    if (areaSemanas.querySelector("svg")) {
      var legenda = criar("ul", "grafico__legenda");
      legenda.setAttribute("aria-hidden", "true"); // o gráfico já descreve as séries
      SERIES.forEach(function (s) {
        var li = criar("li");
        li.appendChild(G.amostraLegenda(s));
        li.appendChild(document.createTextNode(s.nome));
        legenda.appendChild(li);
      });
      areaSemanas.appendChild(legenda);
    }

    // 5. Ranking de estabelecimentos
    G.barrasHorizontais(areaGrafico("grafico-ranking"), {
      dados: c.porEstabelecimento.map(function (g, i) {
        return {
          rotulo: (i + 1) + "º " + estabelecimentoPorId[g.chave].nome,
          valor: g.kg,
          destaque: g.chave === c.estId,
          complemento: " (" + participacao(g.kg, c.kgTodosNoPeriodo) + ")"
        };
      }),
      formatar: kg,
      descricao: "Ranking dos estabelecimentos por kg descartados no período." +
        (c.porEstabelecimento.length && c.porEstabelecimento[0].kg > 0
          ? " Primeiro lugar: " + estabelecimentoPorId[c.porEstabelecimento[0].chave].nome + "." : "")
    });
  }

  /* ---------- Tabelas (alternativa aos gráficos) ---------- */
  function montarTabela(idFigura, legenda, cabecalhos, linhas, colunasNumericas) {
    var area = $(idFigura + "-tabela");
    area.textContent = "";
    if (!linhas.length) {
      area.appendChild(criar("p", "vazio", "Sem registros no período selecionado."));
      return;
    }
    var tabela = criar("table");
    tabela.appendChild(criar("caption", null, legenda));
    var thead = criar("thead");
    var linhaCabecalho = criar("tr");
    cabecalhos.forEach(function (texto, i) {
      var th = criar("th", colunasNumericas.indexOf(i) !== -1 ? "num" : null, texto);
      th.setAttribute("scope", "col");
      linhaCabecalho.appendChild(th);
    });
    thead.appendChild(linhaCabecalho);
    tabela.appendChild(thead);

    var tbody = criar("tbody");
    linhas.forEach(function (linha) {
      var tr = criar("tr");
      linha.forEach(function (valor, i) {
        var celula = i === 0 ? criar("th", null, valor) : criar("td", colunasNumericas.indexOf(i) !== -1 ? "num" : null, valor);
        if (i === 0) celula.setAttribute("scope", "row");
        tr.appendChild(celula);
      });
      tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);
    area.appendChild(tabela);
  }

  function preencherTabelas(c) {
    montarTabela("grafico-dias", "Descarte por dia da semana", ["Dia", "Média por dia (kg)", "Total no período (kg)"],
      DIAS_ORDEM.map(function (dia) {
        return [NOMES_DIAS[dia], formatoKg.format(c.medias[dia]), formatoKg.format(c.totaisDia[dia])];
      }), [1, 2]);

    montarTabela("grafico-categorias", "Descarte por categoria", ["Categoria", "kg", "Participação"],
      c.porCategoria.map(function (g) {
        return [g.chave, formatoKg.format(g.kg), participacao(g.kg, c.kgDescartado)];
      }), [1, 2]);

    montarTabela("grafico-motivos", "Motivos de descarte", ["Motivo", "kg", "Participação"],
      c.porMotivo.map(function (g) {
        return [g.chave, formatoKg.format(g.kg), participacao(g.kg, c.kgDescartado)];
      }), [1, 2]);

    montarTabela("grafico-semanas", "Evolução semanal (kg)", ["Semana", "Disponibilizado", "Redistribuído", "Descartado"],
      c.semanas.map(function (s) {
        return [diaMes(s.inicio) + " a " + diaMes(s.fim), formatoKg.format(s.disponibilizado),
          formatoKg.format(s.redistribuido), formatoKg.format(s.descartado)];
      }), [1, 2, 3]);

    montarTabela("grafico-ranking", "Estabelecimentos por kg descartados", ["Posição", "Estabelecimento", "kg", "Participação"],
      c.porEstabelecimento.map(function (g, i) {
        return [(i + 1) + "º", estabelecimentoPorId[g.chave].nome, formatoKg.format(g.kg), participacao(g.kg, c.kgTodosNoPeriodo)];
      }), [2, 3]);
  }

  /* ---------- Leituras automáticas (regras simples, sem IA) ---------- */
  function gerarLeituras(c) {
    var leituras = [];

    // Regra 1: dia da semana com descarte bem acima dos demais
    if (c.diaMaior >= 0) {
      var outros = [];
      c.medias.forEach(function (m, dia) { if (dia !== c.diaMaior) outros.push(m); });
      var mediaOutros = outros.reduce(function (a, b) { return a + b; }, 0) / outros.length;
      var acima = mediaOutros > 0 ? (c.medias[c.diaMaior] / mediaOutros - 1) * 100 : 0;
      if (acima >= 20) {
        leituras.push({
          texto: DIAS_FRASE[c.diaMaior] + ", o descarte médio é de " + kg(c.medias[c.diaMaior]) + ", " +
            percentual(acima) + " acima da média dos outros dias. Sugestão: revisar a produção e o planejamento de compras para esse dia.",
          regra: "Compara a média diária de descarte de cada dia da semana, no período e no estabelecimento escolhidos. A frase aparece quando o dia com maior média fica pelo menos 20% acima da média dos outros seis dias."
        });
      }
    }

    // Regra 2: categoria que concentra o descarte
    if (c.porCategoria.length && c.kgDescartado > 0) {
      var principal = c.porCategoria[0];
      var parte = (principal.kg / c.kgDescartado) * 100;
      if (parte >= 30) {
        leituras.push({
          texto: principal.chave + " concentra " + percentual(parte) + " do descarte do período. ",
          link: { texto: "Veja as dicas de " + TEMA_CATEGORIA[principal.chave] + ".", href: "index.html#conteudo-educativo" },
          regra: "Soma os kg descartados por categoria no período. A frase aparece quando uma categoria responde por 30% ou mais do total."
        });
      }
    }

    // Regra 3: estabelecimento com grande parte do descarte (só com o filtro "Todos")
    if (!c.estId && c.kgDescartado > 0) {
      var maior = c.porEstabelecimento[0];
      var fatia = (maior.kg / c.kgDescartado) * 100;
      if (fatia >= 25) {
        var est = estabelecimentoPorId[maior.chave];
        leituras.push({
          texto: est.artigo + " " + est.nome + " responde por " + percentual(fatia) + " do descarte do período.",
          regra: "Soma os kg descartados por estabelecimento no período. A frase aparece quando um estabelecimento responde por 25% ou mais do total (só com o filtro “Todos”)."
        });
      }
    }

    // Regra 4: excedentes perto do prazo sem reserva
    if (c.nVencendo > 0) {
      leituras.push({
        texto: c.nVencendo === 1
          ? "1 excedente vence hoje ou amanhã e ainda não tem reserva."
          : c.nVencendo + " excedentes vencem hoje ou amanhã e ainda não têm reserva.",
        regra: "Conta os excedentes com status Disponível (sem reserva) cujo prazo “consumir até” é hoje ou amanhã. Não depende do período escolhido."
      });
    }
    return leituras.slice(0, 4);
  }

  function renderizarLeituras(c) {
    var lista = $("leituras");
    lista.textContent = "";
    var leituras = gerarLeituras(c);
    if (!leituras.length) {
      lista.appendChild(criar("li", "vazio", "Nenhuma regra foi atendida com os filtros atuais."));
      return;
    }
    leituras.forEach(function (leitura, i) {
      var li = criar("li", "leitura");
      var linha = criar("div", "leitura__linha");
      var p = criar("p", "leitura__texto", leitura.texto);
      if (leitura.link) {
        var a = criar("a", null, leitura.link.texto);
        a.href = leitura.link.href;
        p.appendChild(a);
      }
      linha.appendChild(p);

      var idRegra = "regra-leitura-" + (i + 1);
      var b = criar("button", "botao-info");
      b.type = "button";
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-controls", idRegra);
      b.appendChild(icone("i-info"));
      b.appendChild(criar("span", "visualmente-oculto", "Ver a regra desta leitura"));
      linha.appendChild(b);
      li.appendChild(linha);

      var regra = criar("p", "leitura__regra", "Regra: " + leitura.regra);
      regra.id = idRegra;
      regra.hidden = true;
      li.appendChild(regra);
      lista.appendChild(li);
    });
  }

  function alternarRegra(evento) {
    var b = evento.target.closest(".botao-info");
    if (!b) return;
    var aberto = b.getAttribute("aria-expanded") === "true";
    b.setAttribute("aria-expanded", String(!aberto));
    $(b.getAttribute("aria-controls")).hidden = aberto;
  }

  /* =========================================================
     INÍCIO
     ========================================================= */
  // A faixa de aviso fixa cobre o topo: ajusta a rolagem para não esconder o conteúdo
  function ajustarRolagem() {
    var faixa = document.querySelector(".aviso-ficticio");
    function ajustar() {
      document.documentElement.style.scrollPaddingTop = (faixa.offsetHeight + 16) + "px";
    }
    ajustar();
    window.addEventListener("resize", ajustar);
  }

  function iniciar() {
    carregarDados();
    iniciarAbas();
    iniciarDialogo();
    iniciarFaixaAviso();
    iniciarEstabelecimento();
    iniciarReceptor();
    iniciarPainel();
    ajustarRolagem();

    var inicial = window.location.hash.replace("#", "");
    mostrarVisao(VISOES.indexOf(inicial) !== -1 ? inicial : "estabelecimento");

    if (!armazenamentoDisponivel) {
      anunciar("Este navegador não permite salvar: a demonstração funciona, mas os registros somem ao fechar a página.");
    }
  }

  iniciar();
})();
