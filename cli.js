#!/usr/bin/env node
'use strict'

const kill = require('./')
const args = require('get-them-args')(process.argv.slice(2))

const verbose = args.verbose || false
const method = args.method || 'tcp'

const portArgStr = args.port
	? args.port.toString()
	: args.unknown.toString()

if (isPortsList(portArgStr)) {
	const ports = portArgStr.split(",").filter(Boolean)
	return killAllPorts(ports, { method, verbose })
}

if (isPortsRange(portArgStr)) {
	const [min, max] = getMinMaxFromRange(portArgStr)
	const ports = makeArrayFromRange(min, max)
	return killAllPorts(ports, { method, verbose })
}

killAllPorts([portArgStr], { method, verbose })

function killAllPorts(ports, { method, verbose }) {
	Promise.all(ports.map(current => {
		return kill(current, method)
			.then((result) => {
				console.log(`Process on port ${current} killed`)
				verbose && console.log(result)
			})
			.catch((error) => {
				console.log(`Could not kill process on port ${current}. ${error.message}.`)
				verbose && console.log(error)
			})
	}))
}

function isPortsList(argStr) {
	return argStr.includes(",")
}

function isPortsRange(argStr) {
	return argStr.includes("-")
}

function getMinMaxFromRange(rangeStr) {
	return rangeStr
			.split("-")
			.slice(0, 2)
			.map(v => parseInt(v))
			.sort((a, b) => a - b)
}

function makeArrayFromRange(min, max) {
	const diff = max - min

	return Array.from({ length: diff + 1 }).map((_, i) => min + i)
}
