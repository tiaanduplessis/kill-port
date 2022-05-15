const kill = require('./')
const http = require('http')
const port = 8080

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  })

  res.end('Hi!')
})

server.listen(port, () => {
  console.log('started listening on port', port)
  setTimeout(() => {
    console.log('killing port', port)
    kill(port)
      .then(console.log)
      .catch(console.log)
  }, 1000)
})
