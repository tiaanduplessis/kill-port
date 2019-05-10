'use strict'

const sh = require('shell-exec')

module.exports = function (port, method = 'tcp') {
  port = Number.parseInt(port)

  if (!port) {
    return Promise.reject(new Error('Invalid argument provided for port'))
  }

  if (process.platform === 'win32') {
    return sh(
      `Stop-Process -Id (Get-Net${method === 'UDP' ? 'UDP' : 'TCP'}Connection -LocalPort ${port}).OwningProcess -Force`
    )
  }

  return sh(
    `lsof -i ${method === 'udp' ? 'udp' : 'tcp'}:${port} | grep ${method === 'udp' ? 'UDP' : 'LISTEN'} | awk '{print $2}' | xargs kill -9`
  )
}
