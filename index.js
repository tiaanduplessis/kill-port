'use strict'

const sh = require('execa').shell

module.exports = function (port) {
  if (!Number.parseInt(port)) {
    return Promise.reject(new Error('Invalid argument provided for port'))
  }
	
	if (process.platform === 'win32') {
    sh(`Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`);
    return Promise.resolve();
  }

  return sh(`lsof -i tcp:${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`)
}
