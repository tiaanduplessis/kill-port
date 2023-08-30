/* eslint-env jest */
const kill = require('./')

describe('kill-port', () => {
  test('should be defined', () => {
    expect(kill).toBeDefined()
  })

  test('should throw if no port is provided', () => {
    expect(kill()).rejects.toThrow('Invalid port number provided')
  })

  test('should throw if invalid signal is provided', () => {
    expect(kill(9999, 'tcp', 'BADSIG')).rejects.toThrow('Invalid signal name provided')
  })

  test('should throw if no process running on given port', () => {
    expect(kill(9999)).rejects.toThrow()
  })
})