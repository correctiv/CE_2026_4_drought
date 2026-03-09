# MapTiler Template

## Overview

This is a template project to create a MapTiler map for a Europe Project.

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

### Python Environment

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

### Maptiler App

**First setup**

- `npm install`

**Usage**

- Go to the app folder: `cd app`
- Build project with: `npm run build`
- Dev mode with hot reloading: `npm run dev`

(See more info in the app directory README.md)

# Data dictionary

All data is first downloaded into `data_raw` and should not be modified within this folder. All experimental results and substeps of the analyis go into `data_intermediate`. `data_out`is reserved for the final results that are sent to the network or used in maptiler.

The following input data need to be downloaded into `data_raw` to complete this analysis:

| Description | source | reference year| url | notes |
| ----- | ---- | -- |  -- | -- |
| Population statistics at NUTS3 level| EU Commission| 2021 | [link](https://data.destination-earth.eu/data-portfolio/STAT.EUSTAT.DAT.POP_AGE_GROUP_SEX_NUTS3) |
| LAU borders for EU + EEG countries (excluding UK) | EU Commission | 2021 |[link](https://ec.europa.eu/eurostat/de/web/gisco/geodata/statistical-units/local-administrative-units) | Download parameters: Year:2021, Format:SHP, CRS: EPSG4326 |
| NUTS3 borders for EU + EEG countries (including UK) | EU Commission | 2021 |[link](https://ec.europa.eu/eurostat/de/web/gisco/geodata/statistical-units/territorial-units-statistics) | Download parameters: Year:2021, Format:SHP, geometryType:Polygons, Accuracy:01M, CRS: EPSG4326 |
| EU lau>nuts3 lookup table | EU Commission | 2021 | [link](https://ec.europa.eu/eurostat/web/nuts/local-administrative-units) ||
| LAD (LAU equivalent) borders for UK | UK office for national statistics | 2021 | [link](https://geoportal.statistics.gov.uk/datasets/ons::local-authority-districts-december-2021-boundaries-gb-bfc/about) ||
| uk lad>nuts3 lookup table | UK office for national statistics | 2018 | [link](https://geoportal.statistics.gov.uk/datasets/0de287b886954f54b4c2fffcfd514079_0/explore) | This is the last year for which I could find this type of lookup table due to brexit |
| Combined Drought Indicator (v4.1.0, downloaded 08.03.'26) | EDO | 2012-2025 | [link](https://drought.emergency.copernicus.eu/tumbo/edo/download/) | Download Format: GeoTIFF |
| High resolution layer croplands | Copernicus LMS | 2023 | [link](https://land.copernicus.eu/en/products/high-resolution-layer-croplands) | IMPORTANT: Downloading this without the api is prohibitively tedious, see the script for API calls: [download_crop_data.ipynb](scripts/download_crop_data.ipynb)|


# Processing pipeline
The data processing is spread across several scripts, all of which are intended to be run from top to bottom. The order for these scripts is as follows:

## combine EU LAUs and UK LADs
[scripts/join_eu_and_uk_laus.ipynb](scripts/join_eu_and_uk_laus.ipynb)

This scripts combines the LAU and LAD boundary files into a single shapefile that follows NUTS/LAU conventions. Resulting polygons are in the same crs and share column names.


## compute intersection matrices for polygons and CDI raster
[scripts/extract_coverage_fraction.r](scripts/extract_coverage_fraction.r)

The raster size of the CDI is around 5x5km at the equator and thus is not ideal for the analysis at LAU scale. If we were to average all Pixels that intersect a LAU shape, resulting drought measurements would be highly skewed. Considering only pixels that are fully inside a shape would lead to hundreds of LAUs without data - in addition to skewed results. the package exactextract ([github](https://github.com/isciences/exactextract)) solves this issue by computing how much of a pixel is covered by a complex shape rather efficiently. Sadly, this particular function is not available for the python package, so we switch to R for this singular script.

For debugging and ease of use, the shapes are processed in batches by country. For each shape, a small raster is computed that contains all pixels of the CDI raster that intersect the shape. The value of each pixel indicates how much of it is covered by the shape. We use this information to weigh the drought day value at that pixel to get a weighted average per shape later on.

The top of this script contains a boolean switch to select LAU or NUTS3 shapes. It must be run twice, once for each of the geometry types.

## compute drought days
[scripts/compute_drought_days_by_LAU.ipynb](scripts/compute_drought_days_by_LAU.ipynb)

given the results from the previous operation, reading drought inidcator data for a given shape becomes computationally trivial. This step is methodologically significant however: The drought indicator is updated every 10 days, so each geoTIFF file represents drought severity over a 10 day span (minus five days throughout the year due to 31-day months). The process is as follows:

1. For each year, all of the ten-day-indicator windows are combined to approximate how many days of a given year the drought indiactor reported a "warning" or "alert" state for the given pixel.
2. For each LAU, the intersecting pixels are weighted by how much of the LAU are their intersection comprises. This weight is multiplied by the number of drought days per pixel to get an area-weighted drought measure pre LAU.
3. For each LAU, the median value for drought-days-per-year is computed and returned as the output value for the LAU

As before, this script comes with a boolan toggle to perform the computation at both the LAU and NUTS3 level.


## get cropland area
[scripts/cropland_area.ipynb](scripts/cropland_area.ipynb)

Next, for each NUTS3 area, we compute the relative surface area used for growing crops using the high resolution layer croplands by copernicus. The dataset has an exceptionally high resolution of 10x10m at all latitudes. Becaus of this, we do not need to compute pixel-polygon overlaps. Just counting the number of pixels that have their center inside a polygon is sufficient. 

Note that the principal issue with the dataset is its volume, which in turn demands it to be split into several dozen patches that each make up a fraction of the entire dataset. This script handles all of the dynamical loading and unloading of those chunks.


## create output files 
[scripts/build_output_spreadsheets.ipynb](scripts/build_output_spreadsheets.ipynb)

Finally, we join all of the computed data into several dataframes that are stored to disk to be immediately uploaded to maptiler or passed on to the network.
