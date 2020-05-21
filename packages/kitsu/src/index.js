import axios from 'axios'
import pluralise from 'pluralize'
import { camel, deserialise, error, kebab, query, serialise, snake, splitModel } from 'kitsu-core'

/**
 * Creates a new `kitsu` instance
 *
 * @param {Object} options Options
 * @param {string} options.baseURL Set the API endpoint (default `https://kitsu.io/api/edge`)
 * @param {Object} options.headers Additional headers to send with the requests
 * @param {boolean} options.camelCaseTypes If true, the `type` value will be camelCased, e.g `library-entries` and `library_entries` become `libraryEntries`  (default `true`)
 * @param {string} options.resourceCase `kebab`, `snake` or `none`. If `kebab`, `/libraryEntries` will become `/library-entries`. If `snake`, `/libraryEntries` will become `/library_entries`, If `none`, `/libraryEntries` will be unchanged (default `kebab`)
 * @param {boolean} options.pluralize If `true`, `/user` will become `/users` in the URL request and `type` will be pluralized in POST, PATCH and DELETE requests (default `true`)
 * @param {number} options.timeout Set the request timeout in milliseconds (default `30000`)
 * @param {Object} options.axiosOptions Additional options for the axios instance (see [axios/axios#request-config](https://github.com/axios/axios#request-config) for details)
 * @example <caption>Using with Kitsu.io's API</caption>
 * const api = new Kitsu()
 * @example <caption>Using another API server</caption>
 * const api = new Kitsu({
 *   baseURL: 'https://api.example.org/2'
 * })
 * @example <caption>Setting headers</caption>
 * const api = new Kitsu({
 *   headers: {
 *     'User-Agent': 'MyApp/1.0.0 (github.com/username/repo)',
 *     Authorization: 'Bearer 1234567890'
 *   }
 * })
 */
export default class Kitsu {
  constructor (options = {}) {
    if (options.camelCaseTypes === false) this.camel = s => s
    else this.camel = camel

    if (options.resourceCase === 'none') this.resCase = s => s
    else if (options.resourceCase === 'snake') this.resCase = snake
    else this.resCase = kebab

    /**
     * If pluralization is enabled (default, see Kitsu constructor docs) then pluralization rules can be added
     *
     * @memberof Kitsu
     * @external plural
     * @see {@link https://www.npmjs.com/package/pluralize} for documentation
     * @see Kitsu constructor options for disabling pluralization
     * @example <caption>Adding an uncountable pluralization rule</caption>
     * api.plural.plural('paper') //=> 'papers'
     * api.plural.addUncountableRule('paper')
     * api.plural.plural('paper') //=> 'paper'
     *
     */
    if (options.pluralize === false) this.plural = s => s
    else this.plural = pluralise

    /**
     * Get the current headers or add additional headers
     *
     * @memberof Kitsu
     * @returns {Object} All the current headers
     * @example <caption>Get all headers</caption>
     * api.headers
     * @example <caption>Get a single header's value</caption>
     * api.headers['User-Agent']
     * @example <caption>Add or update a header's value</caption>
     * api.headers['Authorization'] = 'Bearer 1234567890'
     */
    this.headers = Object.assign({}, options.headers, { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' })

    this.axios = axios.create(
      Object.assign({}, {
        baseURL: options.baseURL || 'https://kitsu.io/api/edge',
        timeout: options.timeout || 30000
      }, options.axiosOptions)
    )

    this.fetch = this.get
    this.update = this.patch
    this.create = this.post
    this.remove = this.delete

    /**
     * Axios Interceptors (alias of `axios.interceptors`)
     *
     * You can intercept responses before they are handled by `get`, `post`, `patch` and `delete` and before requests are sent to the API server. See [axios/axios#interceptors](https://github.com/axios/axios#interceptors) for details.
     *
     * @memberof Kitsu
     * @example <caption>Request Interceptor</caption>
     * // Add a request interceptor
     * api.interceptors.request.use(config => {
     *    // Do something before request is sent
     *    return config
     * }, error => {
     *    // Do something with the request error
     *    return Promise.reject(error)
     * })
     * @example <caption>Response Interceptor</caption>
     * // Add a response interceptor
     * api.interceptors.response.use(response => {
     *    // Any status code that lie within the range of 2xx cause this function to trigger
     *    // Do something with response data
     *    return response
     * }, error => {
     *    // Any status codes that falls outside the range of 2xx cause this function to trigger
     *    // Do something with response error
     *    return Promise.reject(error)
     * })
     * @example <caption>Removing Interceptors</caption>
     * const myInterceptor = api.interceptors.request.use(function () {...})
     * api.interceptors.request.eject(myInterceptor)
     */
    this.interceptors = this.axios.interceptors
  }

  /**
   * Fetch resources (alias `fetch`)
   *
   * @memberof Kitsu
   * @param {string} model Model to fetch data from
   * @param {Object} params JSON-API request queries
   * @param {Object} params.page [JSON:API Pagination](http://jsonapi.org/format/#fetching-pagination)
   * @param {number} params.page.limit Number of resources to return in request (Max `20` for Kitsu.io except on `libraryEntries` which has a max of `500`)
   * @param {number} params.page.offset Number of resources to offset the dataset by
   * @param {Object} params.fields Return a sparse fieldset with only the included attributes/relationships - [JSON:API Sparse Fieldsets](http://jsonapi.org/format/#fetching-sparse-fieldsets)
   * @param {Object} params.filter Filter dataset by attribute values - [JSON:API Filtering](http://jsonapi.org/format/#fetching-filtering)
   * @param {string} params.sort Sort dataset by one or more comma separated attributes (prepend `-` for descending order) - [JSON:API Sorting](http://jsonapi.org/format/#fetching-sorting)
   * @param {string} params.include Include relationship data - [JSON:API Includes](http://jsonapi.org/format/#fetching-includes)
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Getting a resource with JSON:API parameters</caption>
   * api.get('users', {
   *   fields: {
   *     users: 'name,birthday'
   *   },
   *   filter: {
   *     name: 'wopian'
   *   }
   * })
   * @example <caption>Getting a collection of resources with their relationships</caption>
   * api.get('anime', {
   *   include: 'categories'
   * })
   * @example <caption>Getting a single resource by ID (method one)</caption>
   * api.get('anime/2', {
   *   include: 'categories'
   * })
   * @example <caption>Getting a single resource by ID (method two)</caption>
   * api.get('anime', {
   *   include: 'categories',
   *   filter: { id: '2' }
   * })
   * @example <caption>Getting a resource's relationship data only</caption>
   * api.get('anime/2/categories')
   * @example <caption>Handling errors (async/await)</caption>
   * try {
   *   const { data } = await api.get('anime')
   * } catch (err) {
   *   // Array of JSON:API errors: http://jsonapi.org/format/#error-objects
   *   if (err.errors) err.errors.forEach(error => { ... })
   *   // Error type (Error, TypeError etc.)
   *   err.name
   *   // Error message
   *   err.message
   *   // Axios request parameters
   *   err.config
   *   // Axios response parameters
   *   err.response
   * }
   * @example <caption>Handling errors (Promises)</caption>
   * api.get('anime')
   *   .then(({ data }) => { ... })
   *   .catch(err => {
   *     // Array of JSON:API errors: http://jsonapi.org/format/#error-objects
   *     if (err.errors) err.errors.forEach(error => { ... })
   *     // Error type (Error, TypeError etc.)
   *     err.name
   *     // Error message
   *     err.message
   *     // Axios request parameters
   *     err.config
   *     // Axios response parameters
   *     err.response
   *   })
   */
  async get (model, params = {}, headers = {}) {
    try {
      const [ res, id, relationship ] = model.split('/')

      let url = this.plural(this.resCase(res))
      if (id) url += `/${id}`
      if (relationship) url += `/${this.resCase(relationship)}`

      const { data } = await this.axios.get(url, {
        params,
        /* istanbul ignore next */
        paramsSerializer: p => query(p),
        headers: Object.assign(this.headers, headers)
      })

      return deserialise(data)
    } catch (E) {
      throw error(E)
    }
  }

  /**
   * Update a resource (alias `update`)
   *
   * @memberof Kitsu
   * @param {string} model Model to update data in
   * @param {Object} body Data to send in the request
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Update a post</caption>
   * api.update('posts', {
   *   id: '1',
   *   content: 'Goodbye World'
   * })
   * @example <caption>Update multiple resources (API must support the Bulk Extension)</caption>
   * api.update('posts', [
   *   { id: '1', content: 'Hello World' },
   *   { id: '2', content: 'Another post' }
   * ])
   */
  async patch (model, body, headers = {}) {
    try {
      const [ resourceModel, url ] = splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      })
      const serialData = serialise(resourceModel, body, 'PATCH', {
        camelCaseTypes: this.camel,
        pluralTypes: this.plural
      })
      const { data } = await this.axios.patch(
        `${url}/${body.id}`,
        serialData,
        { headers: Object.assign(this.headers, headers) }
      )

      return deserialise(data)
    } catch (E) {
      throw error(E)
    }
  }

  /**
   * Create a new resource (alias `create`)
   *
   * @memberof Kitsu
   * @param {string} model Model to create a resource under
   * @param {Object} body Data to send in the request
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Create a post on a user's profile feed</caption>
   * api.create('posts', {
   *   content: 'Hello World',
   *   targetUser: {
   *     id: '42603',
   *     type: 'users'
   *   },
   *   user: {
   *     id: '42603',
   *     type: 'users'
   *   }
   * })
   * @example <caption>Create multiple resources (API must support the Bulk Extension)</caption>
   * api.create('posts', [
   *   { content: 'Hello World' },
   *   { content: 'Another post' }
   * ])
   */
  async post (model, body, headers = {}) {
    try {
      const [ resourceModel, url ] = splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      })
      const { data } = await this.axios.post(
        url,
        serialise(resourceModel, body, 'POST', {
          camelCaseTypes: this.camel,
          pluralTypes: this.plural
        }),
        { headers: Object.assign(this.headers, headers) }
      )

      return deserialise(data)
    } catch (E) {
      throw error(E)
    }
  }

  /**
   * Remove a resource (alias `remove`)
   *
   * @memberof Kitsu
   * @param {string} model Model to remove data from
   * @param {string|number|Array} id Resource ID to remove. Pass an array of IDs to delete multiple resources (Bulk Extension)
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Remove a single resource</caption>
   * api.delete('posts', 123)
   * @example <caption>Remove multiple resources (API must support the Bulk Extension)</caption>
   * api.delete('posts', [ 1, 2 ])
   */
  async delete (model, id, headers = {}) {
    try {
      const [ resourceModel, url ] = splitModel(model, {
        resourceCase: this.resCase,
        pluralModel: this.plural
      })
      const isBulk = Array.isArray(id)
      let path, payload

      if (isBulk) {
        path = url
        payload = id.map(id => ({ id }))
      } else {
        path = `${url}/${id}`
        payload = { id }
      }

      const { data } = await this.axios.delete(path, {
        data: serialise(resourceModel, payload, 'DELETE', {
          camelCaseTypes: this.camel,
          pluralTypes: this.plural
        }),
        headers: Object.assign(this.headers, headers)
      })

      return data
    } catch (E) {
      throw error(E)
    }
  }

  /**
   * Get the authenticated user's data
   *
   * **Note** Requires the JSON:API server to support `filter[self]=true`
   *
   * @memberof Kitsu
   * @param {Object} params JSON-API request queries
   * @param {Object} params.fields Return a sparse fieldset with only the included attributes/relationships - [JSON:API Sparse Fieldsets](http://jsonapi.org/format/#fetching-sparse-fieldsets)
   * @param {string} params.include Include relationship data - [JSON:API Includes](http://jsonapi.org/format/#fetching-includes)
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Get the authenticated user's resource</caption>
   * api.self()
   * @example <caption>Using JSON:API parameters</caption>
   * api.self({
   *   fields: {
   *     users: 'name,birthday'
   *   }
   * })
   */
  async self (params = {}, headers = {}) {
    try {
      const res = await this.get('users', Object.assign({ filter: { self: true } }, params), headers)
      return res.data[0]
    } catch (E) {
      throw error(E)
    }
  }

  /**
   * Send arbitrary requests
   *
   * **Note** Planned changes to the `get`, `patch`, `post` and `delete` methods in a future major release may make this method redundent. See https://github.com/wopian/kitsu/issues/415 for details.
   *
   * @memberof Kitsu
   * @param {Object} config Request configuration
   * @param {Object|Array} config.body Data to send in the request
   * @param {string} config.method Request method - `GET`, `PATCH`, `POST` or `DELETE` (defaults to `GET`, case-insensitive)
   * @param {Object} config.params JSON-API request queries
   * @param {Object} config.params.page [JSON:API Pagination](http://jsonapi.org/format/#fetching-pagination)
   * @param {number} config.params.page.limit Number of resources to return in request (Max `20` for Kitsu.io except on `libraryEntries` which has a max of `500`)
   * @param {number} config.params.page.offset Number of resources to offset the dataset by
   * @param {Object} config.params.fields Return a sparse fieldset with only the included attributes/relationships - [JSON:API Sparse Fieldsets](http://jsonapi.org/format/#fetching-sparse-fieldsets)
   * @param {Object} config.params.filter Filter dataset by attribute values - [JSON:API Filtering](http://jsonapi.org/format/#fetching-filtering)
   * @param {string} config.params.sort Sort dataset by one or more comma separated attributes (prepend `-` for descending order) - [JSON:API Sorting](http://jsonapi.org/format/#fetching-sorting)
   * @param {string} config.params.include Include relationship data - [JSON:API Includes](http://jsonapi.org/format/#fetching-includes)
   * @param {string} config.type The resource type
   * @param {string} config.url The URL path of the resource
   * @param {Object} headers Additional headers to send with the request
   * @returns {Object} JSON-parsed response
   * @example <caption>Raw GET request</caption>
   * api.request({
   *   url: 'anime/1/mappings',
   *   type: 'mappings',
   *   params: { filter: { externalSite: 'aozora' } }
   * })
   * @example <caption>Raw PATCH request</caption>
   * api.request({
   *   method: 'PATCH',
   *   url: 'anime',
   *   type: 'anime',
   *   body: { id: '1', subtype: 'tv' }
   * })
   * @example <caption>Raw POST request</caption>
   * api.request({
   *   method: 'PATCH',
   *   url: 'anime',
   *   type: 'anime',
   *   body: { subtype: 'tv' }
   * })
   * @example <caption>Raw DELETE request</caption>
   * api.request({
   *   method: 'DELETE',
   *   url: 'anime/1',
   *   type: 'anime',
   *   body: { id: '1' }
   * })
   * @example <caption>Bulk Extension support (`PATCH`, `POST` & `DELETE`)</caption>
   * api.request({
   *   method: 'PATCH',
   *   url: 'anime',
   *   type: 'anime',
   *   body: [
   *     { id: '1', subtype: 'tv' }
   *     { id: '2', subtype: 'ona' }
   *   ]
   * })
   */
  async request ({ body, method, params, type, url }, headers = {}) {
    try {
      method = method?.toUpperCase() || 'GET'
      const { data } = await this.axios.request({
        method,
        url,
        data: [ 'GET', 'DELETE' ].includes(method) ? undefined : serialise(type, body, method, {
          camelCaseTypes: this.camel,
          pluralTypes: this.plural
        }),
        params,
        /* istanbul ignore next */
        paramsSerializer: p => query(p),
        headers: Object.assign(this.headers, headers)
      })

      return deserialise(data)
    } catch (E) {
      throw error(E)
    }
  }
}
