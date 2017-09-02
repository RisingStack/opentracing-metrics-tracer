'use strict'

const { Tracer } = require('./tracer')
const { PrometheusReporter } = require('./reporters')

module.exports = Object.assign(Tracer, {
  PrometheusReporter
})
