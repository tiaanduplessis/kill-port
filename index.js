'use strict'

const sh = require('shell-exec')

module.exports = function (port, method = 'tcp') {
  port = Number.parseInt(port)

  if (!port) {
    return Promise.reject(new Error('Invalid port number provided'))
  }

  if (process.platform === 'win32') {
    return sh('netstat -nao')
      .then(res => {
        const { stdout } = res
        if (!stdout) return res

        const lines = stdout.split('\n')
        // The second white-space delimited column of netstat output is the local port,
        // which is the only port we care about.
        // The regex here will match only the local port column of the output
        const lineWithLocalPortRegEx = new RegExp(`^ *${method.toUpperCase()} *[^ ]*:${port}`, 'gm')
        const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx))

        const pids = linesWithLocalPort.reduce((acc, line) => {
          const match = line.match(/(\d*)\w*(\n|$)/gm)
          return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
        }, [])

        return sh(`TaskKill /F /PID ${pids.join(' /PID ')}`)
      })
  }

 const protocol = method === 'udp' ? 'udp' : 'tcp';

	return sh(`lsof -i ${protocol}:${port}`)
    .then(res => {
      const { stdout } = res;

      if (!stdout || !stdout.includes(protocol.toUpperCase())) {
        return Promise.reject(new Error('No process running on port'));
      }

      return sh(`kill -9 $(lsof -t -i ${protocol}:${port})`);
    })
		.catch(error => {
      return console.log(`Failed to terminate process on port ${portNumber}: ${error.message}`);
    });
}
