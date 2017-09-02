'use strict'

const assert = require('assert')
const uuidV1 = require('uuid/v1')
const uuidV4 = require('uuid/v4')

/**
* @class SpanContext
*/
class SpanContext {
  /**
  * @constructor
  * @param {String} serviceKey
  * @param {String} [parentServiceKey]
  * @param {String} [traceId]
  * @param {String} [spanId]
  * @param {String} [parentSpanId]
  * @returns {SpanContext}
  */
  constructor (
    serviceKey,
    parentServiceKey,
    traceId = `${uuidV1()}-${uuidV4()}`,
    spanId = uuidV4(),
    parentSpanId
  ) {
    assert(typeof serviceKey === 'string', 'serviceKey is required')

    this._serviceKey = serviceKey
    this._parentServiceKey = parentServiceKey
    this._traceId = traceId
    this._spanId = spanId
    this._parentSpanId = parentSpanId
    this._baggage = {}
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

    return this._baggage[key]
  }

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

    this._baggage[key] = value
    return this
  }
}

module.exports = SpanContext
