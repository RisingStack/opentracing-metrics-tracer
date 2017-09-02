# opentracing-metrics-tracer

[![Build Status](https://travis-ci.org/RisingStack/opentracing-metrics-tracer.svg?branch=master)](https://travis-ci.org/RisingStack/opentracing-metrics-tracer)  

Exports cross-process metrics via OpenTracing instrumentation to reporters: Prometheus.  
It's capable to measure operation characteristics in a distributed system like microservices.  

It also makes possible to reverse engineer the infrastructure topology as we know the initiators

## Reporters

- [Prometheus](https://prometheus.io/)

## Getting started

```js
const { PrometheusReporter, Tracer } = require('@risingstack/opentracing-metrics-tracer')
const prometheusReporter = new PrometheusReporter()
const metricsTracer = new Tracer('my-service', [prometheusReporter])

// Instrument
const span = metricsTracer.startSpan('my-operation')
span.finish()
...

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(reporter.metrics())
})
```

### With auto instrumentation and multiple tracers

Check out: https://github.com/RisingStack/opentracing-auto

```js
// Prometheus metrics tracer
const { PrometheusReporter, Tracer } = require('@risingstack/opentracing-metrics-tracer')
const prometheusReporter = new PrometheusReporter()
const metricsTracer = new Tracer('my-service', [prometheusReporter])

// Jaeger tracer (classic distributed tracing)
const jaeger = require('jaeger-client')
const UDPSender = require('jaeger-client/dist/src/reporters/udp_sender').default
const sampler = new jaeger.RateLimitingSampler(1)
const reporter = new jaeger.RemoteReporter(new UDPSender())
const jaegerTracer = new jaeger.Tracer('my-server-pg', reporter, sampler)

// Auto instrumentation
const Instrument = require('@risingstack/opentracing-auto')
const instrument = new Instrument({
  tracers: [metricsTracer, jaegerTracer]
})

// Rest of your code
const express = require('express')
const app = express()

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(reporter.metrics())
})
```

## Prometheus Reporter

Exposes metrics in Prometheus format.

### Sample metrics output

Two distributed services communicates over the network.

```
# HELP operation_duration_seconds Duration of operations in second
# TYPE operation_duration_seconds histogram
operation_duration_seconds_bucket{le="0.005",parent_service="my-parent-service",name="my-operation" 0
operation_duration_seconds_bucket{le="0.01",parent_service="my-parent-service",name="my-operation" 0
operation_duration_seconds_bucket{le="0.025",parent_service="my-parent-service",name="my-operation" 0
operation_duration_seconds_bucket{le="0.05",parent_service="my-parent-service",name="my-operation" 0
operation_duration_seconds_bucket{le="0.1",parent_service="my-parent-service",name="my-operation" 1
operation_duration_seconds_bucket{le="0.25",parent_service="my-parent-service",name="my-operation" 1
operation_duration_seconds_bucket{le="0.5",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_bucket{le="1",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_bucket{le="2.5",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_bucket{le="5",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_bucket{le="10",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_bucket{le="+Inf",parent_service="my-parent-service",name="my-operation" 2
operation_duration_seconds_sum{parent_service="my-parent-service",name="my-operation" 0.4
operation_duration_seconds_count{parent_service="my-parent-service",name="my-operation" 2
```
