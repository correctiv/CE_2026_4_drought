import * as d3 from "d3";

const DICTIONARY = {};

export function is_mobile() {
    return (window.innerWidth <= 650);
}

// Get the browser language
const supported_languages = ["de"];
let browser_language = (navigator.language || navigator.userLanguage).substr(
  0,
  2,
);

export var SETTINGS = {
  language: browser_language in supported_languages ? browser_language : "en",
  center_lat: 46.218,
  center_lon: 6.121,
  zoom: 3,
};

// If in an iframe, get the settings from the iframes name-property
if (window.self !== window.top) {
  // name should be in format "language#zoom/center_lat/center_lon"
  // example "en#3.5/51.2089/10.2691"
  // console.log(`we are loaded inside an iframe, called [${window.name}]`);

  var iframe_info = window.name.split("#");
  SETTINGS = {
    language: iframe_info[0],
    zoom: parseInt(iframe_info[1].split("/")[0]),
    center_lat: parseFloat(iframe_info[1].split("/")[1]),
    center_lon: parseFloat(iframe_info[1].split("/")[2]),
  };
}

export const apiKey = "1FVQ7wiLPwXxphATxN6S";



d3.csv(import.meta.env.BASE_URL + 'translations.csv', function (d) {
    DICTIONARY[d['key']] = {};
    for (let k in d) {
        if (k != 'key') {
            DICTIONARY[d['key']][k] = d[k];
        }
    }
});

if (is_mobile()) {
    SETTINGS.center_lat = 50;
    SETTINGS.center_lon = 10;
    SETTINGS.zoom = 4.5;
}


export function translate(key) {
    if (key in DICTIONARY && SETTINGS.language in DICTIONARY[key]) {
        return DICTIONARY[key][SETTINGS.language];
    }
    console.log(`No translations for [${key}] in [${SETTINGS.language}]`);
    return key;
}