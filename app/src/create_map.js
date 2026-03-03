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
const source = "0195cce4-aeae-768b-8b67-c18e34a19224";

// Generate the basic map
config.apiKey = apiKey;
export const map = new Map({
  container: "map", // container id
  style: source,
  center: [SETTINGS.center_lon, SETTINGS.center_lat],
  zoom: SETTINGS.zoom, // starting zoom
});
