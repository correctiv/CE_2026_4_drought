import { SETTINGS, apiKey } from "./settings.js";

import { Map, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";

// will turn to true when a region is clicked, and to false if the detail pannel is closed.
export const mapState = {
  region_was_clicked: false,
  hoveredId: null,
  color_field: "evol_perc_2011",
};

// Vector style version of the background map
const source = "019e3b21-c81c-7f99-abcd-728ecd3b77fa";

// Generate the basic map
config.apiKey = apiKey;
export const map = new Map({
  container: "map", // container id
  style: source,
  center: [SETTINGS.center_lon, SETTINGS.center_lat],
  zoom: SETTINGS.zoom, // starting zoom
});

window._map = map;
