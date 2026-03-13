# Astro Boy

Projeto em Astro para apresentar, de forma visual e didática, os benefícios do ecossistema Astro para sites institucionais, landing pages e blogs orientados a performance. O site combina conteúdo estático, componentes reutilizáveis e um fluxo de blog integrado ao Notion como CMS headless.

## Visão geral

O projeto foi estruturado para demonstrar:

- páginas rápidas e orientadas a conteúdo com Astro;
- interface componentizada com `layouts`, `components` e `content`;
- conteúdo principal centralizado em `src/content/data/SlidesData.json`;
- blog local com `astro:content`;
- sistema de blog conectado ao Notion, consumindo posts publicados a partir de uma base externa.

## Principais funcionalidades

- Home em formato de apresentação, composta por slides temáticos sobre performance, SEO, arquitetura de ilhas, roteamento e comparação entre Astro e WordPress.
- Conteúdo principal desacoplado da interface, com os textos e blocos da home concentrados em `src/content/data/SlidesData.json`.
- Componentes reutilizáveis como `Slide`, `Box`, `Accordion`, `Header` e `Footer`.
- Blog nativo em Markdown/MDX usando `astro:content`.
- Blog com Notion como CMS headless, com listagem de posts, rota dinâmica por `slug` e renderização de blocos do Notion.
- Página auxiliar `notion-json` para inspeção bruta das propriedades e blocos retornados pela API do Notion.
- Geração de sitemap e feed RSS.

## Stack

- Astro 6
- Tailwind CSS 4 via Vite
- TypeScript
- MDX
- API oficial do Notion (`@notionhq/client`)
- Adapter da Vercel

## Estrutura de conteúdo

### `src/content/data`

Esse diretório concentra o conteúdo principal do site.

- `SlidesData.json`: reúne os textos usados na home, organizados por blocos como `Slide1`, `Slide3`, `Slide4`, `Slide5`, `Slide6`, `Slide7`, `Slide8` e `SlideFAQ`.

Na prática, a página inicial em [`src/pages/index.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/pages/index.astro) consome esse arquivo e distribui os dados em componentes visuais (`Box`, `Slide` e `Accordion`). Isso facilita manutenção, reaproveitamento e futura expansão do conteúdo.

### `src/content/blog`

Contém o blog local do projeto em Markdown. Os posts são validados pelo schema definido em [`src/content.config.ts`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/content.config.ts), com campos como:

- `title`
- `description`
- `pubDate`
- `updatedDate`
- `heroImage`

## Blog com Notion como CMS headless

Um dos principais diferenciais implementados neste projeto é o sistema de blog usando o Notion como CMS headless.

### Como funciona

- O cliente do Notion é inicializado em [`src/lib/notion/client.ts`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/lib/notion/client.ts) com `NOTION_TOKEN` e `NOTION_DATA_SOURCE_ID`.
- A camada de serviço em [`src/lib/notion/service.ts`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/lib/notion/service.ts) consulta a fonte de dados do Notion e normaliza os metadados dos posts.
- O arquivo [`src/lib/notion/blocks.service.ts`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/lib/notion/blocks.service.ts) busca os blocos da página recursivamente, preservando hierarquia.
- O mapper [`src/lib/notion/render.mapper.ts`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/lib/notion/render.mapper.ts) transforma os blocos da API em uma árvore de renderização própria.
- Os componentes em [`src/components/notion/RenderNodes.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/components/notion/RenderNodes.astro) e [`src/components/notion/RenderNode.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/components/notion/RenderNode.astro) exibem esse conteúdo no frontend.

### Rotas do blog Notion

- [`src/pages/blog-notion/index.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/pages/blog-notion/index.astro): lista os posts publicados.
- [`src/pages/blog-notion/[...slug].astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/pages/blog-notion/[...slug].astro): renderiza o post individual a partir do `slug`.
- [`src/pages/notion-json.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/pages/notion-json.astro): página de inspeção e debug da integração.

### Metadados tratados da base do Notion

Pelo mapeamento atual, cada post pode expor:

- identificador
- título
- slug
- status
- tags
- autor
- capa
- data de publicação
- data de última edição
- responsável pela última edição

## Rotas principais

- `/`: página inicial com a apresentação em slides.
- `/blog`: blog local em Markdown/MDX.
- `/blog/[slug]`: detalhe de post do blog local.
- `/blog-notion`: blog abastecido pelo Notion.
- `/blog-notion/[slug]`: detalhe de post vindo do Notion.
- `/notion-json`: inspeção da resposta bruta da API do Notion.
- `/about`: página de exemplo usando o layout de post.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Variáveis de ambiente

Para que a integração com o Notion funcione, o projeto espera pelo menos:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
```

## Árvore de pastas

```text
Astro-Boy/
├── public/
│   ├── favicon.svg
│   └── fonts/
│       ├── atkinson-bold.woff
│       └── atkinson-regular.woff
├── src/
│   ├── assets/
│   │   ├── blog-placeholder-about.jpg
│   │   ├── Gemini_Generated_Image_f3h5tnf3h5tnf3h5.png
│   │   ├── logo-g.svg
│   │   ├── logo-p.svg
│   │   └── openGraph.png
│   ├── components/
│   │   ├── Accordion/
│   │   │   ├── AccordionItem.astro
│   │   │   └── index.astro
│   │   ├── Box/
│   │   │   ├── Default.astro
│   │   │   ├── index.astro
│   │   │   ├── Naked.astro
│   │   │   ├── NumberCircle.astro
│   │   │   ├── NumberLine.astro
│   │   │   └── WhiteHead.astro
│   │   ├── notion/
│   │   │   ├── RenderNode.astro
│   │   │   └── RenderNodes.astro
│   │   ├── BaseHead.astro
│   │   ├── Footer.astro
│   │   ├── FormattedDate.astro
│   │   ├── Header.astro
│   │   ├── HeaderLink.astro
│   │   ├── PostItem.astro
│   │   ├── Slide.astro
│   │   ├── SlideIndicator.astro
│   │   └── SlideNav.astro
│   ├── content/
│   │   ├── blog/
│   │   │   ├── acessibilidade-html-e-aria.md
│   │   │   ├── elementos-de-texto-no-html.md
│   │   │   ├── estrutura-base-do-html-e-metadados.md
│   │   │   ├── formularios-no-html.md
│   │   │   ├── imagens-e-midia-no-html.md
│   │   │   ├── layout-semantico-no-html.md
│   │   │   ├── links-e-navegacao-no-html.md
│   │   │   ├── tabelas-no-html.md
│   │   │   └── WP vs Astro.md
│   │   └── data/
│   │       └── SlidesData.json
│   ├── layouts/
│   │   ├── BlogPost.astro
│   │   └── Layout.astro
│   ├── lib/
│   │   └── notion/
│   │       ├── blocks.service.ts
│   │       ├── client.ts
│   │       ├── properties.ts
│   │       ├── render.mapper.ts
│   │       ├── render.types.ts
│   │       ├── service.ts
│   │       └── types.ts
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── [...slug].astro
│   │   │   └── index.astro
│   │   ├── blog-notion/
│   │   │   ├── [...slug].astro
│   │   │   └── index.astro
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── notion-json.astro
│   │   └── rss.xml.js
│   ├── styles/
│   │   ├── global.css
│   │   └── post.css
│   ├── consts.ts
│   └── content.config.ts
├── .env
├── .gitignore
├── astro.config.mjs
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

## Observações

- O layout base do site está em [`src/layouts/Layout.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/layouts/Layout.astro).
- O layout dos artigos está em [`src/layouts/BlogPost.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/layouts/BlogPost.astro).
- A navegação principal expõe os fluxos `Home`, `Blog`, `Notion`, `JSON` e `About`, conforme [`src/components/Header.astro`](/c:/Users/Gabriel/OneDrive/Área%20de%20Trabalho/Astro-Boy/src/components/Header.astro).
- A URL configurada no projeto é `https://soareso.com`.
