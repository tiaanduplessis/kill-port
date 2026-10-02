/* eslint-env jest */
jest.mock('./', () => jest.fn())
const argv = process.argv
const platform = Object.getOwnPropertyDescriptor(process, 'platform')
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
  Object.defineProperty(process, 'platform', { value: 'linux' })
})
afterEach(() => {
  process.argv = argv
  process.exitCode = exitCode
  Object.defineProperty(process, 'platform', platform)
  jest.restoreAllMocks()
})
test.each(['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGKILL', 'SIGTERM'])('passes explicit --signal %s to the API', async signal => {
  await run(['--signal', signal, '3000'])
  expect(kill).toHaveBeenCalledWith(3000, 'tcp', signal)
  expect(log.mock.calls).toEqual([[signal === 'SIGKILL' ? 'Process on port 3000 killed' : `Signal ${signal} sent to process on port 3000`]])
})
test('supports equals syntax, ranges, UDP and quiet together', async () => {
  await run(['--quiet', '--signal=SIGTERM', '--port', '3000-3002', '--method', 'udp', '--verbose'])
  expect(kill.mock.calls).toEqual([3000, 3001, 3002].map(port => [port, 'udp', 'SIGTERM']))
  expect(log).not.toHaveBeenCalled()
})
test.each(['', 'false', 'null', 'SIGINT; echo injected', 'INT', '2', 'sigint', 'constructor', 'SIGSTOP'])('rejects invalid --signal=%p without invoking the API', async signal => {
  await run(['--quiet', `--signal=${signal}`, '3000-3001'])
  expect(kill).not.toHaveBeenCalled()
  expect(log.mock.calls).toEqual([['Invalid signal selection. Invalid signal name provided.']])
  expect(process.exitCode).toBe(1)
})
test('rejects a signal flag with no value', async () => {
  await run(['3000', '--signal'])
  expect(kill).not.toHaveBeenCalled()
  expect(process.exitCode).toBe(1)
})
test('reports Windows signal limitation before any API calls', async () => {
  Object.defineProperty(process, 'platform', { value: 'win32' })
  await run(['3000-3001', '--signal', 'SIGINT', '--quiet', '--verbose'])
  expect(kill).not.toHaveBeenCalled()
  expect(log.mock.calls[0]).toEqual(['Invalid signal selection. Only SIGKILL is supported on Windows.'])
  expect(log.mock.calls[1][0]).toBeInstanceOf(Error)
  expect(process.exitCode).toBe(1)
})
test('accepts explicit SIGKILL on Windows', async () => {
  Object.defineProperty(process, 'platform', { value: 'win32' })
  await run(['3000', '--signal', 'SIGKILL'])
  expect(kill).toHaveBeenCalledWith(3000, 'tcp', 'SIGKILL')
})
test('keeps command errors visible in quiet mode', async () => {
  kill.mockRejectedValue(new Error('permission denied'))
  await run(['3000', '--signal', 'SIGTERM', '--quiet'])
  expect(log.mock.calls).toEqual([['Could not kill process on port 3000. permission denied.']])
  expect(process.exitCode).toBe(exitCode)
})
