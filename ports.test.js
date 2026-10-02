/* eslint-env jest */
const expandPorts = require('./ports')

test.each([
  [[], []],
  [[1, 65535], [1, 65535]],
  [['3000'], ['3000']],
  [[' 03000 '], [' 03000 ']],
  [['3000-3002'], [3000, 3001, 3002]],
  [['3000-3000'], [3000]],
  [['3000,3001-3003', '4000-4001', 5000], ['3000', 3001, 3002, 3003, 4000, 4001, 5000]],
  [['1-2', '65534-65535'], [1, 2, 65534, 65535]],
  [['3000', '3000-3001', '3000'], ['3000', 3000, 3001, '3000']]
])('expands complete inclusive port selection %p', (input, output) => {
  expect(expandPorts(input)).toEqual(output)
})

test.each([
  undefined, null, true, false, {}, [], NaN, Infinity, -Infinity, 0, -1, 65536, 1.5,
  '', ' ', '3000,', ',3000', '3000,,3001', '3001-3000', '0-1', '65535-65536',
  '3000-', '-3000', '3000--3001', '3000-3001-3002', '3000-3001suffix', '3000suffix',
  'NaN-3000', '3000-Infinity', '1-999999999999999999999999', '1e3-3000', '0x1-3000',
  '1.5-3', '+1-3', '1 - 3', '1\n2', '1-3; echo injected', '1-3\n4-5', '1\u00003',
  '1e3', '0xBB8', '"3000"', '3000/3001', '3000–3001', '3000:3001'
])('rejects malformed port or range %p', value => {
  expect(() => expandPorts([value])).toThrow()
})

test('expands only the finite port domain', () => {
  const ports = expandPorts(['1-65535'])
  expect(ports).toHaveLength(65535)
  expect(ports[0]).toBe(1)
  expect(ports[ports.length - 1]).toBe(65535)
})

test.each([
  ['1-65535', 1],
  ['1-40000', '1-40000'],
  Array(65536).fill(1)
].map(input => [input]))('bounds total expansion, including duplicate ports', input => {
  expect(() => expandPorts(input)).toThrow('At most 65535 ports')
})

test('does not mutate the original selection', () => {
  const input = ['3000-3001', '4000,4001']
  expandPorts(input)
  expect(input).toEqual(['3000-3001', '4000,4001'])
})
