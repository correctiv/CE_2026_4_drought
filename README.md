# Repository titel

## Overview

What is this data project about?

This repository contains the following:

- app - (Optional) Contains a frontend app that needs to be hosted on our cdn server
- data - All data: input data or intermediate data (if to big, this can be excluded from versioning, but a description to get the data must be present.)
- docs - Content documentation of the project, either internal for journalists, or external via Github Pages.
- results - Everything that is a result to publish. Figures, tables, output data
- scripts - Contains code, like Python scripts or Jupyter notebooks
- scripts/scraping - (optional) Contains code, that is used to obtain data
- Pipfile - configuration file for pipenv for this project
- README.md - this readme, documentation on how to use this repository (e.g. how to run the analysis as a reviewer)

## Usage/Setup

- Create a venv: `python3 -m venv .venv`
- Activate the venv: `source .venv/bin/activate`
- Install pipenv: `pip install pipenv`
- Create pipenv environment (only if there is no Pipfile in the Repo): `pipenv --python 3.11`
- Linting:

```
pipenv install flake8 \
    flake8-bugbear \
    flake8-docstrings \
    flake8-import-order \
    pep8-naming \
    flake8-builtins \
    flake8-bandit
```

- `pipenv install <package>`

**Setup for usage:**

- `pipenv install`

**Setting up jupyter notebook with pipenv:**

- `pipenv install ipykernel`
- `pipenv install jupyter`
- `pipenv run python -m ipykernel install --user --name=<kernel-name>`
- In VSCode go to search/command palette and type `>Create: New jupyter notebook`
- Select kernel in notebook on right hand side

**Lint code files:**

Either integrate flake8 via VSCode or run via command. Example:
`pipenv run flake8 analysis/main.py --config .flake8`

# Data dictionary

Describe the data here.
