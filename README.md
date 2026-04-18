# AI Characters Showcase

`ai-characters-showcase` is a cinematic dossier-style website for presenting AI-generated character concepts as a browsable public archive. V1 is a static Astro site aimed at fans and casual browsers, with a gallery homepage, filter-chip browsing, and dedicated profile pages for each character.

## Stack

- Astro static site
- Structured character content in `src/content/characters`
- GitHub Pages deployment through GitHub Actions

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Content Workflow

Each character lives in a Markdown dossier under `src/content/characters`. Frontmatter controls gallery metadata and route generation:

- `name`
- `slug`
- `role`
- `shortDescription`
- `tags`
- `heroImage`
- optional `galleryImages`
- optional lore fields like `world`, `region`, and `faction`

The Markdown body is rendered on the character detail page as the long-form dossier.

## Deployment

The site is configured for GitHub Pages at:

`https://robert-laws.github.io/ai-characters-showcase/`

Pushes to `main` trigger the workflow in `.github/workflows/deploy.yml`, which builds the static Astro site and publishes `dist/` to GitHub Pages.
