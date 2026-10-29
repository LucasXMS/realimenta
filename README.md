# Site do projeto: desperdício de alimentos (ReAlimenta)

Site acadêmico da equipe da UCSal (Ciência, Natureza e Sociedade, Profa. Janine Melo) que apresenta o problema do desperdício de alimentos, os objetivos, a plataforma proposta e a metodologia. Ele tem duas páginas:

| Página | Para que serve |
|---|---|
| `index.html` | Apresentação do trabalho, em uma página só, para rolar |
| `prototipo.html` | Demonstração de como a plataforma funcionaria, com **dados fictícios** |

O site não usa internet, servidor nem instalação. Funciona direto do computador e também pode ser publicado de graça no GitHub Pages.

---

## 1. Como abrir

1. Abra a pasta do site.
2. Dê **dois cliques** em `index.html`. Ele abre no navegador.
3. Para ver a demonstração, clique em **Ver demonstração** no topo da página (ou abra `prototipo.html`).

**Sem internet também funciona.** Só as fontes de letra mudam: sem conexão, o navegador usa as fontes do próprio computador.

**Dicas para a apresentação no projetor**

- Use um navegador atualizado (Chrome, Edge ou Firefox).
- **F11** liga e desliga a tela cheia.
- **Ctrl +** e **Ctrl −** aumentam e diminuem o zoom. **Ctrl 0** volta ao normal.
- Antes de apresentar, abra a demonstração e clique em **Restaurar dados de exemplo** (veja a seção 6).

---

## 2. Como trocar o nome da plataforma

O nome provisório é **ReAlimenta**. Para trocar:

1. Abra o arquivo `js/config.js` num editor de texto. Clique com o botão direito, vá em **Abrir com** e escolha **Bloco de Notas** (ou use o VS Code).
2. Encontre esta linha:
   ```js
   nomePlataforma: "ReAlimenta", // nome provisório
   ```
3. Troque **só o texto entre aspas**, por exemplo `"NovoNome"`. Mantenha as aspas e a vírgula.
4. Salve o arquivo (**Ctrl S**) e recarregue o site no navegador (**F5**).

O nome muda sozinho nas duas páginas, inclusive no título da aba do navegador.

---

## 3. Como mudar o status das etapas da metodologia

No mesmo arquivo `js/config.js`, há uma lista com as seis etapas:

```js
statusEtapas: {
  levantamento: "Planejada",           // 1. Levantamento inicial
  desenvolvimento: "Planejada",        // 2. Desenvolvimento da plataforma web
  ...
}
```

Cada etapa aceita **exatamente** um destes três valores, com acento e letra maiúscula:

- `"Planejada"`
- `"Em andamento"`
- `"Concluída"`

Se um valor for digitado errado, o site mostra "Planejada".

> **Importante:** só marque uma etapa como "Em andamento" ou "Concluída" quando isso tiver acontecido de verdade. Hoje nenhuma etapa foi realizada.

---

## 4. Onde editar cada texto do `index.html`

Abra `index.html` no editor e use **Ctrl F** para buscar o título da seção. Cada seção começa com um comentário assim:

```html
<!-- ============ 6.2 O PROBLEMA ============ -->
```

| Seção no site | Busque por |
|---|---|
| Início (título e frase de abertura) | `6.1 INÍCIO` |
| O problema (números, Brasil, cadeia) | `6.2 O PROBLEMA` |
| Da linha ao ciclo (economia circular, Meta 12.3, pergunta norteadora) | `6.3 DA LINHA AO CICLO` |
| Objetivos | `6.4 OBJETIVOS` |
| A plataforma proposta (inclui as dicas educativas) | `6.5 A PLATAFORMA PROPOSTA` |
| Metodologia (as seis etapas) | `6.6 METODOLOGIA` |
| Avaliação e viabilidade | `6.7 AVALIAÇÃO E VIABILIDADE` |
| Rodapé | `RODAPÉ` |

**Regras para não quebrar nada**

- Troque apenas o texto que fica **entre** as marcações, como `<p>texto aqui</p>`. Não apague os sinais `<` e `>`.
- **Todo número precisa continuar com a citação** no formato ABNT, por exemplo `(PNUMA, 2024a)`.
- Não apague atributos como `data-config="nomePlataforma"` e `data-status-etapa="..."`. São eles que puxam o nome e os status do `config.js`.
- Os números com animação têm o valor escrito duas vezes. Ao trocar um número, troque os dois: o atributo usa **ponto** e o texto visível usa **vírgula**.
  ```html
  <span class="contador" data-contador="1.05" data-decimais="2">1,05</span>
  ```

---

## 5. Como colocar o logo da UCSal

1. Salve a imagem do logo com o nome **`logo-ucsal.png`** (tudo minúsculo, terminando em `.png`).
2. Coloque o arquivo dentro da pasta **`assets/img/`**.
3. Recarregue o site. O logo aparece no rodapé da página inicial.

Sem o arquivo, nada quebra: o rodapé mostra só o nome da instituição. O console do navegador (F12) mostra um aviso "404" sobre o logo. É esperado e some quando o arquivo é colocado.

---

## 6. Dados da demonstração

- **Tudo na demonstração é fictício**: estabelecimentos, instituições, excedentes e descartes. Os bairros de Salvador foram usados só para dar contexto local.
- O que você cadastra fica salvo **só no navegador daquele computador**. Não vai para a internet nem aparece para outras pessoas.
- **Restaurar dados de exemplo** (faixa laranja no topo da demonstração) volta ao histórico fictício de 8 semanas, terminando no dia de hoje.
- **Apagar tudo** remove todos os excedentes e descartes. Os cadastros fictícios continuam.
- Se ninguém mexeu nos dados, eles são **gerados de novo automaticamente a cada dia**, para a demonstração nunca aparecer "vencida". Se alguém cadastrou algo, os dados ficam como estão até alguém clicar em **Restaurar dados de exemplo**.
- Os nomes dos estabelecimentos e instituições fictícios ficam em `js/dados-demo.js`, no início do arquivo. Se forem trocados, mantenha nomes obviamente inventados.

---

## 7. Como publicar no GitHub Pages (passo a passo)

Assim o site ganha um link para abrir no celular. Tudo pelo site do GitHub, sem instalar nada.

1. Crie uma conta gratuita em [github.com](https://github.com) e entre nela.
2. Clique no **+** (canto superior direito) e em **New repository**.
3. Em **Repository name**, escreva um nome curto, por exemplo `realimenta`. Marque **Public** e clique em **Create repository**.
4. Na página que abrir, clique no link **uploading an existing file**.
5. Arraste para a página **todo o conteúdo da pasta do site**: `index.html`, `prototipo.html`, `README.md` e as pastas `css`, `js` e `assets`.
   - Arraste o conteúdo, não a pasta de fora.
   - Não é preciso enviar a pasta `.claude`, se ela aparecer: ela só foi usada para testes.
6. Desça a página e clique em **Commit changes**. Espere o envio terminar.
7. Vá em **Settings** (aba no topo do repositório) e, no menu da esquerda, em **Pages**.
8. Em **Build and deployment → Source**, escolha **Deploy from a branch**. Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
9. Espere de 1 a 2 minutos e recarregue a página de **Pages**. O endereço do site aparece no topo, no formato:
   `https://SEU-USUARIO.github.io/realimenta/`

**Para atualizar depois:** entre no repositório, clique em **Add file → Upload files** e envie de novo os arquivos alterados (eles substituem os antigos). Também dá para editar um arquivo direto no GitHub, clicando nele e depois no ícone de lápis.

---

## 8. Estrutura de pastas

```
/
├── index.html          → página de apresentação
├── prototipo.html      → demonstração com dados fictícios
├── README.md           → este guia
├── css/
│   ├── base.css        → cores, fontes e ajustes gerais
│   ├── layout.css      → cabeçalho, seções e rodapé
│   ├── componentes.css → cartões, botões, diagramas etc.
│   └── prototipo.css   → visual da demonstração
├── js/
│   ├── config.js       → NOME DA PLATAFORMA e STATUS DAS ETAPAS (edite aqui)
│   ├── dados-demo.js   → cadastros fictícios e gerador do histórico
│   ├── graficos.js     → desenho dos gráficos
│   ├── main.js         → interações da página inicial
│   └── prototipo.js    → funcionamento da demonstração
└── assets/
    ├── icones/         → ícone da aba do navegador
    └── img/            → coloque aqui o logo-ucsal.png
```

---

## 9. Trechos para a equipe revisar

Os textos escritos como exemplo estão marcados com **`REVISAR`** no código. Use **Ctrl F** para encontrá-los:

1. `index.html`, seção **Meta 12.3**: nem o artigo da equipe traz a citação dessa meta. Se a equipe tiver a fonte, acrescente (no site e no artigo).
2. `index.html`, **Conteúdo educativo** (seção 6.5): as 12 dicas sobre armazenamento, planejamento de compras e aproveitamento integral.
3. `js/dados-demo.js`, **dicasPorMotivo**: as 6 dicas que aparecem depois de registrar um descarte na demonstração.

---

## 10. Checklist antes de apresentar

- [ ] Abrir `index.html` com a internet desligada e conferir se tudo aparece.
- [ ] Abrir a demonstração e clicar em **Restaurar dados de exemplo**.
- [ ] Conferir o nome da plataforma e o status das etapas em `js/config.js`.
- [ ] Testar o zoom no projetor (**Ctrl +** e **Ctrl −**).
