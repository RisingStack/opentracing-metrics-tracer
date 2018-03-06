'use strict'

const assert = require('assert')
const Prometheus = require('prom-client')
const { Tags } = require('opentracing')
const Span = require('../tracer/Span')

const DURATION_HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
const METRICS_NAME_OPERATION_DURATION_SECONDS = 'operation_duration_seconds'
const METRICS_NAME_HTTP_REQUEST_HANDLER_DURATION_SECONDS = 'http_request_handler_duration_seconds'
const LABEL_PARENT_SERVICE_UNKNOWN = 'unknown'

/**
* Observe span events and expose them in Prometheus metrics format
* @class PrometheusReporter
*/
class PrometheusReporter {
  /**
  * @static getParentServiceKey
  * @param {Span} span
  * @return {String} parentService
  */
  static getParentService (span) {
    const spanContext = span.context()
    const parentService = spanContext.parentServiceKey() || LABEL_PARENT_SERVICE_UNKNOWN

    return parentService
  }

  /**
  * @constructor
  * @param {Object} [options={}]
  * @param {Object} [options.ignoreTags={}]
  * @returns {PrometheusReporter}
  */
  constructor ({ ignoreTags = {} } = {}) {
    this._registry = new Prometheus.Registry()
    this._options = {
      ignoreTags
    }

    // Initialize metrics
    this._metricsOperationDurationSeconds()
  }

  /**
  * Returns with the reporter's metrics in Prometheus format
  * @method metrics
  * @returns {Object} metrics
  */
  metrics () {
    return this._registry.metrics()
  }

  /**
  * Called by Tracer when a span is finished
  * @method reportFinish
  * @param {Span} span
  */
  reportFinish (span) {
    assert(span instanceof Span, 'span is required')

    // Ignore by tag value
    const isIgnored = Object.entries(this._options.ignoreTags).some(([tagKey, regexp]) => {
      const tagValue = span.getTag(tagKey)
      return tagValue && tagValue.match(regexp)
    })

    if (isIgnored) {
      return
    }

    // Operation metrics
    this._reportOperationFinish(span)

    // HTTP Request
    if (span.getTag(Tags.SPAN_KIND) === Tags.SPAN_KIND_RPC_SERVER &&
      (span.getTag(Tags.HTTP_URL) || span.getTag(Tags.HTTP_METHOD) || span.getTag(Tags.HTTP_STATUS_CODE))) {
      this._reportHttpRequestFinish(span)
    }
  }

  /**
  * Observe operation metrics
  * @method _reportOperationFinish
  * @private
  * @param {Span} span
  */
  _reportOperationFinish (span) {
    assert(span instanceof Span, 'span is required')

    this._metricsOperationDurationSeconds()
      .labels(PrometheusReporter.getParentService(span), span.operationName())
      .observe(span.duration() / 1000)
  }

  /**
  * Observe HTTP request metrics
  * @method _reportHttpRequestFinish
  * @private
  * @param {Span} span
  */
  _reportHttpRequestFinish (span) {
    assert(span instanceof Span, 'span is required')

    this._metricshttpRequestDurationSeconds()
      .labels(
        PrometheusReporter.getParentService(span),
        span.getTag(Tags.HTTP_METHOD),
        span.getTag(Tags.HTTP_STATUS_CODE)
      )
      .observe(span.duration() / 1000)
  }

  /**
  * Singleton to get operation duration metrics
  * @method _metricsOperationDurationSeconds
  * @private
  * @return {Prometheus.Histogram} operationDurationSeconds
  */
  _metricsOperationDurationSeconds () {
    let operationDurationSeconds = this._registry.getSingleMetric(METRICS_NAME_OPERATION_DURATION_SECONDS)

    if (!operationDurationSeconds) {
      operationDurationSeconds = new Prometheus.Histogram({
        name: METRICS_NAME_OPERATION_DURATION_SECONDS,
        help: 'Duration of operations in second',
        labelNames: ['parent_service', 'name'],
        buckets: DURATION_HISTOGRAM_BUCKETS,
        registers: [this._registry]
      })
    }

    return operationDurationSeconds
  }

  /**
  * Singleton to get HTTP request duration metrics
  * @method _metricshttpRequestDurationSeconds
  * @private
  * @return {Prometheus.Histogram} httpRequestDurationSeconds
  */
  _metricshttpRequestDurationSeconds () {
    let httpRequestDurationSeconds = this._registry.getSingleMetric(METRICS_NAME_HTTP_REQUEST_HANDLER_DURATION_SECONDS)

    if (!httpRequestDurationSeconds) {
      httpRequestDurationSeconds = new Prometheus.Histogram({
        name: METRICS_NAME_HTTP_REQUEST_HANDLER_DURATION_SECONDS,
        help: 'Duration of HTTP requests in second',
        labelNames: ['parent_service', 'method', 'code'],
        buckets: DURATION_HISTOGRAM_BUCKETS,
        registers: [this._registry]
      })
    }

    return httpRequestDurationSeconds
  }
}

PrometheusReporter.Prometheus = Prometheus
PrometheusReporter.LABEL_PARENT_SERVICE_UNKNOWN = LABEL_PARENT_SERVICE_UNKNOWN

module.exports = PrometheusReporter
