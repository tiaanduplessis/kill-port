'use strict'

const sh = require('shell-exec')

module.exports = function (port, method = 'tcp') {
  port = Number.parseInt(port)

  if (!port) {
    return Promise.reject(new Error('Invalid argument provided for port'))
  }

  if (process.platform === 'win32') {
    return sh(`netstat -ao | findStr ${method.toUpperCase()}.*:${port}`)
      .then(res => {
        const { stdout } = res
        if (!stdout) return res

        const lines = stdout.split('\n')
        const ports = lines.reduce((acc, line) => {
          const match = line.match(/(\d*)\w*(\n|$)/gm)
          return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
        }, [])

        return sh(`TaskKill /PID ${ports.join(' /PID ')}`)
      })
  }

  return sh(
    `lsof -i ${method === 'udp' ? 'udp' : 'tcp'}:${port} | grep ${method === 'udp' ? 'UDP' : 'LISTEN'} | awk '{print $2}' | xargs kill -9`
  )
}
