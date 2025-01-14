'use strict';

var kitsuCore = require('kitsu-core');
var axios = require('axios');
var pluralise = require('pluralize');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var pluralise__default = /*#__PURE__*/_interopDefaultLegacy(pluralise);

class Kitsu {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const traditional = typeof options.query === 'string' ? options.query === 'traditional' : true;
    this.query = typeof options.query === 'function' ? options.query : obj => kitsuCore.query(obj, null, traditional);
    if (options.camelCaseTypes === false) this.camel = s => s;else this.camel = kitsuCore.camel;
    if (options.resourceCase === 'none') this.resCase = s => s;else if (options.resourceCase === 'snake') this.resCase = kitsuCore.snake;else this.resCase = kitsuCore.kebab;
    if (options.pluralize === false) this.plural = s => s;else this.plural = pluralise__default["default"];
    this.headers = {
      ...{
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      ...options.headers
    };
    this.axios = axios__default["default"].create({
      ...{
        baseURL: options.baseURL || 'https://kitsu.io/api/edge',
        timeout: options.timeout || 30000
      },
      ...options.axiosOptions
    });
    this.fetch = this.get;
    this.update = this.patch;
    this.create = this.post;
    this.remove = this.delete;
    this.interceptors = this.axios.interceptors;
  }
  async get(model) {
    let config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    try {
      const headers = {
        ...this.headers,
        ...config.headers
      };
      const params = {
        ...{},
        ...config.params
      };
      const [res, id, relationship, subRelationship] = model.split('/');
      let url = this.plural(this.resCase(res));
      if (id) url += `/${this.resCase(id)}`;
      if (relationship) url += `/${this.resCase(relationship)}`;
      if (subRelationship) url += `/${this.resCase(subRelationship)}`;
      const {
        data,
        headers: responseHeaders
      } = await this.axios.get(url, {
        headers,
        params,
        paramsSerializer: p => this.query(p),
        ...config.axiosOptions
      });
      return responseHeaders ? {
        ...kitsuCore.deserialise(data),
        ...{
          headers: responseHeaders
        }
      } : kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
  async patch(model, body) {
    let config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    try {
      const headers = {
        ...this.headers,
        ...config.headers
      };
      const params = {
        ...{},
        ...config.params
      };
      const [resourceModel, url] = kitsuCore.splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      });
      const serialData = kitsuCore.serialise(resourceModel, body, 'PATCH', {
        camelCaseTypes: this.camel,
        pluralTypes: this.plural
      });
      const fullURL = body !== null && body !== void 0 && body.id ? `${url}/${body.id}` : url;
      const {
        data,
        headers: responseHeaders
      } = await this.axios.patch(fullURL, serialData, {
        headers,
        params,
        paramsSerializer: p => this.query(p),
        ...config.axiosOptions
      });
      return responseHeaders ? {
        ...kitsuCore.deserialise(data),
        ...{
          headers: responseHeaders
        }
      } : kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
  async post(model, body) {
    let config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    try {
      const headers = {
        ...this.headers,
        ...config.headers
      };
      const params = {
        ...{},
        ...config.params
      };
      const [resourceModel, url] = kitsuCore.splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      });
      const {
        data,
        headers: responseHeaders
      } = await this.axios.post(url, kitsuCore.serialise(resourceModel, body, 'POST', {
        camelCaseTypes: this.camel,
        pluralTypes: this.plural
      }), {
        headers,
        params,
        paramsSerializer: p => this.query(p),
        ...config.axiosOptions
      });
      return responseHeaders ? {
        ...kitsuCore.deserialise(data),
        ...{
          headers: responseHeaders
        }
      } : kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
  async delete(model, id) {
    let config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    try {
      const headers = {
        ...this.headers,
        ...config.headers
      };
      const params = {
        ...{},
        ...config.params
      };
      const [resourceModel, url] = kitsuCore.splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      });
      const isBulk = Array.isArray(id);
      let path, payload;
      if (isBulk) {
        path = url;
        payload = id.map(id => ({
          id
        }));
      } else {
        path = `${url}/${id}`;
        payload = {
          id
        };
      }
      const {
        data,
        headers: responseHeaders
      } = await this.axios.delete(path, {
        data: kitsuCore.serialise(resourceModel, payload, 'DELETE', {
          camelCaseTypes: this.camel,
          pluralTypes: this.plural
        }),
        headers,
        params,
        paramsSerializer: p => this.query(p),
        ...config.axiosOptions
      });
      return responseHeaders ? {
        ...kitsuCore.deserialise(data),
        ...{
          headers: responseHeaders
        }
      } : kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
  async self() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    try {
      const headers = {
        ...this.headers,
        ...config.headers
      };
      const params = {
        ...config.params,
        ...{
          filter: {
            self: true
          }
        }
      };
      const res = await this.get('users', {
        ...{
          headers
        },
        ...{
          params
        },
        ...config.axiosOptions
      });
      return res.headers ? {
        ...{
          data: res.data[0]
        },
        ...{
          headers: res.headers
        }
      } : {
        data: res.data[0]
      };
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
  async request(_ref) {
    let {
      body,
      method,
      params,
      type,
      url,
      headers,
      axiosOptions
    } = _ref;
    try {
      var _method;
      method = ((_method = method) === null || _method === void 0 ? void 0 : _method.toUpperCase()) || 'GET';
      const {
        data,
        headers: responseHeaders
      } = await this.axios.request({
        method,
        url,
        data: ['GET', 'DELETE'].includes(method) ? undefined : kitsuCore.serialise(type, body, method, {
          camelCaseTypes: this.camel,
          pluralTypes: this.plural
        }),
        headers: {
          ...this.headers,
          ...headers
        },
        params,
        paramsSerializer: p => this.query(p),
        ...axiosOptions
      });
      return responseHeaders ? {
        ...kitsuCore.deserialise(data),
        ...{
          headers: responseHeaders
        }
      } : kitsuCore.deserialise(data);
    } catch (E) {
      throw kitsuCore.error(E);
    }
  }
}

module.exports = Kitsu;
