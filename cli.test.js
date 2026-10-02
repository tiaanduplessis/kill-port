/* eslint-env jest */
// Exercise the real argument parser, but never run a process-killing command.
jest.mock('./', () => jest.fn())

const argv = process.argv
let kill
let log
let exit
let exitCode
const result = { stdout: 'terminated', stderr: '', code: 0 }

const run = async args => {
  process.argv = ['node', 'cli.js', ...args]
  require('./cli')
  await new Promise(resolve => setImmediate(resolve))
}

beforeEach(() => {
  jest.resetModules()
  kill = require('./')
  kill.mockResolvedValue(result)
  log = jest.spyOn(console, 'log').mockImplementation(() => {})
  exit = jest.spyOn(process, 'exit').mockImplementation(() => {})
  exitCode = process.exitCode
})

afterEach(() => {
  process.argv = argv
  expect(exit).not.toHaveBeenCalled()
  expect(process.exitCode).toBe(exitCode)
  jest.restoreAllMocks()
  process.exitCode = exitCode
})

test.each([
  [['3000'], [[3000, 'tcp']]],
  [['3000', '3001'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['--port', '3000,3001'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['--port=3000'], [['3000', 'tcp']]],
  [['3000', '--method', 'udp'], [[3000, 'udp']]]
])('preserves success output without quiet: %p', async (args, calls) => {
  await run(args)
  expect(kill.mock.calls).toEqual(calls)
  expect(log.mock.calls).toEqual(calls.map(([port]) => [`Process on port ${port} killed`]))
})

test.each([
  [['--quiet', '3000'], [[3000, 'tcp']]],
  [['3000', '--quiet'], [[3000, 'tcp']]],
  [['--quiet', '3000', '3001'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['3000', '--quiet', '3001'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['3000', '3001', '--quiet'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['--quiet', '--port', '3000,3001'], [['3000', 'tcp'], ['3001', 'tcp']]],
  [['--port=3000', '--quiet'], [['3000', 'tcp']]],
  [['--quiet=true', '3000'], [[3000, 'tcp']]],
  [['--quiet', '--quiet', '3000'], [[3000, 'tcp']]],
  [['--quiet', '3000', '3000'], [['3000', 'tcp'], ['3000', 'tcp']]],
  [['--port', '3000', '--port', '3001', '--quiet'], [['3001', 'tcp']]],
  [['--quiet', '3000', '--method', 'udp'], [[3000, 'udp']]],
  [['--quiet', '3000', '--verbose'], [[3000, 'tcp']]]
])('suppresses success output without changing selected ports: %p', async (args, calls) => {
  await run(args)
  expect(kill.mock.calls).toEqual(calls)
  expect(log).not.toHaveBeenCalled()
})

test.each([
  ['--quiet=false', '3000'],
  ['--no-quiet', '3000'],
  ['--quiet', '--no-quiet', '3000']
])('allows quiet to be disabled explicitly: %p', async (...args) => {
  await run(args)
  expect(kill).toHaveBeenCalledWith(3000, 'tcp')
  expect(log.mock.calls).toEqual([['Process on port 3000 killed']])
})

test.each([[], ['--quiet'], ['--quiet', '--verbose']])('does nothing without ports: %p', async (...args) => {
  await run(args)
  expect(kill).not.toHaveBeenCalled()
  expect(log).not.toHaveBeenCalled()
})

test('preserves verbose success details without quiet', async () => {
  await run(['3000', '--verbose'])
  expect(log.mock.calls).toEqual([['Process on port 3000 killed'], [result]])
})

test.each([[], ['--quiet'], ['--quiet', '--verbose']])('preserves error output and exit behavior: %p', async (...flags) => {
  const error = new Error('permission denied')
  kill.mockRejectedValue(error)
  await run(['3000', ...flags])
  expect(kill).toHaveBeenCalledWith(3000, 'tcp')
  const messages = [['Could not kill process on port 3000. permission denied.']]
  if (flags.includes('--verbose')) messages.push([error])
  expect(log.mock.calls).toEqual(messages)
})

test('keeps failures visible when another port succeeds in quiet mode', async () => {
  kill.mockRejectedValueOnce(new Error('No process running on port'))
  await run(['--quiet', '3000', '3001'])
  expect(kill.mock.calls).toEqual([['3000', 'tcp'], ['3001', 'tcp']])
  expect(log.mock.calls).toEqual([
    ['Could not kill process on port 3000. No process running on port.']
  ])
})
