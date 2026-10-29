/* =============================================================
   GRÁFICOS — funções que desenham gráficos em SVG, sem bibliotecas.
   Cada gráfico é desenhado na largura real do espaço disponível,
   para o texto ficar legível também no celular.
   ============================================================= */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  // Cria um elemento SVG com atributos e (opcionalmente) o anexa a um pai
  function el(nome, atributos, pai) {
    var elemento = document.createElementNS(SVG_NS, nome);
    Object.keys(atributos || {}).forEach(function (chave) {
      elemento.setAttribute(chave, atributos[chave]);
    });
    if (pai) pai.appendChild(elemento);
    return elemento;
  }

  function texto(conteudo, atributos, pai) {
    var t = el("text", atributos, pai);
    t.textContent = conteudo;
    return t;
  }

  // SVG base com descrição acessível
  function criarSvg(area, largura, altura, descricao) {
    area.textContent = "";
    var svg = el("svg", {
      viewBox: "0 0 " + largura + " " + altura,
      role: "img",
      "aria-label": descricao,
      focusable: "false"
    });
    area.appendChild(svg);
    return svg;
  }

  function larguraDe(area) {
    return Math.max(260, Math.floor(area.clientWidth || 600));
  }

  // Estimativa simples da largura de um texto (sem medir no DOM)
  function larguraTexto(conteudo, tamanho) {
    return String(conteudo).length * tamanho * 0.56;
  }

  function semDados(area, mensagem) {
    area.textContent = "";
    var p = document.createElement("p");
    p.className = "vazio";
    p.textContent = mensagem || "Sem registros no período selecionado.";
    area.appendChild(p);
  }

  /* ---------- Barras verticais ---------- */
  // opcoes: { dados: [{ rotulo, rotuloCurto, valor, destaque }], formatar, descricao, altura }
  function barrasVerticais(area, opcoes) {
    var dados = opcoes.dados;
    var maximo = Math.max.apply(null, dados.map(function (d) { return d.valor; }));
    if (!dados.length || maximo <= 0) return semDados(area);

    var largura = larguraDe(area);
    var altura = opcoes.altura || 280;
    var margem = { topo: 48, base: 36, esq: 6, dir: 6 };
    var util = largura - margem.esq - margem.dir;
    var faixa = util / dados.length;
    var larguraBarra = Math.min(64, faixa * 0.62);
    var alturaUtil = altura - margem.topo - margem.base;
    var curto = faixa < 70;
    var svg = criarSvg(area, largura, altura, opcoes.descricao);

    el("line", { x1: margem.esq, x2: largura - margem.dir, y1: altura - margem.base, y2: altura - margem.base, "class": "graf-eixo" }, svg);

    dados.forEach(function (d, i) {
      var h = (d.valor / maximo) * alturaUtil;
      var cx = margem.esq + faixa * i + faixa / 2;
      var y = altura - margem.base - h;
      el("rect", {
        x: (cx - larguraBarra / 2).toFixed(1),
        y: y.toFixed(1),
        width: larguraBarra.toFixed(1),
        height: Math.max(h, 1).toFixed(1),
        rx: 4,
        "class": d.destaque ? "graf-barra graf-barra--destaque" : "graf-barra"
      }, svg);

      texto(opcoes.formatar(d.valor), {
        x: cx, y: y - 8, "text-anchor": "middle",
        "class": "graf-texto" + (d.destaque ? " graf-texto--forte" : "")
      }, svg);

      // O maior valor também é marcado com texto (não depende só da cor)
      if (d.destaque) {
        texto("▲ maior", { x: cx, y: y - 28, "text-anchor": "middle", "class": "graf-texto graf-texto--descarte" }, svg);
      }

      texto(curto ? (d.rotuloCurto || d.rotulo) : d.rotulo, {
        x: cx, y: altura - margem.base + 22, "text-anchor": "middle",
        "class": "graf-texto graf-texto--suave" + (d.destaque ? " graf-texto--forte" : "")
      }, svg);
    });
  }

  /* ---------- Barras horizontais (categorias, motivos, ranking) ---------- */
  // opcoes: { dados: [{ rotulo, valor, destaque, complemento }], formatar, descricao, classeBarra }
  function barrasHorizontais(area, opcoes) {
    var dados = opcoes.dados;
    var maximo = Math.max.apply(null, dados.map(function (d) { return d.valor; }));
    if (!dados.length || maximo <= 0) return semDados(area);

    var largura = larguraDe(area);
    var tamanhoFonte = 14;
    var alturaLinha = 38;
    var maiorRotulo = Math.max.apply(null, dados.map(function (d) { return larguraTexto(d.rotulo, tamanhoFonte); }));
    var maiorValor = Math.max.apply(null, dados.map(function (d) {
      return larguraTexto(opcoes.formatar(d.valor) + (d.complemento || ""), tamanhoFonte);
    }));
    // No celular, o rótulo vai acima da barra; no desktop, à esquerda
    var empilhado = largura < 460 || maiorRotulo > largura * 0.42;
    var colunaRotulo = empilhado ? 0 : maiorRotulo + 14;
    var alturaItem = empilhado ? alturaLinha + 20 : alturaLinha;
    var altura = dados.length * alturaItem + 8;
    var inicioBarra = colunaRotulo;
    var larguraUtil = Math.max(40, largura - inicioBarra - maiorValor - 14);
    var svg = criarSvg(area, largura, altura, opcoes.descricao);

    dados.forEach(function (d, i) {
      var topo = i * alturaItem + 4;
      var yBarra = topo + (empilhado ? 20 : 6);
      var alturaBarra = alturaLinha - 14;
      var w = Math.max((d.valor / maximo) * larguraUtil, 2);

      texto(d.rotulo, {
        x: 0,
        y: empilhado ? topo + 14 : yBarra + alturaBarra / 2 + 5,
        "class": "graf-texto" + (d.destaque ? " graf-texto--forte" : "")
      }, svg);

      el("rect", {
        x: inicioBarra, y: yBarra, width: w.toFixed(1), height: alturaBarra, rx: 4,
        "class": (opcoes.classeBarra || "graf-barra") + (d.destaque ? " graf-barra--destaque" : "")
      }, svg);

      texto(opcoes.formatar(d.valor) + (d.complemento || ""), {
        x: inicioBarra + w + 8, y: yBarra + alturaBarra / 2 + 5,
        "class": "graf-texto" + (d.destaque ? " graf-texto--forte" : "")
      }, svg);
    });
  }

  /* ---------- Linhas (evolução semanal) ---------- */
  // Marcadores com formas diferentes para não depender só da cor
  function desenharMarcador(tipo, x, y, cor, pai) {
    if (tipo === "quadrado") {
      el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, fill: "#FFFFFF", stroke: cor, "stroke-width": 2.5 }, pai);
    } else if (tipo === "triangulo") {
      el("path", { d: "M" + x + " " + (y - 6.5) + "L" + (x + 6) + " " + (y + 4.5) + "L" + (x - 6) + " " + (y + 4.5) + "Z", fill: cor }, pai);
    } else {
      el("circle", { cx: x, cy: y, r: 5, fill: cor }, pai);
    }
  }

  // Valores "redondos" para o eixo vertical
  function escalaBonita(maximo) {
    if (maximo <= 0) return { topo: 1, passo: 1 };
    var bruto = maximo / 4;
    var potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
    var passo = [1, 2, 2.5, 5, 10].map(function (m) { return m * potencia; })
      .filter(function (p) { return p >= bruto; })[0];
    return { topo: Math.ceil(maximo / passo) * passo, passo: passo };
  }

  // opcoes: { series: [{ nome, cor, tracejado, marcador, valores }], rotulosX, formatar, formatarEixo, descricao }
  function linhas(area, opcoes) {
    var series = opcoes.series;
    var todos = [];
    series.forEach(function (s) { todos = todos.concat(s.valores); });
    var maximo = Math.max.apply(null, todos);
    if (!opcoes.rotulosX.length || maximo <= 0) return semDados(area);

    var largura = larguraDe(area);
    var altura = 300;
    var estreito = largura < 520;
    var margem = { topo: 16, base: 34, esq: 46, dir: estreito ? 64 : 150 };
    var escala = escalaBonita(maximo);
    var util = { w: largura - margem.esq - margem.dir, h: altura - margem.topo - margem.base };
    var n = opcoes.rotulosX.length;
    var svg = criarSvg(area, largura, altura, opcoes.descricao);

    function px(i) { return margem.esq + (n === 1 ? util.w / 2 : (util.w * i) / (n - 1)); }
    function py(v) { return margem.topo + util.h - (v / escala.topo) * util.h; }

    // Grade e eixo vertical
    for (var v = 0; v <= escala.topo + 1e-9; v += escala.passo) {
      el("line", { x1: margem.esq, x2: largura - margem.dir, y1: py(v), y2: py(v), "class": v === 0 ? "graf-eixo" : "graf-grade" }, svg);
      texto(opcoes.formatarEixo(v), { x: margem.esq - 8, y: py(v) + 5, "text-anchor": "end", "class": "graf-texto graf-texto--suave" }, svg);
    }

    // Rótulos do eixo horizontal (pula alguns se faltar espaço)
    var salto = Math.ceil(n / Math.max(1, Math.floor(util.w / 64)));
    opcoes.rotulosX.forEach(function (rotulo, i) {
      if (i % salto !== 0 && i !== n - 1) return;
      texto(rotulo, { x: px(i), y: altura - 10, "text-anchor": "middle", "class": "graf-texto graf-texto--suave" }, svg);
    });

    // Linhas e marcadores
    var finais = [];
    series.forEach(function (s) {
      var d = s.valores.map(function (valor, i) { return (i ? "L" : "M") + px(i).toFixed(1) + " " + py(valor).toFixed(1); }).join("");
      el("path", {
        d: d, fill: "none", stroke: s.cor, "stroke-width": 3,
        "stroke-linejoin": "round", "stroke-linecap": "round",
        "stroke-dasharray": s.tracejado ? "8 6" : "none"
      }, svg);
      s.valores.forEach(function (valor, i) { desenharMarcador(s.marcador, px(i), py(valor), s.cor, svg); });
      finais.push({ serie: s, y: py(s.valores[s.valores.length - 1]) });
    });

    // Rótulos diretos no fim de cada linha, afastados para não se sobreporem
    finais.sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < finais.length; k++) {
      if (finais[k].y - finais[k - 1].y < 34) finais[k].y = finais[k - 1].y + 34;
    }
    finais.forEach(function (f) {
      var x = largura - margem.dir + 10;
      var valorFinal = opcoes.formatar(f.serie.valores[f.serie.valores.length - 1]);
      // style (e não o atributo fill) para vencer a cor padrão da classe
      if (estreito) {
        texto(valorFinal, { x: x, y: f.y + 5, style: "fill:" + f.serie.cor, "class": "graf-texto graf-texto--forte" }, svg);
      } else {
        texto(f.serie.nome, { x: x, y: f.y - 2, style: "fill:" + f.serie.cor, "class": "graf-texto graf-texto--forte" }, svg);
        texto(valorFinal, { x: x, y: f.y + 15, "class": "graf-texto graf-texto--suave" }, svg);
      }
    });
  }

  // Amostra de linha + marcador, usada na legenda HTML
  function amostraLegenda(serie) {
    var svg = el("svg", { viewBox: "0 0 36 16", "aria-hidden": "true", focusable: "false" });
    el("line", { x1: 2, x2: 34, y1: 8, y2: 8, stroke: serie.cor, "stroke-width": 3, "stroke-dasharray": serie.tracejado ? "6 4" : "none" }, svg);
    desenharMarcador(serie.marcador, 18, 8, serie.cor, svg);
    return svg;
  }

  window.Graficos = {
    barrasVerticais: barrasVerticais,
    barrasHorizontais: barrasHorizontais,
    linhas: linhas,
    amostraLegenda: amostraLegenda
  };
})();
