import { error } from './error.mjs';

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

export { filterIncludes };
