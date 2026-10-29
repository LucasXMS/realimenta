/* =============================================================
   MAIN — interações do index.html
   Todo o texto já está no HTML. Este arquivo só acrescenta:
   menu do celular, seção ativa, contadores, alternador do
   diagrama, acordeões e o ciclo clicável da metodologia.
   ============================================================= */
(function () {
  "use strict";

  var temObservador = "IntersectionObserver" in window;
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- Utilitários ---------- */

  // Escuta mudanças de largura de tela (com suporte a navegadores antigos)
  function aoMudarMidia(consulta, funcao) {
    if (consulta.addEventListener) consulta.addEventListener("change", funcao);
    else consulta.addListener(funcao);
  }

  // Formata números no padrão brasileiro (vírgula decimal)
  var formatadores = {};
  function formatarNumero(valor, decimais) {
    if (!formatadores[decimais]) {
      formatadores[decimais] = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
      });
    }
    return formatadores[decimais].format(valor);
  }

  // Cria um ícone da biblioteca SVG (sprite) do próprio HTML
  function criarIcone(nome, classe) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icone " + (classe || ""));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var uso = document.createElementNS(SVG_NS, "use");
    uso.setAttribute("href", "#" + nome);
    svg.appendChild(uso);
    return svg;
  }

  /* ---------- 1. Menu recolhível (celular) ---------- */
  function iniciarMenu() {
    var botao = document.querySelector(".nav__botao");
    var painel = document.getElementById("nav-painel");
    if (!botao || !painel) return;

    var texto = botao.querySelector(".nav__botao-texto");
    var icone = botao.querySelector("use");
    var telaLarga = window.matchMedia("(min-width: 68.75em)");
    botao.hidden = false;

    function estaAberto() {
      return botao.getAttribute("aria-expanded") === "true";
    }

    function definirAberto(aberto, devolverFoco) {
      botao.setAttribute("aria-expanded", String(aberto));
      painel.classList.toggle("nav__painel--aberto", aberto);
      texto.textContent = aberto ? "Fechar" : "Menu";
      icone.setAttribute("href", aberto ? "#i-fechar" : "#i-menu");
      if (!aberto && devolverFoco) botao.focus();
    }

    botao.addEventListener("click", function () {
      definirAberto(!estaAberto());
    });

    // Fecha ao escolher um link do menu
    painel.addEventListener("click", function (evento) {
      if (evento.target.closest("a") && !telaLarga.matches) definirAberto(false);
    });

    // Fecha com Esc e devolve o foco ao botão
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && estaAberto()) definirAberto(false, true);
    });

    // Fecha ao clicar fora do menu
    document.addEventListener("click", function (evento) {
      if (estaAberto() && !evento.target.closest(".nav")) definirAberto(false);
    });

    aoMudarMidia(telaLarga, function () {
      if (telaLarga.matches) definirAberto(false);
    });
  }

  /* ---------- 2. Destaque da seção visível no menu ---------- */
  function iniciarSecaoAtiva() {
    var links = document.querySelectorAll(".nav__link");
    if (!temObservador || !links.length) return;

    function marcar(id) {
      links.forEach(function (link) {
        if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    // A seção "ativa" é a que cruza a faixa central da tela
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) marcar(entrada.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    document.querySelectorAll("main > section[id]").forEach(function (secao) {
      observador.observe(secao);
    });
  }

  /* ---------- 3. Elementos que aparecem ao rolar ---------- */
  function iniciarRevelar() {
    if (!temObservador || movimentoReduzido) return;
    var elementos = document.querySelectorAll(".revelar");

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("revelar--visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    elementos.forEach(function (elemento) {
      elemento.classList.add("revelar--pronto");
      observador.observe(elemento);
    });
  }

  /* ---------- 4. Contadores animados (uma única vez) ---------- */
  function iniciarContadores() {
    if (!temObservador || movimentoReduzido) return; // o valor final já está no HTML

    var DURACAO = 1400;
    var blocos = [];

    document.querySelectorAll("[data-contador]").forEach(function (contador) {
      var bloco = contador.closest("p");
      if (blocos.indexOf(bloco) === -1) blocos.push(bloco);
    });

    blocos.forEach(function (bloco) {
      // Leitores de tela leem sempre o valor final; a animação fica escondida deles
      var textoFinal = bloco.textContent.replace(/\s+/g, " ").trim();
      var visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      while (bloco.firstChild) visual.appendChild(bloco.firstChild);
      var oculto = document.createElement("span");
      oculto.className = "visualmente-oculto";
      oculto.textContent = textoFinal;
      bloco.appendChild(oculto);
      bloco.appendChild(visual);

      bloco.querySelectorAll("[data-contador]").forEach(function (contador) {
        contador.setAttribute("data-final", contador.textContent);
        contador.textContent = formatarNumero(0, Number(contador.getAttribute("data-decimais") || 0));
      });
    });

    function animar(bloco) {
      var contadores = bloco.querySelectorAll("[data-contador]");
      var inicio = null;

      function quadro(agora) {
        if (inicio === null) inicio = agora;
        var progresso = Math.min((agora - inicio) / DURACAO, 1);
        var suave = 1 - Math.pow(1 - progresso, 3); // desacelera no final

        contadores.forEach(function (contador) {
          var alvo = Number(contador.getAttribute("data-contador"));
          var decimais = Number(contador.getAttribute("data-decimais") || 0);
          contador.textContent = progresso < 1
            ? formatarNumero(alvo * suave, decimais)
            : contador.getAttribute("data-final");
        });

        if (progresso < 1) window.requestAnimationFrame(quadro);
      }
      window.requestAnimationFrame(quadro);
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          observador.unobserve(entrada.target);
          animar(entrada.target);
        }
      });
    }, { threshold: 0.6 });

    blocos.forEach(function (bloco) {
      observador.observe(bloco);
    });
  }

  /* ---------- 5. Alternador: modelo linear × economia circular ---------- */
  function iniciarAlternador() {
    var figura = document.querySelector(".modelo");
    if (!figura) return;

    var grupo = figura.querySelector(".alternador");
    var botoes = grupo.querySelectorAll("[data-modelo-botao]");
    var legenda = figura.querySelector(".modelo__descricao");
    grupo.hidden = false;

    // Região que anuncia a troca para leitores de tela
    legenda.removeAttribute("aria-live");
    var aviso = document.createElement("p");
    aviso.className = "visualmente-oculto";
    aviso.setAttribute("aria-live", "polite");
    figura.appendChild(aviso);

    function escolher(modelo) {
      figura.setAttribute("data-modelo", modelo);
      botoes.forEach(function (botao) {
        botao.setAttribute("aria-pressed", String(botao.getAttribute("data-modelo-botao") === modelo));
      });
      aviso.textContent = figura.querySelector('[data-descricao="' + modelo + '"]').textContent;
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        escolher(botao.getAttribute("data-modelo-botao"));
      });
    });
  }

  /* ---------- 6. Acordeões (padrão WAI-ARIA) ---------- */
  function iniciarAcordeoes() {
    document.querySelectorAll("[data-acordeao]").forEach(function (grupo, g) {
      grupo.querySelectorAll("[data-acordeao-titulo]").forEach(function (titulo, i) {
        var painel = titulo.nextElementSibling;
        var idBotao = "acordeao-" + g + "-" + i;
        var idPainel = idBotao + "-painel";

        // O conteúdo do título passa para dentro de um botão
        var botao = document.createElement("button");
        botao.type = "button";
        botao.className = "acordeao__botao";
        botao.id = idBotao;
        botao.setAttribute("aria-expanded", "false");
        botao.setAttribute("aria-controls", idPainel);
        while (titulo.firstChild) botao.appendChild(titulo.firstChild);
        botao.appendChild(criarIcone("i-abrir", "acordeao__seta"));
        titulo.appendChild(botao);

        painel.id = idPainel;
        painel.setAttribute("role", "region");
        painel.setAttribute("aria-labelledby", idBotao);
        painel.hidden = true;

        botao.addEventListener("click", function () {
          var aberto = botao.getAttribute("aria-expanded") === "true";
          botao.setAttribute("aria-expanded", String(!aberto));
          painel.hidden = aberto;
        });
      });
    });
  }

  /* ---------- 7. Metodologia: ciclo clicável no desktop ---------- */
  function iniciarCicloMetodologia() {
    var raiz = document.querySelector("[data-metodologia]");
    if (!raiz) return;

    var lista = raiz.querySelector(".etapas");
    var etapas = Array.prototype.slice.call(lista.querySelectorAll(".etapa"));
    var telaLarga = window.matchMedia("(min-width: 64em)");
    // Posição de cada etapa no círculo (% da largura e da altura)
    var POSICOES = [[50, 14], [81.2, 32], [81.2, 68], [50, 86], [18.8, 68], [18.8, 32]];
    var roda = null;
    var abas = [];
    var selecionada = 0;

    // Anel com setas no sentido horário, desenhado em SVG
    function criarAnel() {
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "roda__anel");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");

      var circulo = document.createElementNS(SVG_NS, "circle");
      circulo.setAttribute("cx", "50");
      circulo.setAttribute("cy", "50");
      circulo.setAttribute("r", "36");
      circulo.setAttribute("fill", "none");
      circulo.setAttribute("stroke", "#9BC46A");
      circulo.setAttribute("stroke-width", "0.9");
      circulo.setAttribute("stroke-dasharray", "2 1.6");
      svg.appendChild(circulo);

      // Uma ponta de seta entre cada par de etapas
      for (var k = 0; k < 6; k++) {
        var angulo = (-60 + k * 60) * Math.PI / 180;
        var px = 50 + 36 * Math.cos(angulo);
        var py = 50 + 36 * Math.sin(angulo);
        var tx = -Math.sin(angulo), ty = Math.cos(angulo); // direção horária
        var nx = Math.cos(angulo), ny = Math.sin(angulo);
        var pontos = [
          [px + tx * 2.4, py + ty * 2.4],
          [px - tx * 1.6 + nx * 2, py - ty * 1.6 + ny * 2],
          [px - tx * 1.6 - nx * 2, py - ty * 1.6 - ny * 2]
        ].map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ");
        var seta = document.createElementNS(SVG_NS, "polygon");
        seta.setAttribute("points", pontos);
        seta.setAttribute("fill", "#2E7D5B");
        svg.appendChild(seta);
      }
      return svg;
    }

    function criarRoda() {
      roda = document.createElement("div");
      roda.className = "roda";
      roda.appendChild(criarAnel());

      var centro = document.createElement("p");
      centro.className = "roda__centro";
      centro.setAttribute("aria-hidden", "true");
      centro.textContent = "A avaliação realimenta melhorias";
      roda.appendChild(centro);

      var listaAbas = document.createElement("div");
      listaAbas.setAttribute("role", "tablist");
      listaAbas.setAttribute("aria-label", "Etapas da metodologia");

      etapas.forEach(function (etapa, i) {
        var aba = document.createElement("button");
        aba.type = "button";
        aba.className = "roda__aba";
        aba.id = "aba-etapa-" + (i + 1);
        aba.setAttribute("role", "tab");
        aba.setAttribute("aria-controls", etapa.id);
        aba.style.setProperty("--x", POSICOES[i][0] + "%");
        aba.style.setProperty("--y", POSICOES[i][1] + "%");

        var numero = document.createElement("span");
        numero.className = "roda__numero";
        numero.textContent = String(i + 1);
        var nome = document.createElement("span");
        nome.textContent = etapa.getAttribute("data-curto");
        aba.appendChild(numero);
        aba.appendChild(nome);

        aba.addEventListener("click", function () {
          selecionar(i);
        });
        aba.addEventListener("keydown", aoTeclar);
        abas.push(aba);
        listaAbas.appendChild(aba);
      });
      roda.appendChild(listaAbas);
    }

    // Setas, Home e End movem entre as etapas (ativação automática)
    function aoTeclar(evento) {
      var indice = abas.indexOf(evento.currentTarget);
      var novo = null;
      if (evento.key === "ArrowRight" || evento.key === "ArrowDown") novo = (indice + 1) % abas.length;
      else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") novo = (indice - 1 + abas.length) % abas.length;
      else if (evento.key === "Home") novo = 0;
      else if (evento.key === "End") novo = abas.length - 1;
      if (novo === null) return;
      evento.preventDefault();
      selecionar(novo);
      abas[novo].focus();
    }

    function selecionar(indice) {
      selecionada = indice;
      abas.forEach(function (aba, i) {
        var ativa = i === indice;
        aba.setAttribute("aria-selected", String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        etapas[i].hidden = !ativa;
      });
    }

    function ativar() {
      if (!roda) criarRoda();
      raiz.classList.add("metodologia--roda");
      raiz.insertBefore(roda, lista);
      lista.setAttribute("role", "none");
      etapas.forEach(function (etapa, i) {
        etapa.setAttribute("role", "tabpanel");
        etapa.setAttribute("aria-labelledby", abas[i].id);
        etapa.tabIndex = 0;
      });
      selecionar(selecionada);
    }

    function desativar() {
      if (!roda || !roda.parentNode) return;
      raiz.classList.remove("metodologia--roda");
      raiz.removeChild(roda);
      lista.removeAttribute("role");
      etapas.forEach(function (etapa) {
        etapa.removeAttribute("role");
        etapa.removeAttribute("aria-labelledby");
        etapa.removeAttribute("tabindex");
        etapa.hidden = false;
      });
    }

    if (telaLarga.matches) ativar();
    aoMudarMidia(telaLarga, function () {
      if (telaLarga.matches) ativar();
      else desativar();
    });
  }

  /* ---------- Início ---------- */
  iniciarMenu();
  iniciarSecaoAtiva();
  iniciarRevelar();
  iniciarContadores();
  iniciarAlternador();
  iniciarAcordeoes();
  iniciarCicloMetodologia();
})();
