import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";

import "./style.css";

import { SETTINGS, apiKey } from "./settings.js";
import { map, mapState } from "./create_map.js";
import {
  add_hover_events,
  button_clicked,
  select_feature,
  unselect_feature,
} from "./events";
import { createLegend, createSearchBar, fill_chart_panel } from "./panels.js";

// we change the labels to be in the correct languages
map.on("load", () => {
  for (var label_type of [
    "Country labels",
    "City labels",
    "Continent labels",
  ]) {
    map.setLayoutProperty(label_type, "text-field", [
      "get",
      `name:${SETTINGS.language}`,
    ]);
  }
});

map.once("load", async () => {
  map.addSource("lau_median_drought_days_raster_src", {
    type: "raster",
    tiles: [
      "https://api.maptiler.com/maps/019cd833-21bd-7afe-b6e9-45f58ffb62b7/{z}/{x}/{y}.png?key=" +
      apiKey,
    ],
    tileSize: 256, // TODO: figure out what the correct size is here
  });

  map.addSource("lau_max_drought_days_raster_src", {
    type: "raster",
    tiles: [
      "https://api.maptiler.com/maps/019cd874-363a-725a-aa04-88e7d4dbafa9/{z}/{x}/{y}.png?key=" +
      apiKey,
    ],
    tileSize: 256, // TODO: figure out what the correct size is here
  });

  map.addSource("nuts3_stats", {
    type: "vector",
    url:
      "https://api.maptiler.com/tiles/019cd8b8-ebfc-7ada-8113-e5fd5262ba64/tiles.json?key=" +      
      apiKey,
  });


  // Vector layers, which are not dynamic.
  // Adding the LAU as an transparent vector layer to have the tooltip info on hover.
  map.addLayer(
    {
      id: "nuts3_stats",
      //minzoom: zoom_change,
      type: "fill",
      source: "nuts3_stats",
      "source-layer": "nuts3_stats",
      paint: {
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          4,
          0,
        ],
        "fill-color": "#ffffff20",
        "fill-outline-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          "#fefefe00",
          100,
          "#fefefe00"
          // "hsla(0, 0%, 100%, 1.00)",
        ],
      },
    },
    //"lau_raster",
    "Background",
  );

  // //Adding the LAUs as a raster image
  map.addLayer(
    {
      id: "lau_raster",
      //maxzoom: zoom_change,
      type: "raster",
      source: "lau_median_drought_days_raster_src",
    },
    "nuts3_stats",
    //"Background",
  );

  add_hover_events();
  // we add the onclick event as this is never changing
  map.on("click", "nuts3_stats", (e) => {
    if (mapState.hoveredId && mapState.hoveredId != e.features[0].id) {
      unselect_feature(mapState.hoveredId);
    }
    mapState.region_was_clicked = true;
    mapState.hoveredId = e.features[0].id;
    select_feature(mapState.hoveredId);
    fill_chart_panel(e.features[0]);
    add_hover_events();
  });

  document.getElementById("button_2011").onclick = (e) => {
    button_clicked("evol_perc_2011");
  };

  // Add legend
  createLegend();

  // Add search bar
  createSearchBar();
});
