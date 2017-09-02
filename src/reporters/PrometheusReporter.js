'use strict'

const assert = require('assert')
const Prometheus = require('prom-client')
const { Tags } = require('opentracing')
const Span = require('../tracer/Span')

const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
const NAME_OPERATION_DURATION_SECONDS = 'operation_duration_seconds'
const NAME_HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds'

/**
* @class PrometheusReporter
*/
class PrometheusReporter {
  /**
  * @constructor
  * @returns {PrometheusReporter}
  */
  constructor () {
    this._registry = new Prometheus.Registry()

    // Operation metrics
    if (!this._registry.getSingleMetric(NAME_OPERATION_DURATION_SECONDS)) {
      // eslint-disable-next-line no-new
      new Prometheus.Histogram({
        name: NAME_OPERATION_DURATION_SECONDS,
        help: 'Duration of operations in second',
        labelNames: ['parent_service', 'name'],
        buckets: DURATION_BUCKETS,
        registers: [this._registry]
      })
    }
  }

  /**
  * @method metrics
  * @returns {Object} metrics
  */
  metrics () {
    return this._registry.metrics()
  }

  /**
  * @method clear
  */
  clear () {
    return this._registry.clear()
  }

  /**
  * @method reportFinish
  * @param {Span} span
  */
  reportFinish (span) {
    assert(span instanceof Span, 'span is required')

    const spanContext = span.context()

    // Operation
    const operationDurationSeconds = this._registry.getSingleMetric(NAME_OPERATION_DURATION_SECONDS)
    operationDurationSeconds
      .labels(spanContext._parentServiceKey || '', span._operationName)
      .observe(span._duration / 1000)

    // HTTP Request
    if (span._tags[Tags.HTTP_URL] || span._tags[Tags.HTTP_METHOD] || span._tags[Tags.HTTP_STATUS_CODE]) {
      this._reportFinishHttpRequest(span)
    }
  }

  /**
  * @method _reportFinishHttpRequest
  * @private
  * @param {Span} span
  */
  _reportFinishHttpRequest (span) {
    assert(span instanceof Span, 'span is required')

    let httpRequestDurationSeconds = this._registry.getSingleMetric(NAME_HTTP_REQUEST_DURATION_SECONDS)

    if (!httpRequestDurationSeconds) {
      httpRequestDurationSeconds = new Prometheus.Histogram({
        name: NAME_HTTP_REQUEST_DURATION_SECONDS,
        help: 'Duration of HTTP requests in second',
        labelNames: ['method', 'code'],
        buckets: DURATION_BUCKETS,
        registers: [this._registry]
      })
    }

    httpRequestDurationSeconds
      .labels(span._tags[Tags.HTTP_METHOD], span._tags[Tags.HTTP_STATUS_CODE])
      .observe(span._duration / 1000)
  }
}

module.exports = PrometheusReporter
