(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.kitsuCore = {}));
})(this, (function (exports) { 'use strict';

  const camel = input => input.replace(/[-_][a-z\u00E0-\u00F6\u00F8-\u00FE]/g, match => match.slice(1).toUpperCase());

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

  function error(Error) {
    if (Error.response) {
      const e = Error.response.data;
      if (e !== null && e !== void 0 && e.errors) Error.errors = e.errors;
    }
    throw Error;
  }

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
      error(E);
    }
  }

  const isDeepEqual = (left, right) => {
    if (!left || !right) {
      return left === right;
    }
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      const leftValue = left[key];
      const rightValue = right[key];
      const isObjects = isObject(leftValue) && isObject(rightValue);
      if (isObjects && !isDeepEqual(leftValue, rightValue) || !isObjects && leftValue !== rightValue) {
        return false;
      }
    }
    return true;
  };
  const isObject = object => {
    return object != null && typeof object === 'object';
  };

  function link(_ref, included, previouslyLinked, relationshipCache) {
    let {
      id,
      type,
      meta
    } = _ref;
    const filtered = filterIncludes(included, {
      id,
      type
    });
    previouslyLinked[`${type}#${id}`] = filtered;
    if (filtered.relationships) {
      linkRelationships(filtered, included, previouslyLinked, relationshipCache);
    }
    return deattribute(filtered);
  }
  function linkArray(data, included, key, previouslyLinked, relationshipCache) {
    data[key] = {};
    if (data.relationships[key].links) data[key].links = data.relationships[key].links;
    if (data.relationships[key].meta) data[key].meta = data.relationships[key].meta;
    data[key].data = [];
    for (const resource of data.relationships[key].data) {
      const cache = previouslyLinked[`${resource.type}#${resource.id}`];
      let relationship = cache || link(resource, included, previouslyLinked, relationshipCache);
      if (resource.meta || relationship.meta) {
        relationship = {
          ...relationship,
          meta: {
            ...relationship.meta,
            ...resource.meta
          }
        };
      }
      data[key].data.push(relationship);
    }
    delete data.relationships[key];
  }
  function linkObject(data, included, key, previouslyLinked, relationshipCache) {
    data[key] = {};
    const resource = data.relationships[key].data;
    const cache = previouslyLinked[`${resource.type}#${resource.id}`];
    if (cache) {
      let resourceCache = null;
      if (!isDeepEqual(cache.meta, resource.meta)) {
        resourceCache = {
          ...cache,
          meta: {
            ...cache.meta,
            ...resource.meta
          }
        };
      } else {
        resourceCache = cache;
      }
      data[key].data = resourceCache;
    } else {
      data[key].data = link(resource, included, previouslyLinked, relationshipCache);
    }
    if (resource.meta || data[key].data.meta) {
      data[key].data = {
        ...data[key].data,
        meta: {
          ...data[key].data.meta,
          ...resource.meta
        }
      };
    }
    const cacheKey = `${data.type}#${data.id}#${key}`;
    const relationships = relationshipCache[cacheKey] || data.relationships[key];
    if (!relationshipCache[cacheKey]) relationshipCache[cacheKey] = relationships;
    if (relationships !== null && relationships !== void 0 && relationships.links) data[key].links = relationships.links;
    if (relationships !== null && relationships !== void 0 && relationships.meta) data[key].meta = relationships.meta;
    delete data.relationships[key];
  }
  function linkAttr(data, key) {
    data[key] = {};
    if (data.relationships[key].links) data[key].links = data.relationships[key].links;
    if (data.relationships[key].meta) data[key].meta = data.relationships[key].meta;
    delete data.relationships[key];
  }
  function linkRelationships(data) {
    let included = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let previouslyLinked = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let relationshipCache = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    const {
      relationships
    } = data;
    for (const key in relationships) {
      var _relationships$key;
      if (Array.isArray((_relationships$key = relationships[key]) === null || _relationships$key === void 0 ? void 0 : _relationships$key.data)) {
        linkArray(data, included, key, previouslyLinked, relationshipCache);
      } else if (relationships[key].data) {
        linkObject(data, included, key, previouslyLinked, relationshipCache);
      } else {
        linkAttr(data, key);
      }
    }
    if (Object.keys(relationships || []).length === 0 && typeof relationships === 'object' && !Array.isArray(relationships) && relationships !== null) {
      delete data.relationships;
    }
    return data;
  }

  function deserialiseArray(array) {
    const previouslyLinked = {};
    const relationshipCache = {};
    for (let value of array.data) {
      const included = [...array.data.map(item => ({
        ...item,
        relationships: {
          ...item.relationships
        }
      })), ...(array.included || [])];
      value = linkRelationships(value, included, previouslyLinked, relationshipCache);
      if (value.attributes) value = deattribute(value);
      array.data[array.data.indexOf(value)] = value;
    }
    return array;
  }
  function deserialise(response) {
    var _response$data;
    if (!response) return;
    if (Array.isArray(response.data)) response = deserialiseArray(response);else if (response.included) response.data = linkRelationships(response.data, response.included);else if (typeof response.data === 'object' && response.data !== null) response.data = linkRelationships(response.data);
    delete response.included;
    if ((_response$data = response.data) !== null && _response$data !== void 0 && _response$data.attributes) response.data = deattribute(response.data);
    return response;
  }

  const kebab = input => input.charAt(0).toLowerCase() + input.slice(1).replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, match => '-' + match.toLowerCase());

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

  function isValid(isArray, type, payload, method) {
    const requireID = new Error(`${method} requires an ID for the ${type} type`);
    if (type === undefined) {
      throw new Error(`${method} requires a resource type`);
    }
    if (isArray) {
      if (method !== 'POST' && payload.length > 0) {
        for (const resource of payload) {
          if (!resource.id) throw requireID;
        }
      }
    } else {
      if (typeof payload !== 'object' || method !== 'POST' && Object.keys(payload).length === 0) {
        throw new Error(`${method} requires an object or array body`);
      }
      if (method !== 'POST' && !payload.id) {
        throw requireID;
      }
    }
  }
  function serialiseRelationOne(node, nodeType) {
    if (node === null) return node;
    let relation = {};
    for (const prop of Object.keys(node)) {
      if (['id', 'type'].includes(prop)) relation[prop] = node[prop];else relation = serialiseAttr(node[prop], prop, relation);
    }
    if (!relation.type) relation.type = nodeType;
    return relation;
  }
  function serialiseRelationMany(node, nodeType) {
    const relation = [];
    for (const prop of node) {
      const serialised = serialiseRelationOne(prop);
      if (!serialised.type) serialised.type = nodeType;
      relation.push(serialised);
    }
    return relation;
  }
  function serialiseRelation(node, nodeType, key, data) {
    var _node$links, _node$links2;
    if (!data.relationships) data.relationships = {};
    data.relationships[key] = {
      data: Array.isArray(node.data) ? serialiseRelationMany(node.data, nodeType) : serialiseRelationOne(node.data, nodeType)
    };
    if (node !== null && node !== void 0 && (_node$links = node.links) !== null && _node$links !== void 0 && _node$links.self || node !== null && node !== void 0 && (_node$links2 = node.links) !== null && _node$links2 !== void 0 && _node$links2.related) data.relationships[key].links = node.links;
    if (node !== null && node !== void 0 && node.meta) data.relationships[key].meta = node.meta;
    return data;
  }
  function serialiseAttr(node, key, data) {
    if (!data.attributes) data.attributes = {};
    if (key === 'links' && (typeof node.self === 'string' || typeof node.related === 'string')) data.links = node;else if (key === 'meta' && typeof node === 'object' && !Array.isArray(node) && node !== null) data.meta = node;else data.attributes[key] = node;
    return data;
  }
  function hasID(node) {
    var _node$data;
    if ((node === null || node === void 0 ? void 0 : node.data) === null || Array.isArray(node === null || node === void 0 ? void 0 : node.data) && (node === null || node === void 0 || (_node$data = node.data) === null || _node$data === void 0 ? void 0 : _node$data.length) === 0) return true;
    if (!node.data) return false;
    const nodeData = Array.isArray(node.data) ? node.data[0] : node.data;
    return Object.prototype.hasOwnProperty.call(nodeData, 'id');
  }
  function serialiseRootArray(type, payload, method, options) {
    isValid(true, type, payload, method);
    const data = [];
    for (const resource of payload) {
      data.push(serialiseRootObject(type, resource, method, options).data);
    }
    return {
      data
    };
  }
  function serialiseRootObject(type, payload, method, options) {
    isValid(false, type, payload, method);
    type = options.pluralTypes(options.camelCaseTypes(type));
    let data = {
      type
    };
    if (payload !== null && payload !== void 0 && payload.id) data.id = String(payload.id);
    for (const key in payload) {
      const node = payload[key];
      const nodeType = options.pluralTypes(options.camelCaseTypes(key));
      if (typeof node === 'object' && !Array.isArray(node) && node !== null && hasID(node)) {
        data = serialiseRelation(node, nodeType, key, data);
      } else if (key !== 'id' && key !== 'type') {
        data = serialiseAttr(node, key, data);
      }
    }
    return {
      data
    };
  }
  function serialise(type) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'POST';
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    try {
      if (!options.camelCaseTypes) options.camelCaseTypes = s => s;
      if (!options.pluralTypes) options.pluralTypes = s => s;
      if (data === null || Array.isArray(data) && data.length === 0) return {
        data
      };
      if (Array.isArray(data) && (data === null || data === void 0 ? void 0 : data.length) > 0) return serialiseRootArray(type, data, method, options);else return serialiseRootObject(type, data, method, options);
    } catch (E) {
      throw error(E);
    }
  }

  const snake = input => input.charAt(0).toLowerCase() + input.slice(1).replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, match => '_' + match.toLowerCase());

  function splitModel(url) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!options.pluralModel) options.pluralModel = s => s;
    if (!options.resourceCase) options.resourceCase = s => s;
    const urlSegments = url.split('/');
    const resourceModel = urlSegments.pop();
    urlSegments.push(options.pluralModel(options.resourceCase(resourceModel)));
    const newUrl = urlSegments.join('/');
    return [resourceModel, newUrl];
  }

  exports.camel = camel;
  exports.deattribute = deattribute;
  exports.deserialise = deserialise;
  exports.error = error;
  exports.filterIncludes = filterIncludes;
  exports.kebab = kebab;
  exports.linkRelationships = linkRelationships;
  exports.paramKeyName = paramKeyName;
  exports.query = query;
  exports.serialise = serialise;
  exports.snake = snake;
  exports.splitModel = splitModel;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
