'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function deattribute(data) {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) data.map(el => deattribute(el));else if (typeof data.attributes === 'object' && !Array.isArray(data.attributes) && data.attributes !== null) {
      for (const key of Object.keys(data.attributes)) {
        if (!data.attributes.attributes) {
          data[key] = data.attributes[key];
        }
      }
      if (data.attributes.attributes) {
        data.attributes = data.attributes.attributes;
      } else {
        delete data.attributes;
      }
    }
  }
  return data;
}

exports.deattribute = deattribute;
