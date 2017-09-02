'use strict'

const { expect } = require('chai')
const { FORMAT_HTTP_HEADERS, FORMAT_BINARY } = require('opentracing')
const Span = require('./Span')
const SpanContext = require('./SpanContext')
const Tracer = require('./Tracer')

describe('tracer/Tracer', () => {
  describe('#constructor', () => {
    it('should create a tracer', () => {
      const tracer = new Tracer('service-key', ['reporter'])

      expect(tracer._serviceKey).to.be.equal('service-key')
      expect(tracer._reporters).to.be.eql(['reporter'])
    })
  })

  describe('#startSpan', () => {
    it('should start a span', () => {
      const tracer = new Tracer('service-key')
      const span = tracer.startSpan('my-operation')

      expect(span).to.be.instanceof(Span)
    })

    it('should start a span with options.childOf', () => {
      const tracer1 = new Tracer('service-1')
      const parentSpanContext = new SpanContext('service-1')
      const parentSpan = new Span(tracer1, 'operation', parentSpanContext)

      const tracer2 = new Tracer('service-2')
      const span = tracer2.startSpan('my-operation', {
        childOf: parentSpan
      })
      const spanContext = span.context()

      expect(spanContext._serviceKey).to.be.equal('service-2')
      expect(spanContext._parentServiceKey).to.be.equal(parentSpanContext._serviceKey)
      expect(spanContext._traceId).to.be.equal(parentSpanContext._traceId)
      expect(spanContext._spanId).to.be.not.equal(parentSpanContext._spanId)
      expect(spanContext._parentSpanId).to.be.equal(parentSpanContext._spanId)
    })

    it('should start a span with options.references and options.childOf', () => {
      const tracer1 = new Tracer('service-1')
      const parentSpanContext = new SpanContext('service-1')
      const parentSpan = new Span(tracer1, 'operation', parentSpanContext)

      const tracer2 = new Tracer('service-2')
      const span = tracer2.startSpan('my-operation', {
        childOf: parentSpan,
        references: []
      })
      const spanContext = span.context()

      expect(spanContext._serviceKey).to.be.equal('service-2')
      expect(spanContext._parentServiceKey).to.be.equal(parentSpanContext._serviceKey)
      expect(spanContext._traceId).to.be.equal(parentSpanContext._traceId)
      expect(spanContext._spanId).to.be.not.equal(parentSpanContext._spanId)
      expect(spanContext._parentSpanId).to.be.equal(parentSpanContext._spanId)
    })
  })

  describe('#inject', () => {
    it('should inject Span', () => {
      const tracer = new Tracer('service-key')
      const span = tracer.startSpan('my-operation')
      const spanContext = span.context()
      const carrier = {}

      tracer.inject(span, FORMAT_HTTP_HEADERS, carrier)

      expect(carrier).to.be.eql({
        [Tracer.CARRIER_KEY_SERVICE_KEYS]: spanContext._serviceKey,
        [Tracer.CARRIER_KEY_TRACE_ID]: spanContext._traceId,
        [Tracer.CARRIER_KEY_SPAN_IDS]: spanContext._spanId
      })
    })

    it('should inject SpanContext', () => {
      const tracer = new Tracer('service-key')
      const span = tracer.startSpan('my-operation')
      const spanContext = span.context()
      const carrier = {}

      tracer.inject(spanContext, FORMAT_HTTP_HEADERS, carrier)

      expect(carrier).to.be.eql({
        [Tracer.CARRIER_KEY_SERVICE_KEYS]: spanContext._serviceKey,
        [Tracer.CARRIER_KEY_TRACE_ID]: spanContext._traceId,
        [Tracer.CARRIER_KEY_SPAN_IDS]: spanContext._spanId
      })
    })

    it('should inject SpanContext with parent', () => {
      const tracer1 = new Tracer('service-1')
      const parentSpanContext = new SpanContext('service-1')
      const parentSpan = new Span(tracer1, 'operation', parentSpanContext)

      const tracer2 = new Tracer('service-2')
      const span = tracer2.startSpan('my-operation', {
        childOf: parentSpan
      })
      const spanContext = span.context()
      const carrier = {}

      tracer2.inject(spanContext, FORMAT_HTTP_HEADERS, carrier)

      expect(carrier).to.be.eql({
        [Tracer.CARRIER_KEY_SERVICE_KEYS]: `${spanContext._serviceKey}:${spanContext._parentServiceKey}`,
        [Tracer.CARRIER_KEY_TRACE_ID]: spanContext._traceId,
        [Tracer.CARRIER_KEY_SPAN_IDS]: `${spanContext._spanId}:${spanContext._parentSpanId}`
      })
    })

    it('should not inject with unsupported format', () => {
      const tracer = new Tracer('service-key')
      const span = tracer.startSpan('my-operation')
      const spanContext = span.context()
      const carrier = {}

      tracer.inject(spanContext, FORMAT_BINARY, carrier)

      expect(carrier).to.be.eql({})
    })
  })

  describe('#extract', () => {
    it('should extract SpanContext', () => {
      const tracer = new Tracer('service-key')
      const span = tracer.startSpan('my-operation')
      const spanContext = span.context()
      const carrier = {}

      tracer.inject(span, FORMAT_HTTP_HEADERS, carrier)
      const spanContextExtracted = tracer.extract(FORMAT_HTTP_HEADERS, carrier)

      expect(spanContextExtracted).to.be.eql(spanContext)
    })

    it('should return null with invalid carrier', () => {
      const tracer = new Tracer('service-key')
      const spanContextExtracted = tracer.extract(FORMAT_HTTP_HEADERS, {})

      expect(spanContextExtracted).to.be.eql(null)
    })

    it('should return null with unsupported format', () => {
      const tracer = new Tracer('service-key')
      const spanContextExtracted = tracer.extract(FORMAT_BINARY, {})

      expect(spanContextExtracted).to.be.eql(null)
    })
  })

  describe('#reportFinish', () => {
    it('should call reporters', function () {
      const reporter1 = {
        reportFinish: this.sandbox.spy()
      }
      const reporter2 = {
        reportFinish: this.sandbox.spy()
      }
      const tracer = new Tracer('service-key', [reporter1, reporter2])
      const span = tracer.startSpan('my-operation')

      tracer.reportFinish(span)

      expect(reporter1.reportFinish).to.be.calledWith(span)
      expect(reporter2.reportFinish).to.be.calledWith(span)
    })
  })
})
