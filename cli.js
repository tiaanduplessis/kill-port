#!/usr/bin/env node
'use strict'

const kill = require('./')
// Keep the boolean flag from consuming a following positional port.
const argv = process.argv.slice(2).map(arg => arg === '--quiet' ? '--quiet=true' : arg)
const args = require('get-them-args')(argv)

const verbose = args.verbose || false
const quiet = args.quiet || false
let port = args.port ? args.port.toString().split(',') : args.unknown
const method = args.method || 'tcp'

if (!Array.isArray(port)) {
  port = [port]
}

Promise.all(port.map(current => {
  return kill(current, method)
    .then((result) => {
      if (!quiet) {
        console.log(`Process on port ${current} killed`)
        verbose && console.log(result)
      }
    })
    .catch((error) => {
      console.log(`Could not kill process on port ${port}. ${error.message}.`)
      verbose && console.log(error)
    })
}))
