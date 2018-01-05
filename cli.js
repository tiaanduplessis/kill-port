#!/usr/bin/env node
'use strict'

const kill = require('./')
const args = require('get-them-args')(process.argv.slice(2))

const port = args.port || args.unknown

kill(port)
  .then(() => console.log(`Process on port ${port} killed`))
  .catch(() => console.log(`Could not kill process on port ${port}`))
