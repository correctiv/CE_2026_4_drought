import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";

import "./style.css";

import { SETTINGS, apiKey, translate } from "./settings.js";
import { map, mapState } from "./create_map.js";
import {
  add_hover_events,
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

  document.getElementById('source').innerHTML = `${translate('source')}: <a target="_blank" style="color:#333333; text-decoration-color:#FF5064;" href="https://drought.emergency.copernicus.eu/">Copernicus - Combined Drought Indicator<a>`;
  var coll = document.getElementById("detail_button");
  var collContent = document.querySelector(".collapsible-content");
  coll.innerHTML = translate('details_title');
  collContent.innerHTML = translate('details_contents');

  coll.addEventListener("click", function () {
    this.classList.toggle("coll-active");
    if (collContent.style.maxHeight) {
      collContent.style.maxHeight = null;
    } else {
      collContent.style.maxHeight = collContent.scrollHeight + "px";
    }
  });

  map.addSource("lau_drought_src", {
    type: "vector",
    url: "https://api.maptiler.com/tiles/019cd831-e675-799e-af20-b76d15e156dd/tiles.json?key=" + apiKey,
  });

  map.addSource("nuts3_stats", {
    type: "vector",
    url:
      "https://api.maptiler.com/tiles/019cd8b8-ebfc-7ada-8113-e5fd5262ba64/tiles.json?key=" +
      apiKey,
  });

  const medianColorExpr = [
    "case",
    ["<", ["get", "median_drought_days"], 40], "#F3E3C1",
    ["<", ["get", "median_drought_days"], 80], "#E8C36F",
    ["<", ["get", "median_drought_days"], 120], "#C79933",
    ["<", ["get", "median_drought_days"], 160], "#976E12",
    ["<", ["get", "median_drought_days"], 200], "#7B5809",
    ["<", ["get", "median_drought_days"], 240], "#5D4104",
    "#3A2802",
  ];


  map.addLayer(
    {
      id: "lau_vector",
      type: "fill",
      source: "lau_drought_src",
      "source-layer": "drought_days_lau",
      paint: {
        "fill-color": medianColorExpr,
        "fill-opacity": 0.7,
        "fill-outline-color": [
          "interpolate", ["linear"], ["zoom"],
          0, "#00000000",
          8, "#00000018",
        ],
      },
    },
    "Ocean labels",
  );

  // Transparent NUTS3 layer used only as hover/click hit target
  map.addLayer(
    {
      id: "nuts3_stats",
      type: "fill",
      source: "nuts3_stats",
      "source-layer": "nuts3_stats",
      paint: {
        "fill-color": "#000000",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.07,
          0,
        ],
        "fill-outline-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#333333",
          "#00000000",
        ],
      },
    },
    "Country labels",
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


  const positionChartPanelMobile = () => {
    if (window.innerWidth <= 650) {
      const legendH = document.getElementById("map-legend-wrapper").offsetHeight;
      document.getElementById("chart-panel-wrapper").style.bottom = `${legendH}px`;
    } else {
      document.getElementById("chart-panel-wrapper").style.bottom = "";
    }
  };
  positionChartPanelMobile();
  window.addEventListener("resize", positionChartPanelMobile);

  // Add legend
  createLegend();

  // Add search bar
  createSearchBar();
});
