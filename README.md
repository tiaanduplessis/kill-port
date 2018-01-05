<h1 align="center">kill-port</h1>
<div align="center">
  <strong>Kill the process running on given port</strong>
</div>
<br>
<div align="center">
  <a href="https://npmjs.org/package/kill-port">
    <img src="https://img.shields.io/npm/v/kill-port.svg?style=flat-square" alt="Package version" />
  </a>
  <a href="https://greenkeeper.io/">
    <img src="https://badges.greenkeeper.io/tiaanduplessis/kill-port.svg" alt="Greenkeeper" />
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
  <a href="https://badge.fury.io/gh/tiaanduplessis%2Fkill-port">
    <img src="https://badge.fury.io/gh/tiaanduplessis%2Fkill-port.svg?style=flat-square" alt="GitHub version" />
  </a>
  <a href="https://dependencyci.com/github/tiaanduplessis/kill-port">
    <img src="https://dependencyci.com/github/tiaanduplessis/kill-port/badge?style=flat-square" alt="Dependency CI" />
  </a>
  <a href="https://github.com/tiaanduplessis/kill-port/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/kill-port.svg?style=flat-square" alt="License" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs" />
  </a>
</div>
<br>
<div align="center">
  <a href="https://github.com/tiaanduplessis/kill-port/watchers">
    <img src="https://img.shields.io/github/watchers/tiaanduplessis/kill-port.svg?style=social" alt="Github Watch Badge" />
  </a>
  <a href="https://github.com/tiaanduplessis/kill-port/stargazers">
    <img src="https://img.shields.io/github/stars/tiaanduplessis/kill-port.svg?style=social" alt="Github Star Badge" />
  </a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20kill-port!%20https://github.com/tiaanduplessis/kill-port%20%F0%9F%91%8D">
    <img src="https://img.shields.io/twitter/url/https/github.com/tiaanduplessis/kill-port.svg?style=social" alt="Tweet" />
  </a>
</div>
<br>
<div align="center">
  Built with ❤︎ by <a href="tiaanduplessis.co.za">Tiaan</a> and <a href="https://github.com/tiaanduplessis/kill-port/graphs/contributors">contributors</a>
</div>

<h2>Table of Contents</h2>
<details>
  <summary>Table of Contents</summary>
  <li><a href="#install">Install</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#api">API</a></li>
  <li><a href="#cli">CLI</a></li>
  <li><a href="#contribute">Contribute</a></li>
  <li><a href="#license">License</a></li>
</details>

## Install

```sh
$ npm install --save kill-port
# OR
$ yarn add kill-port
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
    kill(port)
      .then(console.log)
      .catch(console.log)
  }, 1000)
})

```

## API

The module exports a single function that takes a port number as argument. It returns a promise.

## CLI

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
```

## Contribute

Contributions are welcome. Please open up an issue or create PR if you would like to help out.

Note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

Licensed under the MIT License.
