'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function error(Error) {
  if (Error.response) {
    const e = Error.response.data;
    if (e !== null && e !== void 0 && e.errors) Error.errors = e.errors;
  }
  throw Error;
}

exports.error = error;
