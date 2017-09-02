'use strict'

const assert = require('assert')
const { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } = require('opentracing')
const Span = require('./Span')
const SpanContext = require('./SpanContext')

/**
* Reference pairs a reference type constant (e.g., REFERENCE_CHILD_OF or REFERENCE_FOLLOWS_FROM)
* with the SpanContext it points to
* @class Reference
*/
class Reference {
  /**
  * @constructor
  * @param {String} type - the Reference type constant (e.g., REFERENCE_CHILD_OF or REFERENCE_FOLLOWS_FROM
  * @param {SpanContext|Span} referencedContext - the SpanContext being referred to.
  *         As a convenience, a Span instance may be passed in instead (in which case its .context() is used here)
  * @returns {Reference}
  */
  constructor (type, referencedContext) {
    assert([REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM].includes(type), 'Invalid type')
    assert(
      referencedContext instanceof Span || referencedContext instanceof SpanContext,
      'referencedContext must have a type Span or SpanContext'
    )

    this._type = type
    this._referencedContext = referencedContext instanceof Span ?
      referencedContext.context() :
      referencedContext
  }

  /**
  * @method referencedContext
  * @return {SpanContext} referencedContext
  */
  referencedContext () {
    return this._referencedContext
  }

  /**
  * @method type
  * @return {String} type
  */
  type () {
    return this._type
  }
}

module.exports = Reference
