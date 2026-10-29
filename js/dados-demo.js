/* =============================================================
   DADOS DA DEMONSTRAÇÃO — tudo aqui é FICTÍCIO.
   -------------------------------------------------------------
   • Cadastros com nomes inventados (bairros reais de Salvador
     apenas para dar contexto local).
   • Gerador de um histórico de 8 semanas que termina no dia de
     hoje, com sorteio de semente fixa (resultado reproduzível).
   ============================================================= */
(function () {
  "use strict";

  var SEMENTE = 20261029;  // muda a semente → muda o histórico gerado
  var VERSAO = 1;          // aumente se mudar o formato dos dados

  /* ---------- Cadastros fictícios ---------- */
  var estabelecimentos = [
    { id: "est-alfa", nome: "Supermercado Alfa", artigo: "O", tipo: "Supermercado", bairro: "Pituba" },
    { id: "est-beta", nome: "Padaria Beta", artigo: "A", tipo: "Padaria", bairro: "Barra" },
    { id: "est-delta", nome: "Restaurante Delta", artigo: "O", tipo: "Restaurante", bairro: "Rio Vermelho" },
    { id: "est-epsilon", nome: "Feira Épsilon", artigo: "A", tipo: "Feira", bairro: "Liberdade" },
    { id: "est-zeta", nome: "Mercadinho Zeta", artigo: "O", tipo: "Pequeno comércio", bairro: "Cabula" },
    { id: "est-eta", nome: "Hortifrúti Eta", artigo: "O", tipo: "Hortifrúti", bairro: "Itapuã" }
  ];

  var receptores = [
    { id: "rec-gama", nome: "Associação Comunitária Gama", tipo: "instituicao", bairro: "Liberdade" },
    { id: "rec-teta", nome: "Casa de Acolhimento Teta", tipo: "instituicao", bairro: "Brotas" },
    { id: "rec-iota", nome: "Cozinha Solidária Iota", tipo: "instituicao", bairro: "Itapuã" },
    { id: "rec-pessoa", nome: "Pessoa cadastrada (exemplo)", tipo: "pessoa", bairro: "Cabula" }
  ];

  var categorias = ["Hortifrúti", "Panificação", "Laticínios", "Refeições prontas", "Grãos e não perecíveis", "Outros"];

  var motivos = [
    "Vencimento",
    "Aparência ou dano",
    "Excesso de produção ou compra",
    "Armazenamento inadequado",
    "Sobra de preparo",
    "Outro"
  ];

  /* REVISAR: dicas educativas de exemplo, mostradas depois de registrar
     um descarte. A equipe deve validar o texto. */
  var dicasPorMotivo = {
    "Vencimento": {
      tema: "Planejamento de compras",
      texto: "Organize o estoque pela regra “primeiro que vence, primeiro que sai” e anuncie como excedente o que está perto do prazo, enquanto ainda pode ser aproveitado."
    },
    "Aparência ou dano": {
      tema: "Aproveitamento integral",
      texto: "Alimentos com aparência imperfeita, mas próprios para consumo, podem virar sucos, doces, sopas ou refogados, ou ser anunciados como excedente."
    },
    "Excesso de produção ou compra": {
      tema: "Planejamento de compras",
      texto: "Compare o que foi produzido ou comprado com o que foi vendido em cada dia da semana e ajuste as quantidades dos dias com mais sobra."
    },
    "Armazenamento inadequado": {
      tema: "Armazenamento adequado",
      texto: "Revise onde cada alimento é guardado: recipientes fechados, etiquetas com data e os itens mais antigos à frente ajudam a evitar perdas."
    },
    "Sobra de preparo": {
      tema: "Aproveitamento integral",
      texto: "Talos, cascas e aparas limpas podem entrar em caldos, recheios e refogados. Registrar as sobras ajuda a ajustar as porções."
    },
    "Outro": {
      tema: "Monitoramento",
      texto: "Descreva o motivo nas próximas vezes: registros detalhados ajudam o painel a encontrar padrões e sugerir prevenção."
    }
  };

  /* ---------- Datas sempre no horário local ---------- */
  // Evita new Date("AAAA-MM-DD"), que é lido como UTC e vira o dia anterior no Brasil
  function doisDigitos(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function dataParaTexto(data) {
    return data.getFullYear() + "-" + doisDigitos(data.getMonth() + 1) + "-" + doisDigitos(data.getDate());
  }

  function textoParaData(texto) {
    var p = texto.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function somarDias(texto, dias) {
    var d = textoParaData(texto);
    return dataParaTexto(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias));
  }

  function hojeTexto() {
    return dataParaTexto(new Date());
  }

  /* ---------- Identificadores ---------- */
  var contadorIds = 0;
  function novoId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      try { return window.crypto.randomUUID(); } catch (e) { /* segue para o fallback */ }
    }
    contadorIds += 1;
    return "id-" + Date.now().toString(36) + "-" + contadorIds + "-" + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Sorteio com semente fixa (mulberry32) ---------- */
  function criarSorteio(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Escolhe uma chave de um objeto { opção: peso }
  function escolherPeso(sorteio, pesos) {
    var chaves = Object.keys(pesos);
    var total = 0;
    chaves.forEach(function (c) { total += pesos[c]; });
    var alvo = sorteio() * total;
    for (var i = 0; i < chaves.length; i++) {
      alvo -= pesos[chaves[i]];
      if (alvo <= 0) return chaves[i];
    }
    return chaves[chaves.length - 1];
  }

  function escolher(sorteio, lista) {
    return lista[Math.floor(sorteio() * lista.length)];
  }

  function arredondar(kg) {
    return Math.max(0.1, Math.round(kg * 10) / 10);
  }

  /* ---------- Perfis usados pelo gerador ---------- */
  // Peso do descarte por dia da semana (0 = domingo … 6 = sábado):
  // pico na segunda-feira e outro menor no sábado.
  var PESO_DIA = [0.8, 1.75, 0.9, 0.85, 0.95, 1.0, 1.35];

  // kg médios descartados por dia, chance de anunciar excedente e categorias típicas
  var PERFIS = {
    "est-alfa": { descarteDia: 9, chanceExcedente: 0.6, categorias: { "Hortifrúti": 5, "Laticínios": 2, "Panificação": 1.5, "Grãos e não perecíveis": 0.8, "Refeições prontas": 0.5, "Outros": 0.5 } },
    "est-beta": { descarteDia: 3.5, chanceExcedente: 0.65, categorias: { "Panificação": 6, "Laticínios": 1.2, "Outros": 0.5 } },
    "est-delta": { descarteDia: 4.5, chanceExcedente: 0.5, categorias: { "Refeições prontas": 5, "Hortifrúti": 2, "Grãos e não perecíveis": 1 } },
    "est-epsilon": { descarteDia: 6, chanceExcedente: 0.45, categorias: { "Hortifrúti": 8, "Outros": 0.6 } },
    "est-zeta": { descarteDia: 2.5, chanceExcedente: 0.3, categorias: { "Laticínios": 2, "Panificação": 1.5, "Hortifrúti": 2, "Grãos e não perecíveis": 1, "Outros": 1 } },
    "est-eta": { descarteDia: 5, chanceExcedente: 0.5, categorias: { "Hortifrúti": 9, "Outros": 0.4 } }
  };

  // Motivos mais comuns em cada categoria
  var MOTIVOS_CATEGORIA = {
    "Hortifrúti": { "Aparência ou dano": 4, "Vencimento": 2, "Armazenamento inadequado": 2.2, "Excesso de produção ou compra": 1.5, "Outro": 0.3 },
    "Panificação": { "Excesso de produção ou compra": 5, "Vencimento": 2, "Armazenamento inadequado": 0.5, "Outro": 0.3 },
    "Laticínios": { "Vencimento": 5, "Armazenamento inadequado": 1.2, "Aparência ou dano": 0.6, "Outro": 0.2 },
    "Refeições prontas": { "Sobra de preparo": 5, "Excesso de produção ou compra": 2, "Armazenamento inadequado": 0.5 },
    "Grãos e não perecíveis": { "Vencimento": 3, "Aparência ou dano": 2, "Armazenamento inadequado": 1 },
    "Outros": { "Vencimento": 2, "Outro": 2, "Aparência ou dano": 1 }
  };

  var ALIMENTOS = {
    "Hortifrúti": ["Tomate", "Banana", "Alface", "Mamão", "Cenoura", "Laranja", "Couve", "Manga", "Abóbora", "Pimentão"],
    "Panificação": ["Pão francês", "Pão de forma", "Bolo simples", "Pão doce", "Pão integral"],
    "Laticínios": ["Iogurte", "Leite", "Queijo minas", "Requeijão", "Bebida láctea"],
    "Refeições prontas": ["Arroz cozido", "Feijão cozido", "Marmitas", "Salada pronta", "Legumes refogados"],
    "Grãos e não perecíveis": ["Arroz", "Feijão", "Macarrão", "Farinha de mandioca", "Fubá"],
    "Outros": ["Suco natural", "Ovos", "Polpa de fruta", "Tapioca"]
  };

  // Dias até o "consumir até", contados a partir do anúncio
  var VALIDADE = {
    "Hortifrúti": [1, 3], "Panificação": [0, 1], "Laticínios": [2, 5],
    "Refeições prontas": [0, 0], "Grãos e não perecíveis": [5, 15], "Outros": [1, 4]
  };

  var JANELAS = [["08:00", "11:00"], ["09:00", "12:00"], ["13:00", "16:00"], ["14:00", "17:00"], ["15:00", "18:00"], ["17:00", "20:00"]];

  function sortearInteiro(sorteio, min, max) {
    return min + Math.floor(sorteio() * (max - min + 1));
  }

  /* ---------- Gerador do histórico de exemplo ---------- */
  function gerarDadosExemplo() {
    var sorteio = criarSorteio(SEMENTE);
    var hoje = hojeTexto();
    var inicio = somarDias(hoje, -55); // 56 dias = 8 semanas terminando hoje
    var excedentes = [];
    var descartes = [];

    for (var d = 0; d < 56; d++) {
      var dia = somarDias(inicio, d);
      var diaSemana = textoParaData(dia).getDay();
      var ehHoje = dia === hoje;

      estabelecimentos.forEach(function (est) {
        var perfil = PERFIS[est.id];

        /* Descartes do dia (até ontem, mais um parcial de hoje) */
        var totalDia = perfil.descarteDia * PESO_DIA[diaSemana] * (0.7 + sorteio() * 0.6);
        if (ehHoje) totalDia *= 0.4;
        var registros = totalDia > 6 ? 3 : totalDia > 2.5 ? 2 : 1;
        if (ehHoje && sorteio() < 0.5) registros = 0;
        for (var r = 0; r < registros; r++) {
          var categoria = escolherPeso(sorteio, perfil.categorias);
          descartes.push({
            id: novoId(),
            estabelecimentoId: est.id,
            alimento: escolher(sorteio, ALIMENTOS[categoria]),
            categoria: categoria,
            kg: arredondar((totalDia / registros) * (0.75 + sorteio() * 0.5)),
            data: dia,
            motivo: escolherPeso(sorteio, MOTIVOS_CATEGORIA[categoria])
          });
        }

        /* Excedentes anunciados no dia (o desfecho depende do prazo) */
        if (sorteio() < perfil.chanceExcedente) {
          var catExc = escolherPeso(sorteio, perfil.categorias);
          var validade = VALIDADE[catExc];
          var consumirAte = somarDias(dia, sortearInteiro(sorteio, validade[0], validade[1]));
          var janela = escolher(sorteio, JANELAS);
          var excedente = {
            id: novoId(),
            estabelecimentoId: est.id,
            alimento: escolher(sorteio, ALIMENTOS[catExc]),
            categoria: catExc,
            kg: arredondar(perfil.descarteDia * 0.6 * (0.5 + sorteio())),
            consumirAte: consumirAte,
            retiradaData: dia,
            retiradaInicio: janela[0],
            retiradaFim: janela[1],
            observacoes: "",
            status: "disponivel",
            receptorId: null,
            criadoEm: dia,
            reservadoEm: null,
            retiradoEm: null,
            descarteId: null
          };

          var desfecho = sorteio();
          if (consumirAte >= hoje) {
            // Ainda no prazo: fica disponível, reservado ou já retirado
            if (desfecho < 0.35 && !ehHoje) {
              excedente.status = "retirado";
            } else if (desfecho < 0.55) {
              excedente.status = "reservado";
            }
          } else if (desfecho < 0.72) {
            excedente.status = "retirado";
          } else if (desfecho < 0.82) {
            excedente.status = "cancelado";
          }
          // Os demais vencem sem retirada (status "Expirado" é calculado na exibição)

          // Ainda no prazo e sem retirada: a janela de retirada passa para hoje
          if (consumirAte >= hoje && excedente.status !== "retirado" && excedente.retiradaData < hoje) {
            excedente.retiradaData = hoje;
          }

          if (excedente.status === "retirado" || excedente.status === "reservado") {
            excedente.receptorId = escolher(sorteio, receptores).id;
            excedente.reservadoEm = dia;
          }
          if (excedente.status === "retirado") {
            var ultimoDia = consumirAte < hoje ? consumirAte : somarDias(hoje, -1);
            excedente.retiradoEm = ultimoDia > dia && sorteio() < 0.5 ? somarDias(dia, 1) : dia;
          }

          // Expirados antigos já viraram registro de descarte (motivo: vencimento)
          if (excedente.status === "disponivel" && consumirAte < somarDias(hoje, -2)) {
            var descarte = {
              id: novoId(),
              estabelecimentoId: est.id,
              alimento: excedente.alimento,
              categoria: excedente.categoria,
              kg: excedente.kg,
              data: somarDias(consumirAte, 1),
              motivo: "Vencimento"
            };
            descartes.push(descarte);
            excedente.descarteId = descarte.id;
          }
          excedentes.push(excedente);
        }
      });
    }

    /* Excedentes disponíveis "agora", com vencimentos variados */
    var ofertasAgora = [
      ["est-alfa", "Hortifrúti", "Banana", 0, 0, "15:00", "18:00", "Cachos maduros, ideais para consumo imediato."],
      ["est-beta", "Panificação", "Pão francês", 0, 0, "17:00", "20:00", ""],
      ["est-delta", "Refeições prontas", "Marmitas", 0, 0, "14:00", "16:00", "Embaladas e etiquetadas no dia."],
      ["est-epsilon", "Hortifrúti", "Tomate", 1, 0, "08:00", "11:00", ""],
      ["est-eta", "Hortifrúti", "Mamão", 1, 1, "09:00", "12:00", ""],
      ["est-alfa", "Laticínios", "Iogurte", 1, 0, "13:00", "17:00", "Dentro do prazo, mantidos refrigerados."],
      ["est-zeta", "Panificação", "Pão de forma", 2, 1, "09:00", "12:00", ""],
      ["est-alfa", "Grãos e não perecíveis", "Arroz", 4, 1, "14:00", "18:00", "Embalagens com amassados, conteúdo intacto."],
      ["est-epsilon", "Hortifrúti", "Abóbora", 3, 1, "08:00", "11:00", ""],
      ["est-zeta", "Outros", "Ovos", 5, 2, "15:00", "18:00", ""]
    ];
    ofertasAgora.forEach(function (o, i) {
      var reservado = i === 3 || i === 7; // dois já reservados
      excedentes.push({
        id: novoId(),
        estabelecimentoId: o[0],
        alimento: o[2],
        categoria: o[1],
        kg: arredondar(2 + sorteio() * 10),
        consumirAte: somarDias(hoje, o[3]),
        retiradaData: somarDias(hoje, o[4]),
        retiradaInicio: o[5],
        retiradaFim: o[6],
        observacoes: o[7],
        status: reservado ? "reservado" : "disponivel",
        receptorId: reservado ? (i === 3 ? "rec-gama" : "rec-teta") : null,
        criadoEm: hoje,
        reservadoEm: reservado ? hoje : null,
        retiradoEm: null,
        descarteId: null
      });
    });

    return {
      meta: { versao: VERSAO, origem: "exemplo", modificado: false, geradoEm: hoje },
      excedentes: excedentes,
      descartes: descartes
    };
  }

  // Estado sem registros (usado por "Apagar tudo"); os cadastros continuam
  function gerarDadosVazios() {
    return {
      meta: { versao: VERSAO, origem: "vazio", modificado: true, geradoEm: hojeTexto() },
      excedentes: [],
      descartes: []
    };
  }

  window.DADOS_DEMO = {
    VERSAO: VERSAO,
    estabelecimentos: estabelecimentos,
    receptores: receptores,
    categorias: categorias,
    motivos: motivos,
    dicasPorMotivo: dicasPorMotivo,
    gerarDadosExemplo: gerarDadosExemplo,
    gerarDadosVazios: gerarDadosVazios,
    datas: {
      dataParaTexto: dataParaTexto,
      textoParaData: textoParaData,
      somarDias: somarDias,
      hojeTexto: hojeTexto
    },
    novoId: novoId
  };
})();
