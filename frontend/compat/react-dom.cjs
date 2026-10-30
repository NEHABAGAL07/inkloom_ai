// Compatibility shim for Next.js 16 RSC flight client running on React 18
const ReactDOM = require("react-dom-original");

if (ReactDOM && !ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
  const noop = () => {};
  ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = {
    d: {
      f: noop,
      r: noop,
      D: noop,
      C: noop,
      L: noop,
      m: noop,
      X: noop,
      S: noop,
      M: noop,
    },
    p: 0,
    findDOMNode: null,
  };
}

module.exports = ReactDOM;
