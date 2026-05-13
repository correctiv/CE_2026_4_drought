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

  document.getElementById('source').innerHTML = `<i>${translate('source')}: <a target="_blank" style="color:#ff5064; font-style: italic;" href="https://drought.emergency.copernicus.eu/data/factsheets/factsheet_combinedDroughtIndicator_v4.pdf">Copernicus - Combined Drought Indicator<a></i>`;
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
        "fill-color": "#000000",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.2,
          0,
        ],
        "fill-outline-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "rgba(0,0,0,0.4)",
          "rgba(0,0,0,0)",
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

  let show_max_drought_days = false;

  const btnMedian = document.getElementById("button_median_drought");
  const btnMax = document.getElementById("button_max_drought");

  btnMax.onclick = () => {
    if (!show_max_drought_days) {
      show_max_drought_days = true;
      map.removeLayer("lau_raster");
      map.addLayer(
        { id: "lau_raster", type: "raster", source: "lau_max_drought_days_raster_src" },
        "nuts3_stats",
      );
      document.getElementById("map_legend").innerHTML = "";
      createLegendMax();
      btnMax.classList.add("active");
      btnMedian.classList.remove("active");
    }
  };

  btnMedian.onclick = () => {
    if (show_max_drought_days) {
      show_max_drought_days = false;
      map.removeLayer("lau_raster");
      map.addLayer(
        { id: "lau_raster", type: "raster", source: "lau_median_drought_days_raster_src" },
        "nuts3_stats",
      );
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

  //map.getLayer("lau_raster").addSource()

  // Add legend
  createLegend();

  // Add search bar
  createSearchBar();
});
