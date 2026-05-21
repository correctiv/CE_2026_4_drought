import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import { GeocodingControl } from "@maptiler/geocoding-control/maptilersdk";

import * as d3 from "d3";
import { apiKey, SETTINGS, translate } from "./settings";
import { map, mapState } from "./create_map";
import {
  add_hover_events,
  is_details_panel_sticky,
  pick_feature,
} from "./events";


if (!String.format) {
  String.format = function (format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}

// 8 limits (start + 6 breaks + end)
export const legend_color_limits_alert = [0, 5, 10, 20, 30, 40, 50, 365];
export const legend_colors_alert = [
  "#F3E3C1",
  "#E8C36F",
  "#C79933",
  "#976E12",
  "#7B5809",
  "#5D4104",
  "#3A2802",
];

export const legend_color_limits_warning = [0, 40, 80, 120, 160, 200, 240, 365];
export const legend_colors_warning = [
  "#F3E3C1",
  "#E8C36F",
  "#C79933",
  "#976E12",
  "#7B5809",
  "#5D4104",
  "#3A2802",
];

// 6 limits (start + 4 breaks + end)
//  LEGEND
export const createLegendAlert = () => {
  var w = document.getElementById("map-legend-wrapper").offsetWidth;

  const legend_height = 12;
  const legend_width = (w - 20) / 7;

  const legend_svg = d3
    .select("#map_legend")
    .append("svg")
    .attr("viewBox", `0 0 ${w - 20} 50`);

  legend_svg
    .selectAll("rect")
    .data(legend_colors_alert)
    .enter()
    .append("rect")
    .attr("width", legend_width)
    .attr("height", legend_height)
    .attr("x", (_, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (_, i) => legend_colors_alert[i]);

  legend_svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", legend_width * 10)
    .attr("height", legend_height)
    .attr("fill", "none")
    .attr("stroke", "#333333")
    .attr("stroke-width", 0.5);

  legend_svg
    .selectAll("text")
    .data(legend_color_limits_alert)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", (_, i) => i === 0 ? "start" : i === legend_color_limits_alert.length - 1 ? "end" : "middle")
    .attr("x", (_, i) => i * legend_width)
    .attr("y", (_, i) => (i % 2 ? 15 : 48))
    .text((d) => `${d}`);
};


export const createLegendWarning = () => {
  var w = document.getElementById("map-legend-wrapper").offsetWidth;

  const legend_height = 12;
  const n = legend_colors_warning.length;
  const legend_width = (w - 20) / n;

  const legend_svg = d3
    .select("#map_legend")
    .append("svg")
    .attr("viewBox", `0 0 ${w - 20} 50`);

  legend_svg
    .selectAll("rect")
    .data(legend_colors_warning)
    .enter()
    .append("rect")
    .attr("width", legend_width)
    .attr("height", legend_height)
    .attr("x", (_, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (_, i) => legend_colors_warning[i]);

  legend_svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", legend_width * n)
    .attr("height", legend_height)
    .attr("fill", "none")
    .attr("stroke", "#333333")
    .attr("stroke-width", 0.5);

  legend_svg
    .selectAll("text")
    .data(legend_color_limits_warning)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", (_, i) => i === 0 ? "start" : i === legend_color_limits_warning.length - 1 ? "end" : "middle")
    .attr("x", (_, i) => i * legend_width)
    .attr("y", (_, i) => (i % 2 ? 15 : 48))
    .text((d) => `${d}`);
};

// SEARCH PANEL
export function createSearchBar() {
  // Add search place feature
  var bbox = [-20.654297, 26.431228, 31.113281, 71.524909];
  const gc = new GeocodingControl({
    apiKey: apiKey,
    bbox: bbox,
    language: SETTINGS.language,
    types: [
      "region",
      "joint_municipality",
      "joint_submunicipality",
      "municipality",
      "locality",
    ],
    placeholder: translate("search_placeholder"),
  });
  map.addControl(gc, "top-left");

  gc.on("pick", (e) => {
    pick_feature(e, 0);
  });
}

// DETAILS PANEL
export function fill_chart_panel(feature) {
  document.getElementById("chart-panel").style.display = "block";
  document.getElementById("chart-panel").innerHTML = generate_popup_html(feature);

  if (is_details_panel_sticky()) {
    let cb = document.getElementById("close-button");
    cb.style.display = "block";
    cb.onclick = close_chart_panel;
  }
}

export function close_chart_panel() {
  mapState.region_was_clicked = false;
  document.getElementById("chart-panel").style.display = "none";
  add_hover_events();
}

function num_format(num) {

  if (SETTINGS.language == "de") {
    if (num == null){
      return "--"
    } else {
      return num.toLocaleString("de-DE")
    }
  } else {
    if (num == null){
      return "--"
    } else {
    return num.toLocaleString("en-US")
    }
  }
}

function generate_popup_html(feature) {
  
  if (mapState.show_drought_alert_days) {
    var pct = Math.min((feature.properties.median_alert_days / 365) * 100, 100).toFixed(1);
    var pctMax = Math.min((feature.properties.max_alert_days / 365) * 100, 100).toFixed(1);
  } else {
    var pct = Math.min((feature.properties.median_drought_days / 365) * 100, 100).toFixed(1);
    var pctMax = Math.min((feature.properties.max_drought_days / 365) * 100, 100).toFixed(1);
  }

  return `<div id='data-popup'>
    <a id="close-button">×</a>
    <H2>${feature.properties.nuts_name}</H2>
    ${(feature.properties.cropland_area_percent == null) ?
      String.format(translate("details_cropland"), translate("nodata"), ""):
      String.format(translate("details_cropland"), num_format(feature.properties.cropland_area_percent), translate("percent"))}<br>
    ${String.format(translate("details_pop"), num_format(feature.properties.population))}<br>  <span class="tight-break"></span>
    ${mapState.show_drought_alert_days ? 
      String.format(translate("details_median"), num_format(Math.round(feature.properties.median_alert_days)), translate("drought_alert")) : 
      String.format(translate("details_median"), num_format(Math.round(feature.properties.median_drought_days)), translate("drought_warning"))}<br>
    <div class="drought-bar-track">
      <div class="drought-bar-fill" style="width:${pct}%"></div>
    </div>
    <div class="drought-bar-labels">
      <span>0</span><span>365</span>
    </div>
    <span class="tight-break"></span>
    ${mapState.show_drought_alert_days ? 
      String.format(translate("details_max"), num_format(Math.round(feature.properties.max_alert_days)), feature.properties.max_alert_days_year, translate("drought_alert_2")):
      String.format(translate("details_max"), num_format(Math.round(feature.properties.max_drought_days)), feature.properties.max_drought_days_year, translate("drought_warning_2"))}<br>
    <div class="drought-bar-track" style="margin-bottom:1px">
      <div class="drought-bar-fill" style="width:${pctMax}%"></div>
    </div>
    <div class="drought-bar-labels">
      <span>0</span><span>365</span>
    </div>
</div>`;
}

