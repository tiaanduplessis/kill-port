#!/usr/bin/env node
'use strict'

const kill = require('./')
const args = require('get-them-args')(process.argv.slice(2))

kill(args.port)
  .then(() => console.log(`Process on port ${args.port} killed`))
  .catch(() => console.log(`Could not kill process on port ${args.port}`))
