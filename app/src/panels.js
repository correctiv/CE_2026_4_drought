import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import { GeocodingControl } from "@maptiler/geocoding-control/maptilersdk";

import * as d3 from "d3";

import { apiKey, SETTINGS } from "./settings";
import { map, mapState } from "./create_map";
import {
  add_hover_events,
  is_details_panel_sticky,
  pick_feature,
} from "./events";

// 13 limits
const legend_color_limits = [5, 10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, ""];
const legend_colors = [
    "#154e89",
    "#256aa8",
    "#3a84bb",
    "#6bacd0",
    "#7fb8d7",
    "#98c7df",
    "#bfdceb",
    "#deebf2",
    "#fae1d3",
    "#f8c3a9",
    "#ee9a7c",
    "#da6a57",
    "#c0383b",
    "#9a1429",
];

//  LEGEND
export const createLegend = () => {
  var w = document.getElementById("map-overlay").offsetWidth;

  const legend_height = 12;
  const legend_width = (w - 20) / 14;

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
    .attr("x", (d, i) => i * legend_width)
    .attr("y", 20)
    .attr("fill", (d, i) => legend_colors[i]);

  legend_svg
    .selectAll("text")
    .data(legend_color_limits)
    .enter()
    .append("text")
    .attr("class", "legend-number")
    .attr("width", legend_width)
    .attr("text-anchor", "middle")
    .attr("x", (d, i) => (i + 1) * legend_width)
    .attr("y", (d, i) => (i % 2 ? 15 : 48))
    .text((d, i) => `${(d)}`);
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
    placeholder: "search_placeholder",
  });
  map.addControl(gc, "top-left");

  gc.on("pick", (e) => {
    pick_feature(e, 0);
  });
}

// DETAILS PANEL
export function fill_chart_panel(feature) {
  document.getElementById("chart-panel").style.display = "block";
  document.getElementById("chart-panel").innerHTML = generate_popup_html(
    feature,
    mapState.color_field,
  );
  load_popup_data(feature);
}

function close_chart_panel() {
  mapState.region_was_clicked = false;
  document.getElementById("chart-panel").style.display = "none";
  add_hover_events();
}

function generate_popup_html(feature, color_field) {
  var since = color_field.substr(-4);
  console.log(feature)
  return `
<div id='data-popup'>
    <a id="close-button">×</a>
    <H2>${feature.properties.nuts_name}</H2>
    Median drought days per year: ${feature.properties.median_drought_days}<br>
    Maximum drought days: ${feature.properties.max_drought_days} (${feature.properties.max_drought_days_year})<br>
    Population: ${feature.properties.population}<br>
    Cropland area: ${feature.properties.cropland_km2}/${feature.properties.area_km2}km (${feature.properties.cropland_area_percent}%)
</div>
`;
}

function load_popup_data(feature) {
  var w = document.getElementById("chart-panel").offsetWidth;
  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 20, left: 30 },
    width = w - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#popup_chart")
    .append("svg")
    .attr("viewBox", `0 0 ${w} ${200}`)
    //.attr("width", width + margin.left + margin.right)
    //.attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // prepare the data:
  var data = [];
  for (var year of [1961, 1971, 1981, 1991, 2001, 2011, 2018, 2021, 2023]) {
    if (feature.properties["pop_" + year] !== undefined) {
      data.push({
        year: year,
        pop: feature.properties["pop_" + year],
      });
    }
  }

  // Add X axis --> number format with no thousand sep

  var x = d3
    .scaleLinear()
    .domain(
      d3.extent(data, function (d) {
        return d.year;
      }),
    )
    .range([0, width]);

  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format(".0f")).ticks(6)); //.format(".0%")
  // Add Y axis
  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return +d.pop;
      }),
    ])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format(".2s")).ticks(8));

  // Add the line
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return x(d.year);
        })
        .y(function (d) {
          return y(d.pop);
        }),
    );

  if (is_details_panel_sticky()) {
    let cb = document.getElementById("close-button");
    cb.style.display = "block";
    cb.onclick = close_chart_panel;
  }
}
