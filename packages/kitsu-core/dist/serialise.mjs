import { error } from './error.mjs';

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

export { serialise };
