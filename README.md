# opentracing-metrics-tracer

[![Build Status](https://travis-ci.org/RisingStack/opentracing-metrics-tracer.svg?branch=master)](https://travis-ci.org/RisingStack/opentracing-metrics-tracer)  

Exports cross-process metrics via OpenTracing instrumentation to reporters: Prometheus.  
It's capable to measure operation characteristics in a distributed system like microservices.  

It also makes possible to reverse engineer the infrastructure topology as we know the initiators

## Available Reporters

- [Prometheus](https://prometheus.io/) via [prom-client](https://github.com/siimon/prom-client)

## Getting started

```js
const MetricsTracer = require('@risingstack/opentracing-metrics-tracer')
const prometheusReporter = new MetricsTracer.PrometheusReporter()
const metricsTracer = new MetricsTracer('my-service', [prometheusReporter])

// Instrument
const span = metricsTracer.startSpan('my-operation')
span.finish()
...

app.get('/metrics', (req, res) => {
  res.set('Content-Type', MetricsTracer.PrometheusReporter.Prometheus.register.contentType)
  res.end(prometheusReporter.metrics())
})
```

### With auto instrumentation and multiple tracers

Check out: https://github.com/RisingStack/opentracing-auto

```js
// Prometheus metrics tracer
const MetricsTracer = require('@risingstack/opentracing-metrics-tracer')
const prometheusReporter = new MetricsTracer.PrometheusReporter()
const metricsTracer = new MetricsTracer('my-service', [prometheusReporter])

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
  res.set('Content-Type', MetricsTracer.PrometheusReporter.Prometheus.register.contentType)
  res.end(prometheusReporter.metrics())
})
```

### Example

See [example directory](/example).

```sh
node example/server
```

## API

`const Tracer = require('@risingstack/opentracing-metrics-tracer')`

### new Tracer(serviceKey, [reporter1, reporter2, ...])

- **serviceKey** *String*, *required*, unique key that identifies a specific type of service *(for example: my-frontend-api)*
- **reporters** *Array of reporters*, *optional*, *default:* []

[OpenTracing](https://github.com/opentracing/opentracing-javascript) compatible tracer, for the complete API check out the official [documentation](https://opentracing-javascript.surge.sh/).

### new Tracer.PrometheusReporter()

Creates a new Prometheus reporter.

### Tracer.PrometheusReporter.Prometheus

Exposed [prom-client](https://github.com/siimon/prom-client).

## Reporters

### Prometheus Reporter

Exposes metrics in Prometheus format via [prom-client](https://github.com/siimon/prom-client)

#### Metrics

- [operation_duration_seconds](#operation_duration_seconds)
- [http_request_duration_seconds](#http_request_duration_seconds)

##### operation_duration_seconds

Always measured.  
Sample output: Two distributed services communicate over the network.

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

##### http_request_duration_seconds

Measured only when the span is tagged with `HTTP_METHOD` or `HTTP_STATUS_CODE`.  
Sample output:
```
# HELP http_request_duration_seconds Duration of HTTP requests in second
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="GET",code="200",name="http_request" 0
http_request_duration_seconds_bucket{le="0.01",method="GET",code="200",name="http_request" 0
http_request_duration_seconds_bucket{le="0.025",method="GET",code="200",name="http_request" 0
http_request_duration_seconds_bucket{le="0.05",method="GET",code="200",name="http_request" 0
http_request_duration_seconds_bucket{le="0.1",method="GET",code="200",name="http_request" 1
http_request_duration_seconds_bucket{le="0.25",method="GET",code="200",name="http_request" 1
http_request_duration_seconds_bucket{le="0.5",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_bucket{le="1",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_bucket{le="2.5",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_bucket{le="5",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_bucket{le="10",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_bucket{le="+Inf",method="GET",code="200",name="http_request" 2
http_request_duration_seconds_sum{method="GET",code="200",name="http_request" 0.4
http_request_duration_seconds_count{method="GET",code="200",name="http_request" 2
```

## Future and ideas

This library is new, in the future we could measure much more useful and specific metrics with it.  
Please share your ideas in a form of issues or pull-requests.
