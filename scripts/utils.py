import os
import glob
import rasterio
from matplotlib.colors import ListedColormap
import os.path as path
import json
import geopandas as gpd
from shapely.geometry import shape

dataset_names = [
    "Crop Types",
    "Main Crop Emergence",
    "Main Crop Duration"
]

cropland_type_dict = {
    1110: "Wheat",
    1120: "Barley",
    1130: "Maize",
    1140: "Rice",
    1150: "Other cereals",
    1210: "Fresh Vegetables",
    1220: "Dry Pulses",
    1310: "Potatoes",
    1320: "Sugar Beet",
    1410: "Sunflower",
    1420: "Soybeans",
    1430: "Rapeseed",
    1440: "Flax cotton and hemp",
    2100: "Grapes",
    2200: "Olives",
    2310: "Fruits",
    2320: "Nuts",
    3100: "Unclassified annual crop",
    3200: "Unclassified permanent crop",
    65535: "outside area",
}


nodata_val = 65535

basedir = path.dirname(os.getcwd())
raw_data_dir = path.join(basedir, "data_raw")
intermediate_data_dir = path.join(basedir, "data_intermediate")
out_data_dir = path.join(basedir, "data_out")

uk_lau_dir = path.join(raw_data_dir, "LAD_Dec_2021_GB_BFC_2022_4815044792916693521")
eu_lau_dir = path.join(raw_data_dir, "LAU_RG_01M_2021_4326.shp")


lau_dir = path.join(intermediate_data_dir, "eu_uk_laus_joined.shp")
nuts_dir = path.join(raw_data_dir, "NUTS_RG_01M_2021_4326.shp")
country_dir = path.join(raw_data_dir, "CNTR_RG_10M_2024_4326.shp")




def get_dataset_by_name(name):
    name_norm = name.replace(" ", "_")
    files = sorted(glob.glob(os.path.join(raw_data_dir, name_norm, "**" , "*.tif")))
    
    return files


def load_raster_file(path):
    with rasterio.open(path) as src:
        data = src.read(1)
    return data
    
def get_mpl_cmap(filename):
    with rasterio.open(filename) as src:
        geotiff_cmap = src.colormap(1)
    # Convert to 0–1 floats and preserve order
    colors = []
    for i in range(max(geotiff_cmap.keys()) + 1):
        r, g, b, a = geotiff_cmap[i]
        colors.append((r/255, g/255, b/255, a/255))

    return ListedColormap(colors)


def prep_copernicus_data(data):
    quality_flag_mask = ((data >= 65526) & (data <=  65534))
    # The range between 65526 and 65534 indicates different types of issues during data collection, all of which indicate incomplete or unreliable data
    # TODO: check if some of them might still be useful!
    
    data[quality_flag_mask] = 0
    return data


def load_complex_geojson(path):
    # helper function for geojson files that contain list values, which is not natively supported by some geojson drivers.
    # Resulting object should be equivalent to gpd.read_file("xy.geojson")

    with open(path, "r") as f:
        data = json.load(f)

    features = data["features"]

    rows = []
    for f in features:
        props = f["properties"]
        geom = shape(f["geometry"])
        props["geometry"] = geom
        rows.append(props)

    return gpd.GeoDataFrame(rows, geometry="geometry")