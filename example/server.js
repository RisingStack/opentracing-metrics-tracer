'use strict'

const http = require('http')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')
const MetricsTracer = require('../src')

const prometheusReporter = new MetricsTracer.PrometheusReporter()
const metricsTracer = new MetricsTracer('my-server', [prometheusReporter])
const PORT = process.env.PORT || 3000

const server = http.createServer((req, res) => {
  // Instrumentation
  const span = metricsTracer.startSpan('http_request', {
    childOf: metricsTracer.extract(FORMAT_HTTP_HEADERS, req.headers)
  })
  const headers = {}

  metricsTracer.inject(span, FORMAT_HTTP_HEADERS, headers)

  span.setTag(Tags.HTTP_URL, req.url)
  span.setTag(Tags.HTTP_METHOD, req.method || 'GET')
  span.setTag(Tags.HTTP_STATUS_CODE, 200)
  span.setTag(Tags.SPAN_KIND_RPC_CLIENT, true)

  // Dummy router: GET /metrics
  if (req.url === '/metrics') {
    span.finish()

    res.writeHead(200, {
      'Content-Type': MetricsTracer.PrometheusReporter.Prometheus.register.contentType
    })
    res.end(prometheusReporter.metrics())
    return
  }

  // My operation like DB access
  setTimeout(() => {
    span.finish()

    res.writeHead(200, headers)
    res.end('Ok')
  }, 30)
})

server.listen(PORT, (err) => {
  // eslint-disable-next-line
  console.log(err || `Server is listening on ${PORT}`)
})
