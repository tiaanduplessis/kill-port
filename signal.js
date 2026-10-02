'use strict'

const { constants } = require('os')
const signals = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGKILL', 'SIGTERM']

module.exports = function (signal = 'SIGKILL') {
  if (typeof signal !== 'string' || !signals.includes(signal)) {
    throw new Error('Invalid signal name provided')
  }
  // TaskKill cannot deliver Unix signal semantics. Never silently force-kill
  // a process when the caller requested a graceful or interrupt signal.
  if (process.platform === 'win32') {
    if (signal !== 'SIGKILL') throw new Error('Only SIGKILL is supported on Windows')
    return 9
  }
  const number = constants.signals[signal]
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Signal ${signal} is not supported on this platform`)
  }
  return number
}
