// Empty module to handle ignored paths
'use strict';

// Export an empty object for both ESM and CommonJS
const emptyModule = {};

// Support for ES modules
export default emptyModule;

// Support for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = emptyModule;
  module.exports.default = emptyModule;
}

// Support for AMD/RequireJS
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return emptyModule;
  });
}
