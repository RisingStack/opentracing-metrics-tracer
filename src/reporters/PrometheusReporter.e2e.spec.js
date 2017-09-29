'use strict'

const sinon = require('sinon')
const dedent = require('dedent')
const { expect } = require('chai')
const { Tags } = require('opentracing')
const { Tracer } = require('../tracer')
const PrometheusReporter = require('./PrometheusReporter')

describe('e2e: PrometheusReporter', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('operation metrics', () => {
    it('should have operation metrics initialized', () => {
      const reporter = new PrometheusReporter()

      expect(reporter.metrics()).to.be.equal(dedent`
        # HELP operation_duration_seconds Duration of operations in second
        # TYPE operation_duration_seconds histogram\n
      `)
    })

    it('should have operation metrics', () => {
      const reporter = new PrometheusReporter()
      const tracer = new Tracer('my-service', [reporter])

      const span1 = tracer.startSpan('my-operation')
      clock.tick(100)
      span1.finish()

      const span2 = tracer.startSpan('my-operation')
      clock.tick(300)
      span2.finish()

      const labelStr = `parent_service="${PrometheusReporter.LABEL_PARENT_SERVICE_UNKNOWN}",name="my-operation"`

      expect(reporter.metrics()).to.be.equal(dedent`
        # HELP operation_duration_seconds Duration of operations in second
        # TYPE operation_duration_seconds histogram
        operation_duration_seconds_bucket{le="0.005",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.01",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.025",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.05",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.1",${labelStr}} 1
        operation_duration_seconds_bucket{le="0.25",${labelStr}} 1
        operation_duration_seconds_bucket{le="0.5",${labelStr}} 2
        operation_duration_seconds_bucket{le="1",${labelStr}} 2
        operation_duration_seconds_bucket{le="2.5",${labelStr}} 2
        operation_duration_seconds_bucket{le="5",${labelStr}} 2
        operation_duration_seconds_bucket{le="10",${labelStr}} 2
        operation_duration_seconds_bucket{le="+Inf",${labelStr}} 2
        operation_duration_seconds_sum{${labelStr}} 0.4
        operation_duration_seconds_count{${labelStr}} 2\n
      `)
    })

    it('should have operation metrics with parent', () => {
      const reporter = new PrometheusReporter()
      const parentTracer = new Tracer('parent-service')
      const tracer = new Tracer('service', [reporter])

      const parentSpan1 = parentTracer.startSpan('parent-operation')
      const span1 = tracer.startSpan('my-operation', { childOf: parentSpan1 })
      clock.tick(100)
      span1.finish()

      const parentSpan2 = parentTracer.startSpan('parent-operation')
      const span2 = tracer.startSpan('my-operation', { childOf: parentSpan2 })
      clock.tick(300)
      span2.finish()

      const labelStr = 'parent_service="parent-service",name="my-operation"'

      expect(reporter.metrics()).to.be.equal(dedent`
        # HELP operation_duration_seconds Duration of operations in second
        # TYPE operation_duration_seconds histogram
        operation_duration_seconds_bucket{le="0.005",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.01",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.025",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.05",${labelStr}} 0
        operation_duration_seconds_bucket{le="0.1",${labelStr}} 1
        operation_duration_seconds_bucket{le="0.25",${labelStr}} 1
        operation_duration_seconds_bucket{le="0.5",${labelStr}} 2
        operation_duration_seconds_bucket{le="1",${labelStr}} 2
        operation_duration_seconds_bucket{le="2.5",${labelStr}} 2
        operation_duration_seconds_bucket{le="5",${labelStr}} 2
        operation_duration_seconds_bucket{le="10",${labelStr}} 2
        operation_duration_seconds_bucket{le="+Inf",${labelStr}} 2
        operation_duration_seconds_sum{${labelStr}} 0.4
        operation_duration_seconds_count{${labelStr}} 2\n
      `)
    })
  })

  describe('http_request_handler', () => {
    it('should have http_request_handler metrics', () => {
      const reporter = new PrometheusReporter({
        ignoreTags: {
          [Tags.HTTP_URL]: /bar/
        }
      })
      const tracer = new Tracer('my-service', [reporter])

      const span1 = tracer.startSpan('http_request')
      span1.setTag(Tags.HTTP_URL, 'http://127.0.0.1/foo')
      span1.setTag(Tags.HTTP_METHOD, 'GET')
      span1.setTag(Tags.HTTP_STATUS_CODE, 200)
      span1.setTag(Tags.SPAN_KIND_RPC_SERVER, true)
      clock.tick(100)
      span1.finish()

      // will be ignored
      const span2 = tracer.startSpan('http_request')
      span2.setTag(Tags.HTTP_URL, 'http://127.0.0.1/bar')
      span2.setTag(Tags.HTTP_METHOD, 'GET')
      span2.setTag(Tags.HTTP_STATUS_CODE, 200)
      span2.setTag(Tags.SPAN_KIND_RPC_SERVER, true)
      clock.tick(300)
      span2.finish()

      const labelStr1 = `parent_service="${PrometheusReporter.LABEL_PARENT_SERVICE_UNKNOWN}",name="http_request"`
      const labelStr2 = `parent_service="${PrometheusReporter.LABEL_PARENT_SERVICE_UNKNOWN}",method="GET",code="200"`

      expect(reporter.metrics()).to.be.equal(dedent`
        # HELP operation_duration_seconds Duration of operations in second
        # TYPE operation_duration_seconds histogram
        operation_duration_seconds_bucket{le="0.005",${labelStr1}} 0
        operation_duration_seconds_bucket{le="0.01",${labelStr1}} 0
        operation_duration_seconds_bucket{le="0.025",${labelStr1}} 0
        operation_duration_seconds_bucket{le="0.05",${labelStr1}} 0
        operation_duration_seconds_bucket{le="0.1",${labelStr1}} 1
        operation_duration_seconds_bucket{le="0.25",${labelStr1}} 1
        operation_duration_seconds_bucket{le="0.5",${labelStr1}} 1
        operation_duration_seconds_bucket{le="1",${labelStr1}} 1
        operation_duration_seconds_bucket{le="2.5",${labelStr1}} 1
        operation_duration_seconds_bucket{le="5",${labelStr1}} 1
        operation_duration_seconds_bucket{le="10",${labelStr1}} 1
        operation_duration_seconds_bucket{le="+Inf",${labelStr1}} 1
        operation_duration_seconds_sum{${labelStr1}} 0.1
        operation_duration_seconds_count{${labelStr1}} 1

        # HELP http_request_handler_duration_seconds Duration of HTTP requests in second
        # TYPE http_request_handler_duration_seconds histogram
        http_request_handler_duration_seconds_bucket{le="0.005",${labelStr2}} 0
        http_request_handler_duration_seconds_bucket{le="0.01",${labelStr2}} 0
        http_request_handler_duration_seconds_bucket{le="0.025",${labelStr2}} 0
        http_request_handler_duration_seconds_bucket{le="0.05",${labelStr2}} 0
        http_request_handler_duration_seconds_bucket{le="0.1",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="0.25",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="0.5",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="1",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="2.5",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="5",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="10",${labelStr2}} 1
        http_request_handler_duration_seconds_bucket{le="+Inf",${labelStr2}} 1
        http_request_handler_duration_seconds_sum{${labelStr2}} 0.1
        http_request_handler_duration_seconds_count{${labelStr2}} 1\n
      `)
    })
  })
})
