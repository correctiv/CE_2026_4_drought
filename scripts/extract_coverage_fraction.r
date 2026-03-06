library(terra)
library(exactextractr)
library(sf)
library(raster)
library(jsonlite)  # for toJSON
options(error = traceback)
# Load raster and polygons

compute_LAUs <- TRUE # NOTE: toggle this to switch between analysis for NUTS3 (FALSE) or LAUs (TRUE)
country_identifier <- "CNTR_CODE"

if (compute_LAUs) {
    in_file <- "data_intermediate/eu_uk_laus_joined.shp"
    out_name <- "lau"
} else {
    in_file <- "data_raw/NUTS_RG_01M_2021_4326.shp"
    out_name <- "nuts3"

}

print("loading CDI raster data... ")
# which cdi file we choose does not matter because we are only interested in the metadata – which is the same across time. So we simply pick the first one.
cdi_raster_raw <- raster("data_raw/combined_drought_indicator_2012-2025/cdinx_m_edo_20120121_20121221_t/cdinx_m_edo_20120121_t_400_z03.tif")


print("loading shapefile... ")
shapefile_raw <- st_read(in_file)

if (!compute_LAUs) {
    shapefile_raw <- shapefile_raw[shapefile_raw$LEVL_CODE == 3,]
}

# bounding box for the CDI raster
raster_bbox <- st_as_sfc(st_bbox(cdi_raster_raw)) |> st_set_crs(st_crs(shapefile_raw))

countries <- unique(shapefile_raw[[country_identifier]])
for (country in countries) {
    filename <- paste0("data_intermediate/", out_name , "_coverage/" , country, ".geojson")
    if (file.exists(filename)) {
        print("File already exists:")
        print(filename)
        print("Skipping...")
        next
    }

    print(paste("processing country: ", country))
    lau <- shapefile_raw[shapefile_raw[[country_identifier]] == country, ]

    # check for invalid polygons: 
    # in the 2021 LAU dataset, a small number of Norways (and possibly others) LAU polygons are self-intersecting.
    # This raises an exception in the next step. I have decided to simply drop those polygons, as they cannot be fixed
    # without major effort and make up less than .1% of the dataset.
    valid_polygons <- st_is_valid(lau)
    n_invalid = sum(!valid_polygons)
    if (n_invalid > 0) {
        print(paste("WARNING: Multiple polygons are self-intersecting: ", n_invalid))
        print("Dropping invalid polys...")
        lau <- lau[valid_polygons, ]
    }


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

    print("extracting coverage... ")
    cf <- exactextractr::coverage_fraction(cdi_raster_raw, lau, crop=TRUE)

    print("computing statistics... ")
    # store cell coverage as 2D matrix for each LAU
    lau$cell_coverage <- lapply(cf, as.matrix)
    lau$cell_coverage <- sapply(lau$cell_coverage, function(x) toJSON(x, auto_unbox = TRUE))

    # store Coordinates for each cell to be converted
    lau$xmin <- sapply(cf, xmin)
    lau$xmax <- sapply(cf, xmax)
    lau$ymin <- sapply(cf, ymin)
    lau$ymax <- sapply(cf, ymax)

    print(paste("writing to file: ", filename))
    st_write(lau, filename)
    print("done.")
}
