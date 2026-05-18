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
import { createLegend, createLegendMax, createSearchBar, fill_chart_panel } from "./panels.js";

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

  document.getElementById('source').innerHTML = `<i>${translate('source')}: <a target="_blank" style="color:#333333; font-style: italic; text-decoration-color:#FF5064;" href="https://drought.emergency.copernicus.eu/data/factsheets/factsheet_combinedDroughtIndicator_v4.pdf">Copernicus - Combined Drought Indicator<a></i>`;
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
    ["<", ["get", "median_drought_days"], 30], "#FFFDF9",
    ["<", ["get", "median_drought_days"], 60], "#F9F3E8",
    ["<", ["get", "median_drought_days"], 90], "#E7D6B1",
    ["<", ["get", "median_drought_days"], 120], "#DCC187",
    ["<", ["get", "median_drought_days"], 150], "#D0AC5E",
    ["<", ["get", "median_drought_days"], 180], "#C59734",
    ["<", ["get", "median_drought_days"], 210], "#B2892F",
    ["<", ["get", "median_drought_days"], 240], "#9E7A2A",
    ["<", ["get", "median_drought_days"], 270], "#8B6C25",
    "#775D20",
  ];

  const maxColorExpr = [
    "case",
    ["<", ["get", "max_drought_days"], 72], "#FFFDF9",
    ["<", ["get", "max_drought_days"], 144], "#D6B562",
    ["<", ["get", "max_drought_days"], 216], "#C59734",
    ["<", ["get", "max_drought_days"], 288], "#917126",
    "#775D20",
  ];

  map.addLayer(
    {
      id: "lau_vector",
      type: "fill",
      source: "lau_drought_src",
      "source-layer": "drought_days_lau",
      paint: {
        "fill-color": medianColorExpr,
        "fill-opacity": 0.6,
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

  let show_max_drought_days = false;

  const btnMedian = document.getElementById("button_median_drought");
  const btnMax = document.getElementById("button_max_drought");

  btnMax.onclick = () => {
    if (!show_max_drought_days) {
      show_max_drought_days = true;
      map.setPaintProperty("lau_vector", "fill-color", maxColorExpr);
      document.getElementById("map_legend").innerHTML = "";
      createLegendMax();
      btnMax.classList.add("active");
      btnMedian.classList.remove("active");
    }
  };

  btnMedian.onclick = () => {
    if (show_max_drought_days) {
      show_max_drought_days = false;
      map.setPaintProperty("lau_vector", "fill-color", medianColorExpr);
      document.getElementById("map_legend").innerHTML = "";
      createLegend();
      btnMedian.classList.add("active");
      btnMax.classList.remove("active");
    }
  };

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
