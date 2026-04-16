# Vulcan Book

Documentation for Vulcan - built with MkDocs.

## Quick Start

```bash
make setup    # First time setup
make serve    # Start development server
make build    # Build static site
make deploy   # Deploy to GitHub Pages
```

The repo now also includes a frontend bundle for the embedded `Omni Docs Assistant`, powered by `@akshayram1/omnibrowser-agent`.

## Structure

- `docs/` - Documentation source files
- `overrides/` - MkDocs Material theme customizations
- `src/` - Frontend source for the chat assistant
- `scripts/` - Build helper scripts
- `mkdocs.yml` - MkDocs configuration
- `pyproject.toml` - Python dependencies
- `Makefile` - Build, serve, and deploy commands
- `package.json` - Frontend dependencies for the docs assistant

## Development

The development server runs at `http://127.0.0.1:7000` and automatically reloads on file changes.

## Chat Assistant

The floating `Ask Omni` launcher adds:

- free docs search mode using MkDocs' generated search index
- optional local AI mode that runs in the browser with `omnibrowser-agent`
- no required backend or API key for the default search experience

The first time a user enables local AI, the browser downloads a WebLLM model, so that mode is heavier than the default search flow.

## Vercel Deployment

This repo includes a [`vercel.json`](/Users/akshaychame/Documents/Playground/vulcan-book-omni/vercel.json) that:

- installs Python dependencies
- installs frontend dependencies
- builds the chat bundle
- builds the MkDocs static site into `site/`

You can import the repo into Vercel and deploy it as a static site.

## Deployment

Deploy to GitHub Pages:

```bash
make deploy
```

This will build the site and push it to the `gh-pages` branch. Configure GitHub Pages in repository settings to use the `gh-pages` branch as the source.

The site will be available at: `https://tmdc-io.github.io/vulcan-book`
