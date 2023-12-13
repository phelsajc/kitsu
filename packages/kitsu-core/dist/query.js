'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function queryFormat(value, key, traditional) {
  if (traditional && value !== null && Array.isArray(value)) return value.map(v => queryFormat(v, key, traditional)).join('&');
  if (!traditional && value !== null && Array.isArray(value)) return value.map(v => queryFormat(v, `${key}[]`, traditional)).join('&');else if (value !== null && typeof value === 'object') return query(value, key, traditional);else return encodeURIComponent(key) + '=' + encodeURIComponent(value);
}
function paramKeyName(param) {
  if (['[]', ']['].includes(param.slice(-2))) {
    return `[${param.slice(0, -2)}][]`;
  }
  return `[${param}]`;
}
function query(params) {
  let prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  let traditional = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  const str = [];
  for (const param in params) {
    str.push(queryFormat(params[param], prefix ? `${prefix}${paramKeyName(param)}` : param, traditional));
  }
  return str.join('&');
}

exports.paramKeyName = paramKeyName;
exports.query = query;
