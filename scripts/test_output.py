"""Smoke tests against the real exported data files.

These tests validate the actual pipeline output in data/exports/.
They are skipped if the export files don't exist (e.g. in CI without data).
"""

import csv
from pathlib import Path

import pytest
import utils
import geopandas as gpd

@pytest.fixture(scope="module")
def nuts3_df():
    return gpd.read_file(Path(utils.out_data_dir, "nuts3_stats.geojson"))


class TestLauExport:
    def test_cropland_area(self, nuts3_df):
        assert (nuts3_df["cropland_area_percent"].dropna() < 100).all()
        assert (nuts3_df["cropland_area_percent"].dropna() >= 0).all()

