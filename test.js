/* eslint-env jest */
// Never run a real process-listing or termination command in the test suite.
jest.mock('shell-exec', () => jest.fn(), { virtual: true })

const sh = require('shell-exec')
const kill = require('./')
const platform = Object.getOwnPropertyDescriptor(process, 'platform')
const result = (stdout = '', overrides = {}) => ({ stdout, stderr: '', code: 0, ...overrides })
const unixHeader = 'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME'
const unix = (pid, address, protocol = 'TCP', state = 'LISTEN') =>
  `node ${pid} user 12u IPv6 0x123 0t0 ${protocol} ${address}${protocol === 'TCP' ? ` (${state})` : ''}`
const windowsHeader = '  Proto  Local Address  Foreign Address  State  PID'
const windows = (pid, address, protocol = 'TCP', remote = '0.0.0.0:0') =>
  `  ${protocol}  ${address}  ${remote}  ${protocol === 'TCP' ? 'LISTENING  ' : ''}${pid}`

beforeEach(() => {
  sh.mockReset()
  sh.mockResolvedValue(result())
})

afterEach(() => {
  Object.defineProperty(process, 'platform', platform)
})

describe.each(['linux', 'darwin', 'win32'])('%s', currentPlatform => {
  const isWindows = currentPlatform === 'win32'
  const header = isWindows ? windowsHeader : unixHeader
  const row = isWindows ? windows : unix
  const command = (port, protocol = 'tcp') => isWindows ? 'netstat -nao' : `lsof -nP -i ${protocol}:${port}`
  const terminate = (...pids) => isWindows ? `TaskKill /F /PID ${pids.join(' /PID ')}` : `kill -9 ${pids.join(' ')}`

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: currentPlatform })
  })

  test('exports a function', () => {
    expect(kill).toBeInstanceOf(Function)
  })

  test.each([undefined, null, '', ' ', 0, -1, 65536, 3.5, NaN, Infinity, {}, [], true,
    '3000suffix', '3000; echo injected', '3000\n3001', '0xBB8', '3e3'])('rejects invalid port %p before running a command', async port => {
    await expect(kill(port)).rejects.toThrow('Invalid port number provided')
    expect(sh).not.toHaveBeenCalled()
  })

  test.each([null, {}, 123, '', 'sctp', 'tcp; echo injected', '.*'])('rejects invalid protocol %p before running a command', async protocol => {
    await expect(kill(3000, protocol)).rejects.toThrow('Invalid protocol provided')
    expect(sh).not.toHaveBeenCalled()
  })

  test.each([1, 65535, 3000, '3000', ' 03000 '])('accepts valid numeric port %p', async port => {
    const numericPort = Number(port)
    sh.mockResolvedValueOnce(result(row(123, `127.0.0.1:${numericPort}`)))
    await expect(kill(port)).resolves.toEqual(result())
    expect(sh.mock.calls).toEqual([[command(numericPort)], [terminate(123)]])
  })

  test.each(['tcp', 'TCP', 'udp', 'UDP'])('matches exact local %s ports and deduplicates PIDs', async protocol => {
    const proto = protocol.toUpperCase()
    const stdout = [
      header,
      row(100, '0.0.0.0:3000', proto),
      row(200, '[::]:3000', proto),
      row(200, '[fe80::1%12]:3000', proto),
      row(300, '127.0.0.1:30001', proto),
      row(400, '[::1]:13000', proto),
      row(500, '127.0.0.1:3000', proto === 'TCP' ? 'UDP' : 'TCP')
    ].join('\r\n') + '\r\n'
    const killed = result('terminated')
    sh.mockResolvedValueOnce(result(stdout)).mockResolvedValueOnce(killed)
    await expect(kill(3000, protocol)).resolves.toBe(killed)
    expect(sh.mock.calls).toEqual([[command(3000, protocol.toLowerCase())], [terminate(100, 200)]])
  })

  test.each(['', '\r\n', header, row(123, '127.0.0.1:30001'), row(123, '[::1]:13000'),
    row(123, '127.0.0.1:3000', 'UDP'), row(123, '127.0.0.1:http')])('rejects unmatched output without trying to terminate anything: %p', async stdout => {
    sh.mockResolvedValueOnce(result(stdout))
    await expect(kill(3000)).rejects.toThrow('No process running on port')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test.each(['0', '-1', '123;echo', '123abc', '', 'PID'])('ignores unsafe or malformed PID %p', async pid => {
    sh.mockResolvedValueOnce(result(row(pid, '127.0.0.1:3000')))
    await expect(kill(3000)).rejects.toThrow('No process running on port')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('handles leading/trailing whitespace and tab-delimited fields', async () => {
    sh.mockResolvedValueOnce(result(row(123, '[::1]:3000').trim().replace(/ +/g, '\t') + ' \r\n'))
    await kill(3000)
    expect(sh).toHaveBeenLastCalledWith(terminate(123))
  })

  test.each(['tcp', 'udp'])('ignores a foreign %s port', async protocol => {
    const stdout = isWindows
      ? row(123, '127.0.0.1:4000', protocol.toUpperCase(), '127.0.0.2:3000')
      : row(123, '127.0.0.1:4000->127.0.0.2:3000', protocol.toUpperCase(), 'ESTABLISHED')
    sh.mockResolvedValueOnce(result(stdout))
    await expect(kill(3000, protocol)).rejects.toThrow('No process running on port')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('rejects a failed listing even if partial stdout contains a match', async () => {
    sh.mockResolvedValueOnce(result(row(123, '*:3000'), { code: 1, stderr: 'listing failed' }))
    await expect(kill(3000)).rejects.toThrow('listing failed')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('rejects a missing listing command', async () => {
    sh.mockResolvedValueOnce(result('', { code: 127, stderr: 'command not found' }))
    await expect(kill(3000)).rejects.toThrow('command not found')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('propagates a listing spawn error', async () => {
    const error = new Error('spawn failed')
    sh.mockResolvedValueOnce(result('', { error }))
    await expect(kill(3000)).rejects.toBe(error)
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('propagates a rejected listing promise', async () => {
    const error = new Error('listing rejected')
    sh.mockRejectedValueOnce(error)
    await expect(kill(3000)).rejects.toBe(error)
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test.each([1, 127, null])('rejects unsuccessful termination with code %p', async code => {
    sh.mockResolvedValueOnce(result(row(123, '*:3000')))
      .mockResolvedValueOnce(result('', { code, stderr: 'termination failed' }))
    await expect(kill(3000)).rejects.toThrow('termination failed')
    expect(sh).toHaveBeenCalledTimes(2)
  })

  test('reports failure even without stderr', async () => {
    sh.mockResolvedValueOnce(result(row(123, '*:3000')))
      .mockResolvedValueOnce(result('', { code: 1, cmd: terminate(123) }))
    await expect(kill(3000)).rejects.toThrow(`Command failed: ${terminate(123)}`)
  })

  test('propagates a termination spawn error', async () => {
    const error = new Error('termination spawn failed')
    sh.mockResolvedValueOnce(result(row(123, '*:3000'))).mockResolvedValueOnce({ error })
    await expect(kill(3000)).rejects.toBe(error)
  })

  test('propagates a rejected termination promise', async () => {
    const error = new Error('termination rejected')
    sh.mockResolvedValueOnce(result(row(123, '*:3000'))).mockRejectedValueOnce(error)
    await expect(kill(3000)).rejects.toBe(error)
  })
})

describe('Unix lsof output', () => {
  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
  })

  test('does not mistake another column or a substring for the requested port (#67)', async () => {
    const stdout = [
      unixHeader,
      unix(62775, '192.168.0.1:49302->192.168.0.2:443', 'TCP', 'ESTABLISHED'),
      unix(9302, '*:3000'),
      'node9302 123 user9302 12u IPv4 9302 0t0 TCP *:3000 (LISTEN)'
    ].join('\n')
    sh.mockResolvedValueOnce(result(stdout))
    await expect(kill(9302)).rejects.toThrow('No process running on port')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('keeps TCP termination restricted to listeners', async () => {
    sh.mockResolvedValueOnce(result([
      unix(100, '*:3000'),
      unix(200, '127.0.0.1:3000->127.0.0.2:443', 'TCP', 'ESTABLISHED'),
      unix(300, '[::1]:3000->127.0.0.2:443', 'TCP', 'CLOSE_WAIT')
    ].join('\n')))
    await kill(3000)
    expect(sh).toHaveBeenLastCalledWith('kill -9 100')
  })

  test('handles connected UDP sockets by their local endpoint only', async () => {
    sh.mockResolvedValueOnce(result([
      unix(100, '127.0.0.1:3000->127.0.0.2:53', 'UDP'),
      unix(200, '[::1]:3000->[::2]:53', 'UDP'),
      unix(300, '127.0.0.1:4000->127.0.0.2:3000', 'UDP')
    ].join('\n')))
    await kill(3000, 'udp')
    expect(sh).toHaveBeenLastCalledWith('kill -9 100 200')
  })

  test('recognizes the lsof no-match exit code', async () => {
    sh.mockResolvedValueOnce(result('', { code: 1 }))
    await expect(kill(3000)).rejects.toThrow('No process running on port')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('does not accept partial output on an unexplained lsof failure', async () => {
    sh.mockResolvedValueOnce(result(unix(123, '*:3000'), { code: 1, cmd: 'lsof' }))
    await expect(kill(3000)).rejects.toThrow('Command failed: lsof')
    expect(sh).toHaveBeenCalledTimes(1)
  })
})

describe('Windows netstat output', () => {
  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
  })

  test('does not treat a netstat failure as an empty selection', async () => {
    sh.mockResolvedValueOnce(result('', { code: 1, cmd: 'netstat -nao' }))
    await expect(kill(3000)).rejects.toThrow('Command failed: netstat -nao')
    expect(sh).toHaveBeenCalledTimes(1)
  })

  test('preserves matching non-listening local TCP connections', async () => {
    sh.mockResolvedValueOnce(result('  TCP  127.0.0.1:3000  127.0.0.2:443  ESTABLISHED  123'))
    await kill(3000)
    expect(sh).toHaveBeenLastCalledWith('TaskKill /F /PID 123')
  })
})
