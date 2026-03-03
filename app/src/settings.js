// Get the browser language
const supported_languages = ["en", "fr"];
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
