'use strict'

const sinon = require('sinon')
const dedent = require('dedent')
const { expect } = require('chai')
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

  it('should have operation metrics', () => {
    const reporter = new PrometheusReporter()
    const tracer = new Tracer('my-service', [reporter])

    const span1 = tracer.startSpan('my-operation')
    clock.tick(100)
    span1.finish()

    const span2 = tracer.startSpan('my-operation')
    clock.tick(300)
    span2.finish()

    const labelStr = 'parent_service="",name="my-operation"'

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
