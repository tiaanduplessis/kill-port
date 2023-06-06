#!/usr/bin/env node
'use strict'

const kill = require('./')
const args = require('get-them-args')(process.argv.slice(2))

const verbose = args.verbose || false
const signal = args.signal || '15'
let port = args.port ? args.port.toString().split(',') : args.unknown
const method = args.method || 'tcp'

if (!Array.isArray(port)) {
  port = [port]
}

Promise.all(port.map(current => {
  return kill(current, method, signal)
    .then((result) => {
      console.log(`Process on port ${current}:${method} killed using signal ${signal}`)
      verbose && console.log(result)
    })
    .catch((error) => {
      console.log(`Could not kill process on port ${port}. ${error.message}.`)
      verbose && console.log(error)
    })
}))
