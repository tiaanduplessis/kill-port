/* eslint-env jest */
// Never list or signal real processes: every CLI termination is virtual.
jest.mock('./', () => jest.fn())

const argv = process.argv
let kill
let log
let exitCode

const run = async args => {
  process.argv = ['node', 'cli.js', ...args]
  require('./cli')
  await new Promise(resolve => setImmediate(resolve))
}

beforeEach(() => {
  jest.resetModules()
  kill = require('./')
  kill.mockResolvedValue({ code: 0 })
  log = jest.spyOn(console, 'log').mockImplementation(() => {})
  exitCode = process.exitCode
})

afterEach(() => {
  process.argv = argv
  process.exitCode = exitCode
  jest.restoreAllMocks()
})

test.each([
  ['3000-3002'],
  ['--port', '3000-3002'],
  ['--port=3000-3002']
])('accepts CLI range syntax %p', async (...args) => {
  await run(args)
  expect(kill.mock.calls).toEqual([[3000, 'tcp'], [3001, 'tcp'], [3002, 'tcp']])
  expect(log.mock.calls).toEqual([3000, 3001, 3002].map(port => [`Process on port ${port} killed`]))
  expect(process.exitCode).toBe(exitCode)
})

test.each([
  ['3000,3001-3002', '4000-4001'],
  ['--port', '3000,3001-3002,4000-4001']
])('accepts mixed ports and ranges %p', async (...args) => {
  await run(args)
  expect(kill.mock.calls).toEqual([
    ['3000', 'tcp'], [3001, 'tcp'], [3002, 'tcp'], [4000, 'tcp'], [4001, 'tcp']
  ])
})

test('preserves explicit --port precedence over positional ports', async () => {
  await run(['4000-4001', '--port', '3000-3001'])
  expect(kill.mock.calls).toEqual([[3000, 'tcp'], [3001, 'tcp']])
})

test('supports quiet and UDP without broadening selection', async () => {
  await run(['--quiet', '--port', '3000-3001', '--method', 'udp', '--verbose'])
  expect(kill.mock.calls).toEqual([[3000, 'udp'], [3001, 'udp']])
  expect(log).not.toHaveBeenCalled()
})

test.each([
  '3001-3000', '0-3', '65534-65536', '1-300000000000000000000', '3000-',
  '3000--3001', '3000-3001-3002', '3000,', '3000-Infinity', '1e3-3000',
  '3000-3001; echo injected', '1-65535,1', '-1-3', '-1'
])('validates the entire selection before invoking kill: %p', async invalid => {
  await run(['--quiet', '4000', invalid])
  expect(kill).not.toHaveBeenCalled()
  expect(log).toHaveBeenCalledTimes(1)
  expect(log.mock.calls[0][0]).toMatch(/^Invalid port selection\./)
  expect(process.exitCode).toBe(1)
})

test('shows verbose validation details even when quiet', async () => {
  await run(['--port', '3000-', '--quiet', '--verbose'])
  expect(kill).not.toHaveBeenCalled()
  expect(log).toHaveBeenCalledTimes(2)
  expect(log.mock.calls[1][0]).toBeInstanceOf(Error)
  expect(process.exitCode).toBe(1)
})

test.each(['0', 'false', 'null', '', 'true'])('does not fall back to positional ports when --port is invalid: %p', async invalid => {
  await run([`--port=${invalid}`, '4000-4001'])
  expect(kill).not.toHaveBeenCalled()
  expect(process.exitCode).toBe(1)
})

test('bounds active work to four ports and continues after failures', async () => {
  const pending = []
  kill.mockImplementation(() => new Promise((resolve, reject) => pending.push({ resolve, reject })))
  await run(['3000-3009', '--quiet'])
  expect(kill).toHaveBeenCalledTimes(4)
  pending[0].reject(new Error('permission denied'))
  await new Promise(resolve => setImmediate(resolve))
  expect(kill).toHaveBeenCalledTimes(5)
  for (let index = 1; index < 10; index++) {
    pending[index].resolve({ code: 0 })
    await new Promise(resolve => setImmediate(resolve))
  }
  expect(kill.mock.calls).toEqual(Array.from({ length: 10 }, (_, index) => [3000 + index, 'tcp']))
  expect(log.mock.calls).toEqual([['Could not kill process on port 3000-3009. permission denied.']])
  expect(process.exitCode).toBe(exitCode)
})
