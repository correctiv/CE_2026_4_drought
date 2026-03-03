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
  map.addSource("lau_raster_2011", {
    id: "lau_raster_source",
    type: "raster",
    tiles: [
      "https://api.maptiler.com/maps/0195d7e9-4bd2-733f-ba1a-155b03fc91d9/{z}/{x}/{y}.png?key=" +
        apiKey,
    ],
    tileSize: 256,
  });

  map.addSource("lau", {
    type: "vector",
    url:
      "https://api.maptiler.com/tiles/0195ccaa-64bf-746b-9604-c1a945149c3f/tiles.json?key=" +
      apiKey,
  });

  // Vector layers, which are not dynamic.
  // Adding the LAU as an transparent vector layer to have the tooltip info on hover.
  map.addLayer(
    {
      id: "lau",
      //minzoom: zoom_change,
      type: "fill",
      source: "lau",
      "source-layer": "lau",
      paint: {
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2,
          0.5,
        ],
        "fill-color": "#ffffff20",
        "fill-outline-color": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          "#fefefe00",
          9,
          "hsla(0, 0%, 100%, 1.00)",
        ],
      },
    },
    "Background",
  );

  //Adding the LAUs as a raster image
  map.addLayer(
    {
      id: "lau_raster",
      //maxzoom: zoom_change,
      type: "raster",
      source: "lau_raster_2011",
    },
    "lau",
  );

  add_hover_events();
  // we add the onclick event as this is never changing
  map.on("click", "lau", (e) => {
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
