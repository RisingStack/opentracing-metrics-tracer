'use strict'

const assert = require('assert')
const { FORMAT_BINARY, FORMAT_TEXT_MAP, FORMAT_HTTP_HEADERS, REFERENCE_CHILD_OF } = require('opentracing')
const Span = require('./Span')
const SpanContext = require('./SpanContext')
const Reference = require('./Reference')

const CARRIER_KEY_SERVICE_KEYS = 'metrics-tracer-service-key'
const CARRIER_KEY_TRACE_ID = 'metrics-tracer-trace-id'
const CARRIER_KEY_SPAN_IDS = 'metrics-tracer-span-id'

/**
* Tracer is the entry-point between the instrumentation API and the tracing implementation
* @class Tracer
*/
class Tracer {
  /**
  * @method extract
  * @param {String} operationName - the name of the operation
  * @param {Object} options
  * @param {SpanContext} [options.childOf] - a parent SpanContext (or Span,
  *        for convenience) that the newly-started span will be the child of
  *        (per REFERENCE_CHILD_OF). If specified, `fields.references` must
  *        be unspecified.
  * @param {array} [options.references] - an array of Reference instances,
  *        each pointing to a causal parent SpanContext. If specified,
  *        `fields.childOf` must be unspecified.
  * @param {object} [options.tags] - set of key-value pairs which will be set
  *        as tags on the newly created Span. Ownership of the object is
  *        passed to the created span for efficiency reasons (the caller
  *        should not modify this object after calling startSpan).
  * @param {number} [options.startTime] - a manually specified start time for
  *        the created Span object. The time should be specified in
  *        milliseconds as Unix timestamp. Decimal value are supported
  *        to represent time values with sub-millisecond accuracy.
  * @returns {Span} span - a new Span object
  */
  startSpan (operationName, options = {}) {
    assert(typeof operationName === 'string', 'operationName is required')

    let spanContext

    // Handle options.childOf
    if (options.childOf) {
      const childOf = new Reference(REFERENCE_CHILD_OF, options.childOf)

      if (options.references) {
        options.references.push(childOf)
      } else {
        options.references = [childOf]
      }

      const parentSpanContext = childOf.referencedContext()
      const serviceKey = this._serviceKey
      const parentServiceKey = parentSpanContext._serviceKey
      const traceId = parentSpanContext._traceId
      const spanId = undefined
      const parentSpanId = parentSpanContext._spanId

      spanContext = new SpanContext(
        serviceKey,
        parentServiceKey,
        traceId,
        spanId,
        parentSpanId
      )
    }

    spanContext = spanContext || new SpanContext(this._serviceKey)

    return new Span(
      this,
      operationName,
      spanContext,
      options.tags,
      options.startTime,
      options.references
    )
  }

  /**
  * @method extract
  * @param {String} format - the format of the carrier
  * @param {*} carrier - the type of the carrier object is determined by the format
  * @returns {SpanContext|null} - The extracted SpanContext, or null if no such SpanContext could
  *           be found in carrier
  */
  // eslint-disable-next-line class-methods-use-this
  extract (format, carrier) {
    assert(format, [FORMAT_BINARY, FORMAT_TEXT_MAP, FORMAT_HTTP_HEADERS].includes(format), 'Invalid type')
    assert(typeof carrier === 'object', 'carrier is required')

    if (format === FORMAT_BINARY) {
      // TODO: log
    } else {
      const tmpServiceKeys = (carrier[Tracer.CARRIER_KEY_SERVICE_KEYS] || '').split(':')
      const tmpSpanKeys = (carrier[Tracer.CARRIER_KEY_SPAN_IDS] || '').split(':')

      const serviceKey = tmpServiceKeys.shift()
      const parentServiceKey = tmpServiceKeys.shift() || undefined
      const traceId = carrier[Tracer.CARRIER_KEY_TRACE_ID]
      const spanId = tmpSpanKeys.shift()
      const parentSpanId = tmpSpanKeys.shift() || undefined

      if (!serviceKey || !traceId || !spanId) {
        return null
      }

      return new SpanContext(
        serviceKey,
        parentServiceKey,
        traceId,
        spanId,
        parentSpanId
      )
    }

    return null
  }

  /**
  * @method inject
  * @param {SpanContext|Span} spanContext - he SpanContext to inject into the carrier object.
  *         As a convenience, a Span instance may be passed in instead
  *         (in which case its .context() is used for the inject())
  * @param {String} format - the format of the carrier
  * @param {*} carrier - the type of the carrier object is determined by the format
  */
  // eslint-disable-next-line class-methods-use-this
  inject (spanContext, format, carrier) {
    assert(spanContext, 'spanContext is required')
    assert(format, [FORMAT_BINARY, FORMAT_TEXT_MAP, FORMAT_HTTP_HEADERS].includes(format), 'Invalid type')
    assert(typeof carrier === 'object', 'carrier is required')

    const injectedContext = spanContext instanceof Span ?
      spanContext.context() : spanContext

    if (format === FORMAT_BINARY) {
      // TODO: log not implemented
    } else {
      let serviceKeysStr = injectedContext._serviceKey
      if (injectedContext._parentServiceKey) {
        serviceKeysStr += `:${injectedContext._parentServiceKey}`
      }

      let spanIdsStr = injectedContext._spanId
      if (injectedContext._parentSpanId) {
        spanIdsStr += `:${injectedContext._parentSpanId}`
      }

      carrier[Tracer.CARRIER_KEY_SERVICE_KEYS] = serviceKeysStr
      carrier[Tracer.CARRIER_KEY_TRACE_ID] = injectedContext._traceId
      carrier[Tracer.CARRIER_KEY_SPAN_IDS] = spanIdsStr
    }
  }

  /**
  * @constructor
  * @returns {Tracer}
  */
  constructor (serviceKey) {
    this._serviceKey = serviceKey
  }
}

Tracer.CARRIER_KEY_SERVICE_KEYS = CARRIER_KEY_SERVICE_KEYS
Tracer.CARRIER_KEY_TRACE_ID = CARRIER_KEY_TRACE_ID
Tracer.CARRIER_KEY_SPAN_IDS = CARRIER_KEY_SPAN_IDS

module.exports = Tracer
