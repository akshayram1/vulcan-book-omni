PYTHON := python3
VENV := venv
PIP := $(VENV)/bin/pip
MKDOCS := $(VENV)/bin/mkdocs

.PHONY: setup venv install frontend serve build deploy clean

setup: venv install frontend ## Complete setup (venv + install)

venv: ## Create virtual environment
	@if [ ! -d "$(VENV)" ]; then \
		$(PYTHON) -m venv $(VENV); \
	fi

install: venv ## Install dependencies from pyproject.toml
	@$(PIP) install --upgrade pip setuptools
	@$(PIP) install -e .

frontend: ## Install frontend deps if needed and build chat assets
	@if [ -f "package.json" ]; then \
		if [ ! -d "node_modules" ]; then npm install; fi; \
		npm run build:chatbot; \
	fi

update-images: ## Update Docker image versions in docker.md from engine configs
	@echo "Updating Docker image versions in docker.md..."
	@$(PYTHON) scripts/update_docker_images.py

serve: venv update-images frontend ## Start development server
	@echo "Starting MkDocs server at http://127.0.0.1:7000/"
	@echo "Note: Access the site at http://127.0.0.1:7000/ (root path) for local development"
	@$(MKDOCS) serve --dev-addr 127.0.0.1:7000 --livereload

build: venv update-images frontend ## Build static site
	@$(MKDOCS) build

deploy: venv update-images frontend ## Deploy to GitHub Pages
	@echo "Deploying to GitHub Pages..."
	@$(MKDOCS) gh-deploy --force --ignore-version
	@echo "Deployed to GitHub Pages!"

clean: ## Clean generated files
	@rm -rf site/ .cache
