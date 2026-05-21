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
import {
  createLegendWarning,
  createLegendAlert,
  createSearchBar,
  fill_chart_panel,
  close_chart_panel,
  legend_color_limits_alert,
  legend_colors_alert,
  legend_color_limits_warning,
  legend_colors_warning
} from "./panels.js";



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

  document.getElementById('source').innerHTML = `${translate('source')}: <a target="_blank" style="color:#333333; text-decoration-color:#FF5064;" href="https://correctiv.org/europe/">CORRECTIV</a>, <a target="_blank" style="color:#333333; text-decoration-color:#FF5064;" href="https://drought.emergency.copernicus.eu/">Copernicus</a>`;
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

  
  // NOTE: To make it easier to change the scales later, i have automated the generation of these dictionaries
  // please adapt the limits in the corresponding variables in panels.js from now on.
  const warningColorExpr = ["case"];
  for (let i = 0; i < legend_colors_warning.length - 1; i++) {
    warningColorExpr.push(
      ["<", ["get", "median_drought_days"], legend_color_limits_warning[i + 1]],
      legend_colors_warning[i]
    );
  }
  warningColorExpr.push("#3A2802")

  const alertColorExpr = ["case"];
  for (let i = 0; i < legend_colors_alert.length - 1; i++) {
    alertColorExpr.push(
      ["<", ["get", "median_alert_days"], legend_color_limits_alert[i + 1]],
      legend_colors_alert[i]
    );
  }
  alertColorExpr.push("#3A2802")


  map.addLayer(
    {
      id: "lau_vector",
      type: "fill",
      source: "lau_drought_src",
      "source-layer": "drought_days_lau",
      paint: {
        "fill-color": alertColorExpr,
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

  const btnWarning = document.getElementById("button_warning_days");
  const btnAlert = document.getElementById("button_alert_days");
  btnWarning.innerHTML = translate("drought_warning_button");
  btnAlert.innerHTML = translate("drought_alert_button");

  btnAlert.onclick = () => {
    if (!mapState.show_drought_alert_days) {
      mapState.show_drought_alert_days = true;
      map.setPaintProperty("lau_vector", "fill-color", alertColorExpr);
      document.getElementById("map_legend").innerHTML = "";
      createLegendAlert();
      btnAlert.classList.add("active");
      btnWarning.classList.remove("active");
      close_chart_panel();
    }
  };

  btnWarning.onclick = () => {
    if (mapState.show_drought_alert_days) {
      mapState.show_drought_alert_days = false;
      map.setPaintProperty("lau_vector", "fill-color", warningColorExpr);
      document.getElementById("map_legend").innerHTML = "";
      createLegendWarning();
      btnWarning.classList.add("active");
      btnAlert.classList.remove("active");
      close_chart_panel();
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
  createLegendAlert();

  // Add search bar
  createSearchBar();
});
