'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const { Tags } = require('opentracing')
const Span = require('./Span')
const SpanContext = require('./SpanContext')
const Tracer = require('./Tracer')

describe('tracer/Span', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('#constructor', () => {
    it('should create a Span', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      expect(span._startTime).to.be.lte(0)
    })
  })

  describe('#addTags', () => {
    it('should add a tag', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)
      const tags = {
        [Tags.HTTP_METHOD]: 'GET',
        [Tags.SPAN_KIND_RPC_CLIENT]: true
      }

      span.addTags(tags)

      expect(span._tags).to.be.eql(tags)
    })
  })

  describe('#context', () => {
    it('should get context', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      expect(span.context()).to.be.eql(spanContext)
    })
  })

  describe('#finish', () => {
    it('should calculate duration in milliseconds', function () {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      this.sandbox.spy(tracer, 'reportFinish')

      clock.tick(150)

      span.finish()

      expect(span._duration).to.be.equal(150)
      expect(tracer.reportFinish).to.be.calledWith(span)
    })

    it('should use passed finishTime', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      clock.tick(150)

      span.finish(110)

      expect(span._duration).to.be.equal(110)
    })
  })

  describe('#getBaggageItem', () => {
    it('should get baggage item', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      spanContext.setBaggageItem('key1', 'value1')
      spanContext.setBaggageItem('key2', 'value2')

      expect(span.getBaggageItem('key1')).to.be.equal('value1')
      expect(span.getBaggageItem('key2')).to.be.equal('value2')
    })
  })

  describe('#log', () => {
    it('should log', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      clock.tick(10)
      span.log({ foo: 'bar' })

      clock.tick(10)
      span.log({ so: 'such' })

      expect(span._logs).to.be.eql([
        {
          time: 10,
          data: { foo: 'bar' }
        },
        {
          time: 20,
          data: { so: 'such' }
        }
      ])
    })

    it('should log with timestamp', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      clock.tick(10)
      span.log({ foo: 'bar' }, 5)

      clock.tick(10)
      span.log({ so: 'such' }, 15)

      expect(span._logs).to.be.eql([
        {
          time: 5,
          data: { foo: 'bar' }
        },
        {
          time: 15,
          data: { so: 'such' }
        }
      ])
    })
  })

  describe('#logEvent', () => {
    it('should do nothing as it\'s deprectaed', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      span.logEvent()
    })
  })

  describe('#setBaggageItem', () => {
    it('should set baggage item', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      span.setBaggageItem('key1', 'value1')
      span.setBaggageItem('key2', 'value2')

      expect(span.getBaggageItem('key1')).to.be.equal('value1')
      expect(span.getBaggageItem('key2')).to.be.equal('value2')
    })
  })

  describe('#setOperationName', () => {
    it('should set baggage item', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      expect(span._operationName).to.be.equal('operation')

      span.setOperationName('operation2')

      expect(span._operationName).to.be.equal('operation2')
    })
  })

  describe('#setTag', () => {
    it('should set a tag', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      span.setTag(Tags.HTTP_METHOD, 'GET')
      span.setTag(Tags.SPAN_KIND_RPC_CLIENT, true)

      expect(span._tags).to.be.eql({
        [Tags.HTTP_METHOD]: 'GET',
        [Tags.SPAN_KIND_RPC_CLIENT]: true
      })
    })
  })

  describe('#tracer', () => {
    it('should get tracer', () => {
      const tracer = new Tracer('service-1')
      const spanContext = new SpanContext('service-1')
      const span = new Span(tracer, 'operation', spanContext)

      expect(span.tracer()).to.be.eql(tracer)
    })
  })
})
