'use strict'

const { expect } = require('chai')
const { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } = require('opentracing')
const Reference = require('./Reference')
const Span = require('./Span')
const SpanContext = require('./SpanContext')
const Tracer = require('./Tracer')

describe('tracer/Reference', () => {
  describe('#constructor', () => {
    it('should create Reference with SpanContext', () => {
      const spanContext = new SpanContext('service-1')
      const reference = new Reference(REFERENCE_CHILD_OF, spanContext)

      expect(reference._referencedContext).to.be.eql(spanContext)
    })

    it('should create Reference with Span', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)
      const reference = new Reference(REFERENCE_CHILD_OF, span)

      expect(reference._referencedContext).to.be.eql(spanContext)
    })

    it('should create Reference with type REFERENCE_CHILD_OF', () => {
      const spanContext = new SpanContext('service-1')
      const reference = new Reference(REFERENCE_CHILD_OF, spanContext)

      expect(reference._type).to.be.equal(REFERENCE_CHILD_OF)
    })

    it('should create Reference with type REFERENCE_FOLLOWS_FROM', () => {
      const spanContext = new SpanContext('service-1')
      const reference = new Reference(REFERENCE_FOLLOWS_FROM, spanContext)

      expect(reference._type).to.be.equal(REFERENCE_FOLLOWS_FROM)
    })

    it('should reject with invalid type', () => {
      const spanContext = new SpanContext('service-1')

      expect(() => {
        // eslint-disable-next-line
        new Reference('invalid', spanContext)
      }).to.throw('Invalid type')
    })
  })

  describe('#referencedContext', () => {
    it('should get referencedContext', () => {
      const spanContext = new SpanContext('service-1')
      const reference = new Reference(REFERENCE_CHILD_OF, spanContext)

      expect(reference.referencedContext()).to.be.equal(spanContext)
    })
  })

  describe('#type', () => {
    it('should get type', () => {
      const spanContext = new SpanContext('service-1')
      const reference = new Reference(REFERENCE_CHILD_OF, spanContext)

      expect(reference.type()).to.be.equal(REFERENCE_CHILD_OF)
    })
  })
})
