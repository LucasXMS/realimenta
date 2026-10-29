/* =============================================================
   CONFIGURAÇÃO DO SITE — este é o arquivo que a equipe edita.
   -------------------------------------------------------------
   • Troque o texto entre aspas para mudar o nome da plataforma.
   • Troque o status de cada etapa usando EXATAMENTE uma destas
     opções: "Planejada", "Em andamento" ou "Concluída".
   • Salve o arquivo e recarregue a página no navegador (F5).
   ============================================================= */
window.SITE_CONFIG = {
  nomePlataforma: "ReAlimenta", // nome provisório

  // Status de cada etapa: "Planejada", "Em andamento" ou "Concluída"
  statusEtapas: {
    levantamento: "Planejada",           // 1. Levantamento inicial
    desenvolvimento: "Planejada",        // 2. Desenvolvimento da plataforma web
    redistribuicaoRegistro: "Planejada", // 3. Redistribuição e registro do desperdício
    analisePrevencao: "Planejada",       // 4. Análise dos dados e prevenção
    avaliacaoExperiencia: "Planejada",   // 5. Avaliação da experiência dos usuários
    indicadoresAprimoramento: "Planejada" // 6. Avaliação por indicadores e aprimoramento
  }
};

/* =============================================================
   Daqui para baixo não é preciso editar nada.
   Este trecho aplica a configuração acima nas duas páginas.
   ============================================================= */
(function aplicarConfiguracao() {
  var config = window.SITE_CONFIG || {};
  var NOME_PADRAO = "ReAlimenta";
  var nome = (typeof config.nomePlataforma === "string" && config.nomePlataforma.trim()) || NOME_PADRAO;

  // Troca o nome em todos os elementos marcados com data-config="nomePlataforma"
  var alvos = document.querySelectorAll('[data-config="nomePlataforma"]');
  for (var i = 0; i < alvos.length; i++) {
    alvos[i].textContent = nome;
  }

  // Troca o nome no título da aba e nos metadados de compartilhamento
  document.title = document.title.split(NOME_PADRAO).join(nome);
  var metas = document.querySelectorAll(
    'meta[name="description"], meta[property="og:title"], meta[property="og:site_name"], meta[property="og:description"]'
  );
  for (var j = 0; j < metas.length; j++) {
    metas[j].setAttribute("content", metas[j].getAttribute("content").split(NOME_PADRAO).join(nome));
  }

  // Aplica o status de cada etapa da metodologia (somente no index)
  var STATUS_VALIDOS = {
    "Planejada": "planejada",
    "Em andamento": "andamento",
    "Concluída": "concluida"
  };
  var status = config.statusEtapas || {};
  var selos = document.querySelectorAll("[data-status-etapa]");
  for (var k = 0; k < selos.length; k++) {
    var chave = selos[k].getAttribute("data-status-etapa");
    var valor = status[chave];
    // Valor ausente ou digitado errado: mantém "Planejada"
    if (!STATUS_VALIDOS[valor]) valor = "Planejada";
    var texto = selos[k].querySelector(".selo-status__texto") || selos[k];
    texto.textContent = valor;
    selos[k].className = "selo-status selo-status--" + STATUS_VALIDOS[valor];
  }
})();
