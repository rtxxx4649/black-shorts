// Compatibility shim for dependencies that still call the legacy Node.js url.parse() API.
// Prefer the WHATWG URL API in application code.
const { URL, URLSearchParams, domainToASCII, domainToUnicode, fileURLToPath, pathToFileURL } = require('node:url');

module.exports = { URL, URLSearchParams, domainToASCII, domainToUnicode, fileURLToPath, pathToFileURL };
