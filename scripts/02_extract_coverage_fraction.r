library(terra)
library(exactextractr)
library(sf)
library(raster)
library(jsonlite)  # for toJSON
options(error = traceback)

# This script computes the coverage fraction for each pixel in the raster data over the polygons in the shapefile
# it outputs a .geojson with one item for each LAU or NUTS-3 that contains a set of offset coordinates and a weight matrix 
# where each value represents the fraction of the pixel covered by a given polygon. 
# With this, we can later reconstruct, how strongly each pixel should be weighed in calculating drought days for a LAU or NUTS-3


# change this variable to switch between analysis for "lau", "nuts3", "country"
compute_level <- "nuts3"

if (compute_level == "lau") {
    country_identifier <- "CNTR_CODE"
    in_file <- "data_intermediate/eu_uk_laus_joined.shp"
} else if (compute_level == "nuts3") {
    country_identifier <- "CNTR_CODE"
    in_file <- "data_raw/NUTS_RG_01M_2021_4326.shp"
} else if (compute_level == "country") {
    # NOTE: This feature does not work! Country shapes provided by the EU include overseas areas, causing a conflict with exactextract. 
    # In the current version, portugal and France cannot be computed correctly. We therefore construct country statistics later on based off nuts3 stats
    country_identifier <- "CNTR_ID"
    in_file <- "data_raw/CNTR_RG_10M_2024_4326.shp"
} else {
    print("Invalid compute level")
    break
}

print("loading CDI raster data... ")
# which cdi raster file we choose does not matter because we are only interested in the metadata – which is the same across time. So we simply pick the first one.
cdi_raster_raw <- raster("data_raw/combined_drought_indicator_2012-2025/cdinx_m_edo_20120101_20121221_t/cdinx_m_edo_20120101_t_410_z01.tif")


print("loading shapefile... ")
shapefile_raw <- st_read(in_file)

if (compute_level == "nuts3") {
    # select only rows concerning NUTS level 3
    shapefile_raw <- shapefile_raw[shapefile_raw$LEVL_CODE == 3,]
} else if (compute_level == "country") {
    # select only LAUs that are in the EU or EFTA
    shapefile_raw <- shapefile_raw[shapefile_raw$EU_STAT == "T" | shapefile_raw$EFTA_STAT == "T",]
}

# compute the bounding box of the CDI raster
raster_bbox <- st_as_sfc(st_bbox(cdi_raster_raw)) |> st_set_crs(st_crs(shapefile_raw))

# because this process is rather computationally and memory intense, we split computation and outputy by country
countries <- unique(shapefile_raw[[country_identifier]])
for (country in countries) {
    filename <- paste0("data_intermediate/cdi_raster_coverage_", compute_level, "/" , country, ".geojson")
    if (file.exists(filename)) {
        print("File already exists:")
        print(filename)
        print("Skipping...")
        next
    }

    print(paste("processing country: ", country))
    lau <- shapefile_raw[shapefile_raw[[country_identifier]] == country, ]

    # check for invalid polygons: 
    # in the 2021 LAU dataset, a small number of Norway's LAU polygons are self-intersecting.
    # This raises an exception in the next step. I have decided to simply drop those polygons, as they cannot be fixed
    # without major effort or loss of precision and they make up less than 0.1% of the dataset.
    valid_polygons <- st_is_valid(lau)
    n_invalid = sum(!valid_polygons)
    if (n_invalid > 0) {
        print(paste("WARNING: Multiple polygons are self-intersecting: ", n_invalid))
        print("Dropping invalid polys...")
        lau <- lau[valid_polygons, ]
    }

    # check for polygons outside the bounding box - these are overseas areas that do not concern us
    polygon_in_bbox <- st_within(lau, raster_bbox, sparse = FALSE)[, 1]
    n_outside = sum(!polygon_in_bbox)
    
    if (n_outside > 0){
        print(paste("WARNING: Multiple polygons are outside raster extent: ", n_outside))
        print("Dropping invalid polys...")
        lau <- lau[polygon_in_bbox, ]
        if (nrow(lau) < 1) {
            print(paste("WARNING: No polygons are within the CDI frame, skipping country: ", country))
            next
        }
    }

    # this is the reason why this entire script exists - exactextract is great, but the python binding is broken and missing features.
    # This function will efficiently compute, how much of each pixel is covered by a given shape.
    print("extracting coverage... ")
    cf <- exactextractr::coverage_fraction(cdi_raster_raw, lau, crop=TRUE)

    print("computing statistics... ")
    # store cell coverage as 2D matrix for each LAU
    lau$cell_coverage <- lapply(cf, as.matrix)
    lau$cell_coverage <- sapply(lau$cell_coverage, function(x) toJSON(x, auto_unbox = TRUE))

    # store Coordinates for the subgrid so we can later identify, where the intersection occurs.
    lau$xmin <- sapply(cf, xmin)
    lau$xmax <- sapply(cf, xmax)
    lau$ymin <- sapply(cf, ymin)
    lau$ymax <- sapply(cf, ymax)

    print(paste("writing to file: ", filename))
    st_write(lau, filename)
    print("done.")
}
