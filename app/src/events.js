import "@maptiler/sdk/dist/maptiler-sdk.css";

import "@maptiler/geocoding-control/style.css";
import * as d3 from "d3";

import { map, mapState } from "./create_map.js";
import { fill_chart_panel } from "./panels.js";

// allow to remove hover events if a region is clicked
let registered_events = [];

export function is_details_panel_sticky() {
  // always true if we are on mobile. On desktop, true if one region was clicked, and until the details pannel is actively closed.
  return is_mobile() || mapState.region_was_clicked;
}

function is_mobile() {
  return window.innerWidth <= 650;
}

export function button_clicked(field) {
  if (mapState.color_field != field) {
    mapState.color_field = field;
    map.removeLayer("lau_raster");
    add_dynamic_layers();
  }
}

export function select_feature(featureId) {
  map.setFeatureState(
    { source: "nuts3_stats", sourceLayer: "nuts3_stats", id: featureId },
    { hover: true },
  );
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = "pointer";
}

export function unselect_feature(featureId) {
  map.setFeatureState(
    { source: "nuts3_stats", sourceLayer: "nuts3_stats", id: featureId },
    { hover: false },
  );
}

export function add_hover_events() {
  // If necessary, adds the hover.
  registered_events.forEach((e) => e.unsubscribe());
  registered_events = [];

  if (!is_details_panel_sticky()) {
    registered_events.push(
      map.on("mousemove", "nuts3_stats", (e) => {
        if (mapState.hoveredId != e.features[0].id) {
          unselect_feature(mapState.hoveredId);
          mapState.hoveredId = e.features[0].id;
          select_feature(mapState.hoveredId);
          fill_chart_panel(e.features[0]);
        }
      }),
    );

    registered_events.push(
      map.on("mouseleave", "nuts3_stats", () => {
        if (mapState.hoveredId) {
          unselect_feature(mapState.hoveredId);
          mapState.hoveredId = null;
          map.getCanvas().style.cursor = "";
          document.getElementById("chart-panel").style.display = "none";
        }
      }),
    );
  }
}

export function pick_feature(e, retry) {
  if (e.feature && retry < 6) {
    setTimeout(() => {
      var vector_features = map.querySourceFeatures("nuts3_stats", {
        sourceLayer: "nuts3_stats",
      });
      for (const feature of vector_features) {
        if (d3.geoContains(feature, e.feature.center)) {
          select_feature(feature.id);
          fill_chart_panel(feature);
          return;
        }
      }
      //no features or not there, we wait and maybe retry.
      pick_feature(e, retry + 1);
    }, 500);
  }
}
