library(terra)
library(exactextractr)
library(sf)
library(raster)
library(jsonlite)  # for toJSON
options(error = traceback)
# Load raster and polygons

print("loading raster data... ")
r <- raster("/Users/johannesgille/Desktop/CE_2026_4_drought/data_raw/combined_drought_indicator_2012-2025/cdinx_m_edo_20120121_20121221_t/cdinx_m_edo_20120121_t_400_z03.tif")

print("loading LAU shapefile")
lau_shapes <- st_read("data_raw/LAU_RG_01M_2024_4326.shp")
# lau <- lau[lau$CNTR_CODE == "DE", ]

countries <- unique(lau_shapes$CNTR_CODE)

# bounding box for the CDI raster
r_ext <- st_as_sfc(st_bbox(r)) |> st_set_crs(st_crs(lau_shapes))

for (country in countries) {
    filename <- paste0("data_intermediate/lau_coverage/", country, ".geojson")
    if (file.exists(filename)) {
        print("File already exists:")
        print(filename)
        print("Skipping...")
        next
    }



    print(paste("processing country: ", country))
    lau <- lau_shapes[lau_shapes$CNTR_CODE == country, ]


    overlaps <- st_intersects(lau, r_ext, sparse = FALSE)[, 1]
    n_outside = sum(!overlaps)
    if (n_outside > 0){
        print(paste("WARNING: Multiple LAUs are outside raster extent: ", n_outside))
        print("filtering overseas LAUs... ")
        lau <- lau[overlaps, ]
    }

    print("extracting coverage... ")
    # foo <- exactextractr::coverage_fraction(r_raster, v_sf)
    cf <- exactextractr::coverage_fraction(r, lau, crop=TRUE)

    print("computing statistics... ")
    # store cell coverage as 2D matrix for each LAU
    lau$cell_coverage <- sapply(cf, as.matrix)
    lau$cell_coverage <- sapply(lau$cell_coverage, function(x) toJSON(x, auto_unbox = TRUE))

    # store Coordinates for each cell to be convert
    lau$xmin <- sapply(cf, xmin)
    lau$xmax <- sapply(cf, xmax)
    lau$ymin <- sapply(cf, ymin)
    lau$ymax <- sapply(cf, ymax)

    print(paste("writing to file: ", filename))
    st_write(lau, filename)
    print("done.")
}
