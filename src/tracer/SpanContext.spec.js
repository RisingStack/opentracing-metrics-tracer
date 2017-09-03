'use strict'

const { expect } = require('chai')
const SpanContext = require('./SpanContext')

describe('tracer/SpanContext', () => {
  describe('#constructor', () => {
    it('should create spanContext with parameters', () => {
      const spanContext = new SpanContext('service-2', 'service-1', 'trace-id', 'span-id', 'parent-span-id')

      expect(spanContext._serviceKey).to.be.equal('service-2')
      expect(spanContext._parentServiceKey).to.be.equal('service-1')
      expect(spanContext._traceId).to.be.equal('trace-id')
      expect(spanContext._spanId).to.be.equal('span-id')
      expect(spanContext._parentSpanId).to.be.equal('parent-span-id')
    })

    it('should generate traceId and spanId', () => {
      const spanContext = new SpanContext('service-2', 'service-1')

      expect(spanContext._traceId.length).to.be.equal(73)
      expect(spanContext._spanId.length).to.be.equal(36)
    })
  })

  describe('#setBaggageItem', () => {
    it('should set baggage item', () => {
      const spanContext = new SpanContext('service-1')
      spanContext.setBaggageItem('key1', 'value1')
      spanContext.setBaggageItem('key2', 'value2')

      expect(spanContext._baggage).to.be.eql({
        key1: 'value1',
        key2: 'value2'
      })
    })
  })

  describe('#getBaggageItem', () => {
    it('should get baggage item', () => {
      const spanContext = new SpanContext('service-1')
      spanContext.setBaggageItem('key1', 'value1')
      spanContext.setBaggageItem('key2', 'value2')

      expect(spanContext.getBaggageItem('key1')).to.be.equal('value1')
      expect(spanContext.getBaggageItem('key2')).to.be.equal('value2')
    })
  })

  describe('#parentServiceKey', () => {
    it('should return with the parentServiceKey', () => {
      const spanContext = new SpanContext('service-2', 'service-1', 'trace-id', 'span-id', 'parent-span-id')
      expect(spanContext.parentServiceKey()).to.be.equal('service-1')
    })
  })
})
