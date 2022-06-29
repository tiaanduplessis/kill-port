<div align="center">
  <img src="./logo.png" alt="Logo" width="500px">
</div>
<h1 align="center">kill-port</h1>
<div align="center">
  <strong>Kill process running on given port</strong>
</div>
<br>
<div align="center">
  <a href="https://npmjs.org/package/kill-port">
    <img src="https://img.shields.io/npm/v/kill-port.svg?style=flat-square" alt="Package version" />
  </a>
  <a href="https://npmjs.org/package/kill-port">
    <img src="https://img.shields.io/npm/dm/kill-port.svg?style=flat-square" alt="Downloads" />
  </a>
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="Standard" />
  </a>
  <a href="https://travis-ci.org/tiaanduplessis/kill-port">
    <img src="https://img.shields.io/travis/tiaanduplessis/kill-port.svg?style=flat-square" alt="Travis Build" />
  </a>
  <a href="https://github.com/tiaanduplessis/kill-port/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/kill-port.svg?style=flat-square" alt="License" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs" />
  </a>
</div>
<br>


## Table of Contents
- [Table of Contents](#table-of-contents)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [CLI](#cli)
- [Contributing](#contributing)
- [License](#license)

## Install


With `npm`:
```sh
npm install --save kill-port
```

With `yarn`:
```sh
yarn add kill-port
```

With `pnpm`:
```sh
pnpm add kill-port
```

## Usage

```js

const kill = require('kill-port')
const http = require('http')
const port = 8080

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  })

  res.end('Hi!')
})

server.listen(port, () => {
  setTimeout(() => {
    
    // Currently you can kill ports running on TCP or UDP protocols
    kill(port, 'tcp')
      .then(console.log)
      .catch(console.log)
  }, 1000)
})

```

## API

The module exports a single function that takes a port number as argument. It returns a promise.

## CLI

You can use `kill-port` as a global package.

Install the package globally:

```sh
$ npm install --global kill-port
# OR
$ yarn global add kill-port
```

Then:

```sh
$ kill-port --port 8080
# OR
$ kill-port 9000
# OR you can use UDP
$ kill-port 9000 --method udp
```

You can also kill multiple ports:

```sh
$ kill-port --port 8080,5000,3000
# OR
$ kill-port 9000 3000 5000
```

Other CLI options:

```sh
# Skips logging information to console
$ kill-port --quiet 8080

# Logs kill result to console
$ kill-port --verbose 8080
```

You can also use [npx](https://nodejs.dev/learn/the-npx-nodejs-package-runner) to `kill-port` without installing:

```sh
# Kill a single port
$ npx kill-port --port 8080
$ npx kill-port 8080
# Use UDP
$ npx kill-port 9000 --method udp
# Kill multiple ports
$ npx kill-port --port 8080,5000,3000
$ npx kill-port 9000 3000 5000
```

## Contributing

Got an idea for a new feature? Found a bug? Contributions are welcome! Please [open up an issue](https://github.com/tiaanduplessis/feature-flip/issues) or [make a pull request](https://makeapullrequest.com/).

## License

[MIT © Tiaan du Plessis](./LICENSE)
