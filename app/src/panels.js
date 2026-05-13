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
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}

// 9 limits
export const legend_color_limits = [25, 45, 65, 85, 105, 130, 155, 175, 200, ""];
export const legend_colors = [
    "#FFFFFF",
    "#FFE3AE",
    "#FFC655",
    "#FFAA00",
    "#FF7100",
    "#FF3355",
    "#C70021",
    "#901F32",
    "#6C2F39",
    "#452D31",
];


// 4 limits (max drought days)
export const legend_color_limits_max = [100, 175, 250, 300, ""];
export const legend_colors_max = [
    "#FFFFFF",
    "#FFE3AE",
    "#FFAA00",
    "#FF3355",
    "#901F32",
];

//  LEGEND
export const createLegend = () => {
  var w = document.getElementById("map-legend-wrapper").offsetWidth;

  const legend_height = 12;
  const legend_width = (w - 20) / 10;

  const legend_svg = d3
    .select("#map_legend")
    .append("svg")
    .attr("viewBox", `0 0 ${w - 20} 50`);

  legend_svg
    .selectAll("rect")
    .data(legend_colors)
    .enter()
    .append("rect")
    .attr("width", legend_width)
    .attr("height", legend_height)
    .attr("x", (_, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (_, i) => legend_colors[i]);

  legend_svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", legend_width * 10)
    .attr("height", legend_height)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);

  legend_svg
    .selectAll("text")
    .data(legend_color_limits)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", "middle")
    .attr("x", (_, i) => (i + 1) * legend_width)
    .attr("y", (_, i) => (i % 2 ? 15 : 48))
    .text((d) => `${d}`);
};


export const createLegendMax = () => {
  var w = document.getElementById("map-legend-wrapper").offsetWidth;

  const legend_height = 12;
  const n = legend_colors_max.length;
  const legend_width = (w - 20) / n;

  const legend_svg = d3
    .select("#map_legend")
    .append("svg")
    .attr("viewBox", `0 0 ${w - 20} 50`);

  legend_svg
    .selectAll("rect")
    .data(legend_colors_max)
    .enter()
    .append("rect")
    .attr("width", legend_width)
    .attr("height", legend_height)
    .attr("x", (_, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (_, i) => legend_colors_max[i]);

  legend_svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", legend_width * n)
    .attr("height", legend_height)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);

  legend_svg
    .selectAll("text")
    .data(legend_color_limits_max)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", "middle")
    .attr("x", (_, i) => (i + 1) * legend_width)
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

function close_chart_panel() {
  mapState.region_was_clicked = false;
  document.getElementById("chart-panel").style.display = "none";
  add_hover_events();
}

function num_format(num) {
  if (SETTINGS.language == "de") {
    return num.toLocaleString("de-DE")
  } else {
    return num.toLocaleString("en-US")
  }
}

function generate_popup_html(feature) {
  return `<div id='data-popup'>
    <a id="close-button">×</a>
    <H2>${feature.properties.nuts_name}</H2>
    ${String.format(translate("details_cropland"), num_format(feature.properties.median_drought_days))}<br>
    ${String.format(translate("details_pop"), num_format(feature.properties.population))}<br>  <span class="tight-break"></span>
    ${String.format(translate("details_median"), num_format(feature.properties.median_drought_days))}<br>  <span class="tight-break"></span>
    ${String.format(translate("details_max"), num_format(feature.properties.max_drought_days), feature.properties.max_drought_days_year)}<br>
</div>`;
}

