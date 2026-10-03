/* eslint-env jest */
// Never list or signal real processes; all process commands are virtual.
jest.mock('shell-exec', () => jest.fn(), { virtual: true })
const sh = require('shell-exec')
const kill = require('./')
const getSignal = require('./signal')
const { constants } = require('os')
const platform = Object.getOwnPropertyDescriptor(process, 'platform')
const signals = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGKILL', 'SIGTERM']
const result = (stdout = '', overrides = {}) => ({ stdout, stderr: '', code: 0, ...overrides })
const unix = (pid, port, protocol = 'TCP', state = 'LISTEN') =>
  `node ${pid} user 12u IPv4 0x123 0t0 ${protocol} *:${port}${protocol === 'TCP' ? ` (${state})` : ''}`

beforeEach(() => {
  sh.mockReset()
  sh.mockResolvedValue(result())
})
afterEach(() => Object.defineProperty(process, 'platform', platform))

describe.each(['linux', 'darwin'])('%s signals', current => {
  beforeEach(() => Object.defineProperty(process, 'platform', { value: current }))

  test.each(signals)('sends validated %s using platform signal constants', async signal => {
    sh.mockResolvedValueOnce(result([
      unix(123, 3000), unix(123, 3000), unix(456, 3000), unix(789, 30001),
      unix(111, 3000, 'UDP'), unix(222, 3000, 'TCP', 'ESTABLISHED')
    ].join('\n')))
    await expect(kill(3000, 'tcp', signal)).resolves.toEqual(result())
    expect(sh.mock.calls).toEqual([['lsof -nP -i tcp:3000'], [`kill -${constants.signals[signal]} 123 456`]])
  })

  test('supports UDP with a chosen signal and keeps exact-port matching', async () => {
    sh.mockResolvedValueOnce(result([unix(123, 3000, 'UDP'), unix(456, 30001, 'UDP'), unix(789, 3000)].join('\n')))
    await kill(3000, 'udp', 'SIGINT')
    expect(sh.mock.calls).toEqual([['lsof -nP -i udp:3000'], [`kill -${constants.signals.SIGINT} 123`]])
  })

  test.each([null, '', 'sigint', 'INT', '2', 2, 0, true, {}, [], 'SIGUSR1', 'SIGSTOP',
    'SIGINT; echo injected', 'SIGINT\nSIGKILL', 'SIGTERM ', ' SIGTERM', '__proto__', 'constructor', 'toString'])('rejects invalid signal %p before listing', async signal => {
    await expect(kill(3000, 'tcp', signal)).rejects.toThrow('Invalid signal name provided')
    expect(sh).not.toHaveBeenCalled()
  })

  test('preserves default SIGKILL', async () => {
    sh.mockResolvedValueOnce(result(unix(123, 3000)))
    await kill(3000, 'tcp', undefined)
    expect(sh).toHaveBeenLastCalledWith('kill -9 123')
  })

  test('propagates chosen-signal termination errors', async () => {
    sh.mockResolvedValueOnce(result(unix(123, 3000))).mockResolvedValueOnce(result('', { code: 1, stderr: 'permission denied' }))
    await expect(kill(3000, 'tcp', 'SIGTERM')).rejects.toThrow('permission denied')
  })
})

describe('Windows signals', () => {
  beforeEach(() => Object.defineProperty(process, 'platform', { value: 'win32' }))
  test.each(signals.filter(s => s !== 'SIGKILL'))('rejects %s before listing or killing anything', async signal => {
    await expect(kill(3000, 'tcp', signal)).rejects.toThrow('Only SIGKILL is supported on Windows')
    expect(sh).not.toHaveBeenCalled()
  })
  test('retains TaskKill /F for explicit SIGKILL', async () => {
    sh.mockResolvedValueOnce(result('TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING 123'))
    await kill(3000, 'tcp', 'SIGKILL')
    expect(sh.mock.calls).toEqual([['netstat -nao'], ['TaskKill /F /PID 123']])
  })
  test('rejects invalid names before listing', async () => {
    await expect(kill(3000, 'tcp', 'bad')).rejects.toThrow('Invalid signal name provided')
    expect(sh).not.toHaveBeenCalled()
  })
})

test('rejects missing or unsafe platform signal constants', () => {
  Object.defineProperty(process, 'platform', { value: 'linux' })
  for (const number of [undefined, 0, -1, NaN, Infinity, '2;echo', 2.5]) {
    jest.isolateModules(() => {
      jest.doMock('os', () => ({ constants: { signals: { SIGINT: number } } }))
      expect(() => require('./signal')('SIGINT')).toThrow('not supported on this platform')
    })
  }
  jest.dontMock('os')
})

test('uses the platform constant rather than a hard-coded number', () => {
  Object.defineProperty(process, 'platform', { value: 'linux' })
  jest.isolateModules(() => {
    jest.doMock('os', () => ({ constants: { signals: { SIGINT: 23 } } }))
    expect(require('./signal')('SIGINT')).toBe(23)
  })
  jest.dontMock('os')
  expect(getSignal()).toBe(9)
})
