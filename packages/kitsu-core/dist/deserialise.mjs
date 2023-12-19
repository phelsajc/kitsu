import { deattribute } from './deattribute.mjs';
import { linkRelationships } from './linkRelationships.mjs';
import './filterIncludes.mjs';
import './error.mjs';

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

export { deserialise };