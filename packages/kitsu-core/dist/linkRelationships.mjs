import { deattribute } from './deattribute.mjs';
import { filterIncludes } from './filterIncludes.mjs';
import './error.mjs';

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

export { linkRelationships };
