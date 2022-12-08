// const { color } = require("console-log-colors");
const moment = require("moment");

const regExpEscape = (string) => string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const consoleInfo = (message, onOneLine = false) => {
    message = color.cyan(`[${moment().format("YYYY-MM-DD H:mm:ss")}]`) + " " + message;
    onOneLine ? process.stdout.write("\r" + message) : console.log(message);
}

const humanFileSize = (bytes, si=false, dp=1) => {
    if (!bytes) {
      return null;
    }

    const thresh = si ? 1000 : 1024;
  
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
  
    const units = si 
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;
  
    do {
      bytes /= thresh;
      ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  
  
    return bytes.toFixed(dp) + ' ' + units[u];
}

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

function cleanFbUrl(url) {
  return url.replace(/&amp;/g, "&");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    consoleInfo,
    regExpEscape,
    capitalizeFirstLetter,
    humanFileSize,
    isValidUrl,
    cleanFbUrl,
    sleep
}