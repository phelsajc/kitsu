'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var error = require('./error.js');

function filterIncludes(included, _ref) {
  let {
    id,
    type
  } = _ref;
  try {
    if (id && type) {
      const filtered = included.filter(el => {
        return el.id === id && el.type === type;
      })[0] || {
        id,
        type
      };
      return Object.assign({}, filtered);
    } else {
      return {};
    }
  } catch (E) {
    error.error(E);
  }
}

exports.filterIncludes = filterIncludes;
