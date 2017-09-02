'use strict'

const assert = require('assert')
const SpanContext = require('./SpanContext')

/**
* @class Span
*/
class Span {
  /**
  * @constructor
  * @param {Tracer} tracer
  * @param {String} operationName
  * @param {SpanContext} spanContext
  * @param {Object} tags
  * @param {Number} startTime
  * @param {Array} references - Array of Reference
  * @returns {Span}
  */
  constructor (
    tracer,
    operationName,
    spanContext,
    tags = {},
    startTime = Date.now(),
    references = []
  ) {
    assert(tracer, 'tracer is required')
    assert(spanContext instanceof SpanContext, 'spanContext is required')
    assert(typeof operationName === 'string', 'operationName is required')

    this._tracer = tracer
    this._operationName = operationName
    this._spanContext = spanContext
    this._startTime = startTime
    this._references = references
    this._logs = []
    this._tags = tags
    this._duration = undefined
  }

  /**
  * Adds the given key value pairs to the set of span tags
  * @method addTags
  * @param {Object} keyValueMap - [key: string]: any
  * @returns {Span}
  */
  addTags (keyValueMap) {
    assert(typeof keyValueMap === 'object', 'keyValueMap is required')

    this._tags = Object.assign(this._tags, keyValueMap)

    return this
  }

  /**
  * Returns the SpanContext object associated with this Span
  * @method context
  * @returns {SpanContext}
  */
  context () {
    return this._spanContext
  }

  /**
  * Sets the end timestamp and finalizes Span state
  * @method finishTime
  * @param {Number} [finishTime] - Optional finish time in milliseconds as a Unix timestamp
  */
  finish (finishTime) {
    assert(finishTime === undefined || typeof finishTime === 'number', 'finishTime is required')

    this._duration = (finishTime || Date.now()) - this._startTime
  }

  /**
  * Returns the value for a baggage item given its key
  * @method getBaggageItem
  * @param {String} key - The key for the given trace attribute
  * @returns {String|undefined} value - String value for the given key
  * or undefined if the key does not correspond to a set trace attribute
  */
  getBaggageItem (key) {
    assert(typeof key === 'string', 'key is required')

    return this._spanContext.getBaggageItem(key)
  }

  /**
  * Add a log record to this Span, optionally at a user-provided timestamp
  * @method log
  * @param {Object} keyValuePairs - An object mapping string keys to arbitrary value types
  * @param {Number} [timestamp] -  An optional parameter specifying the timestamp in milliseconds
  * since the Unix epoch
  * @returns {Span}
  */
  log (keyValuePairs, timestamp) {
    assert(typeof keyValuePairs === 'object', 'keyValuePairs is required')
    assert(timestamp === undefined || typeof timestamp === 'number', 'timestamp is required')

    this._logs.push({
      time: timestamp || Date.now(),
      data: keyValuePairs
    })

    return this
  }

  /**
  * @method logEvent
  * @deprecated
  */
  // eslint-disable-next-line
  logEvent () {}

  /**
  * Sets a key:value pair on this Span that also propagates to future children of the associated Span
  * @method setBaggageItem
  * @param {String} key
  * @param {String} value
  * @returns {Span}
  */
  setBaggageItem (key, value) {
    assert(typeof key === 'string', 'key is required')
    assert(typeof value === 'string', 'value is required')

    this._spanContext.setBaggageItem(key, value)
    return this
  }

  /**
  * Sets the string name for the logical operation this span represents
  * @method setOperationName
  * @param {String} operationName
  * @returns {Span}
  */
  setOperationName (operationName) {
    assert(typeof operationName === 'string', 'operationName is required')

    this._operationName = operationName
    return this
  }

  /**
  * Adds a single tag to the span. See addTags() for details
  * @method setTag
  * @param {String} key
  * @param {*} value
  * @returns {Span}
  */
  setTag (key, value) {
    assert(typeof key === 'string', 'key is required')
    assert(value, 'value is required')

    this._tags[key] = value
    return this
  }

  /**
  * Returns the Tracer object used to create this Span
  * @method tracer
  * @returns {Tracer}
  */
  tracer () {
    return this._tracer
  }
}

module.exports = Span
