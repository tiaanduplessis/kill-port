'use strict'

// Bound both range expansion and the total work requested by one invocation.
const maxPorts = 65535

module.exports = function (input) {
  const ports = []
  for (const value of input) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new Error('Invalid port number provided')
    }
    const entries = typeof value === 'string' ? value.split(',') : [value]
    for (const entry of entries) {
      const match = String(entry).trim().match(/^(\d+)(?:-(\d+))?$/)
      if (!match) throw new Error('Invalid port number or range provided')
      const from = Number(match[1])
      const to = match[2] === undefined ? from : Number(match[2])
      if (!Number.isInteger(from) || !Number.isInteger(to) ||
          from < 1 || to > maxPorts || from > to) {
        throw new Error('Ports must be between 1 and 65535 and ranges must be ascending')
      }
      if (ports.length + to - from + 1 > maxPorts) {
        throw new Error('At most 65535 ports may be requested at once')
      }
      // Preserve single-port argument types and ordering for existing callers.
      if (match[2] === undefined) ports.push(entry)
      else for (let port = from; port <= to; port++) ports.push(port)
    }
  }
  return ports
}
