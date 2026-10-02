#!/usr/bin/env node
'use strict'

const kill = require('./')
const expandPorts = require('./ports')
// Keep the boolean flag from consuming a following positional port.
const argv = process.argv.slice(2).map(arg => arg === '--quiet' ? '--quiet=true' : arg)
const args = require('get-them-args')(argv)

const verbose = args.verbose || false
const quiet = args.quiet || false
const hasPort = Object.prototype.hasOwnProperty.call(args, 'port')
let port = hasPort ? args.port : args.unknown
if (hasPort && (typeof port === 'number' || typeof port === 'string')) {
  port = String(port).split(',')
}
const method = args.method || 'tcp'

if (!Array.isArray(port)) {
  port = [port]
}
const selection = port.join(',')

try {
  // Validate every entry before starting any process-listing command.
  // The argument parser otherwise mistakes negative ports for option names.
  if (argv.some(arg => /^-\d/.test(arg))) throw new Error('Invalid port number or range provided')
  port = expandPorts(port)
} catch (error) {
  console.log(`Invalid port selection. ${error.message}.`)
  verbose && console.log(error)
  process.exitCode = 1
  port = []
}

let next = 0
async function worker () {
  while (next < port.length) {
    const current = port[next++]
    await kill(current, method)
      .then((result) => {
        if (!quiet) {
          console.log(`Process on port ${current} killed`)
          verbose && console.log(result)
        }
      })
      .catch((error) => {
        console.log(`Could not kill process on port ${selection}. ${error.message}.`)
        verbose && console.log(error)
      })
  }
}

// A large range must not start thousands of shell commands simultaneously.
Promise.all(Array.from({ length: Math.min(4, port.length) }, worker))
