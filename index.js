'use strict'

const sh = require('shell-exec')
const getSignal = require('./signal')

const noProcess = () => new Error('No process running on port')

function checkResult (res) {
  if (res.error) throw res.error
  if (res.code !== 0) throw new Error(res.stderr || `Command failed: ${res.cmd}`)
  return res
}

function hasPort (address, port) {
  const match = address.split('->')[0].match(/:(\d+)$/)
  return match !== null && Number(match[1]) === port
}

module.exports = function (port, method = 'tcp', signal = 'SIGKILL') {
  if (typeof port === 'string' && /^\d+$/.test(port.trim())) port = Number(port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return Promise.reject(new Error('Invalid port number provided'))
  }

  if (typeof method !== 'string' || !/^(tcp|udp)$/i.test(method)) {
    return Promise.reject(new Error('Invalid protocol provided'))
  }
  method = method.toLowerCase()

  let signalNumber
  try {
    signalNumber = getSignal(signal)
  } catch (error) {
    return Promise.reject(error)
  }

  const isWindows = process.platform === 'win32'
  const command = isWindows ? 'netstat -nao' : `lsof -nP -i ${method}:${port}`

  return sh(command).then(res => {
    // lsof exits with 1 and no output when its selection has no matches.
    if (!isWindows && !res.error && res.code === 1 && !res.stdout && !res.stderr) {
      throw noProcess()
    }
    checkResult(res)

    const pids = new Set()
    for (const line of res.stdout.split(/\r?\n/)) {
      let pid
      if (isWindows) {
        // Only the local address column is relevant, never the foreign address.
        const columns = line.trim().split(/\s+/)
        if (columns.length !== (method === 'tcp' ? 5 : 4) ||
            columns[0] !== method.toUpperCase() || !hasPort(columns[1], port)) continue
        pid = columns[columns.length - 1]
      } else {
        const match = line.match(/^\S+\s+(\d+)\s+.*\s+(TCP|UDP)\s+(\S+)(?:\s+\(([^)]+)\))?\s*$/)
        if (!match || match[2] !== method.toUpperCase() || !hasPort(match[3], port) ||
            (method === 'tcp' && match[4] !== 'LISTEN')) continue
        pid = match[1]
      }

      // Only positive numeric PIDs may reach the shell; PID 0 targets a group.
      if (/^[1-9]\d*$/.test(pid)) pids.add(pid)
    }

    if (pids.size === 0) throw noProcess()
    const killCommand = isWindows
      ? `TaskKill /F /PID ${Array.from(pids).join(' /PID ')}`
      : `kill -${signalNumber} ${Array.from(pids).join(' ')}`
    return sh(killCommand).then(checkResult)
  })
}
