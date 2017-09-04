'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const dedent = require('dedent')
const { Tags } = require('opentracing')
const { Tracer } = require('../tracer')
const PrometheusReporter = require('./PrometheusReporter')

describe('reporter/PrometheusReporter', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('#constructor', () => {
    it('should create a PrometheusReporter', () => {
      const prometheusReporter = new PrometheusReporter()

      expect(prometheusReporter).to.have.property('_registry')
    })
  })

  describe('#reportFinish', () => {
    it('should observe operation metrics without parent', function () {
      // init
      const prometheusReporter = new PrometheusReporter()
      const metricsOperationDurationSeconds = prometheusReporter._metricsOperationDurationSeconds()

      const metricsStub = {
        observe: this.sandbox.spy()
      }

      this.sandbox.stub(metricsOperationDurationSeconds, 'labels').callsFake(() => metricsStub)

      // generate data
      const tracer = new Tracer('service')

      const span = tracer.startSpan('my-operation')
      clock.tick(100)
      span.finish()

      prometheusReporter.reportFinish(span)

      // assert
      expect(metricsOperationDurationSeconds.labels).to.have.callCount(1)
      expect(metricsOperationDurationSeconds.labels).to.be.calledWith('')

      expect(metricsStub.observe).to.have.callCount(1)
      expect(metricsStub.observe).to.be.calledWith(0.1)
    })

    it('should observe operation metrics with parent', function () {
      // init
      const prometheusReporter = new PrometheusReporter()
      const metricsOperationDurationSeconds = prometheusReporter._metricsOperationDurationSeconds()

      const metricsStub = {
        observe: this.sandbox.spy()
      }

      this.sandbox.stub(metricsOperationDurationSeconds, 'labels').callsFake(() => metricsStub)

      // generate data
      const parentTracer = new Tracer('parent-service')
      const tracer = new Tracer('service')

      const parentSpan1 = parentTracer.startSpan('parent-operation')
      const span1 = tracer.startSpan('my-operation', { childOf: parentSpan1 })
      clock.tick(100)
      span1.finish()

      const parentSpan2 = parentTracer.startSpan('parent-operation')
      const span2 = tracer.startSpan('my-operation', { childOf: parentSpan2 })
      clock.tick(300)
      span2.finish()

      prometheusReporter.reportFinish(span1)
      prometheusReporter.reportFinish(span2)

      // assert
      expect(metricsOperationDurationSeconds.labels).to.have.callCount(2)
      expect(metricsOperationDurationSeconds.labels).to.be.calledWith('parent-service')

      expect(metricsStub.observe).to.have.callCount(2)
      expect(metricsStub.observe).to.be.calledWith(0.1)
      expect(metricsStub.observe).to.be.calledWith(0.3)
    })

    it('should observe HTTP request metrics without parent', function () {
      // init
      const prometheusReporter = new PrometheusReporter()
      const httpRequestDurationSeconds = prometheusReporter._metricshttpRequestDurationSeconds()

      const metricsStub = {
        observe: this.sandbox.spy()
      }

      this.sandbox.stub(httpRequestDurationSeconds, 'labels').callsFake(() => metricsStub)

      // generate data
      const tracer = new Tracer('service')

      const span = tracer.startSpan('http_request')
      span.setTag(Tags.HTTP_METHOD, 'GET')
      span.setTag(Tags.HTTP_STATUS_CODE, 200)
      clock.tick(100)
      span.finish()

      prometheusReporter.reportFinish(span)

      // assert
      expect(httpRequestDurationSeconds.labels).to.have.callCount(1)
      expect(httpRequestDurationSeconds.labels).to.be.calledWith('', 'GET', 200)

      expect(metricsStub.observe).to.have.callCount(1)
      expect(metricsStub.observe).to.be.calledWith(0.1)
    })

    it('should observe HTTP request metrics with parent', function () {
      // init
      const prometheusReporter = new PrometheusReporter()
      const httpRequestDurationSeconds = prometheusReporter._metricshttpRequestDurationSeconds()

      const metricsStub = {
        observe: this.sandbox.spy()
      }

      this.sandbox.stub(httpRequestDurationSeconds, 'labels').callsFake(() => metricsStub)

      // generate data
      const parentTracer = new Tracer('parent-service')
      const tracer = new Tracer('service')

      const parentSpan1 = parentTracer.startSpan('parent-operation')
      const span1 = tracer.startSpan('http_request', { childOf: parentSpan1 })
      span1.setTag(Tags.HTTP_METHOD, 'GET')
      span1.setTag(Tags.HTTP_STATUS_CODE, 200)
      clock.tick(100)
      span1.finish()

      const parentSpan2 = parentTracer.startSpan('parent-operation')
      const span2 = tracer.startSpan('http_request', { childOf: parentSpan2 })
      span2.setTag(Tags.HTTP_METHOD, 'POST')
      span2.setTag(Tags.HTTP_STATUS_CODE, 201)
      clock.tick(300)
      span2.finish()

      prometheusReporter.reportFinish(span1)
      prometheusReporter.reportFinish(span2)

      // assert
      expect(httpRequestDurationSeconds.labels).to.have.callCount(2)
      expect(httpRequestDurationSeconds.labels).to.be.calledWith('parent-service', 'POST', 201)

      expect(metricsStub.observe).to.have.callCount(2)
      expect(metricsStub.observe).to.be.calledWith(0.1)
      expect(metricsStub.observe).to.be.calledWith(0.3)
    })
  })

  describe('#metrics', () => {
    it('should have operation metrics initialized', () => {
      const reporter = new PrometheusReporter()

      expect(reporter.metrics()).to.be.equal(dedent`
        # HELP operation_duration_seconds Duration of operations in second
        # TYPE operation_duration_seconds histogram\n
      `)
    })
  })
})
