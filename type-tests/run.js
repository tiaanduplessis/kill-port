'use strict'

const assert = require('assert')
const { execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { gunzipSync } = require('zlib')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kill-port-types-'))
const packageFiles = ['package.json', 'index.d.ts']
const fixture = fs.readFileSync(path.join(__dirname, 'consumer.ts'), 'utf8')

// Read only these two regular files from our own npm-generated tarball. Never
// extract arbitrary archive paths, links, or JavaScript into the consumer.
function declarationsFromTarball (filename) {
  const tar = gunzipSync(fs.readFileSync(filename))
  const files = {}
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every(byte => byte === 0)) break
    const name = header.toString('utf8', 0, 100).replace(/\0.*$/, '')
    const size = parseInt(header.toString('ascii', 124, 136), 8)
    assert(Number.isSafeInteger(size) && size >= 0 && offset + 512 + size <= tar.length)
    for (const file of packageFiles) {
      if (name === `package/${file}`) {
        assert(header[156] === 48 || header[156] === 0, `${file} must be a regular file`)
        files[file] = tar.subarray(offset + 512, offset + 512 + size)
      }
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  assert.deepStrictEqual(Object.keys(files).sort(), packageFiles.slice().sort())
  return files
}

function checkConsumer (label, files) {
  const consumer = path.join(temp, label)
  const packageDir = path.join(consumer, 'node_modules', 'kill-port')
  fs.mkdirSync(packageDir, { recursive: true })
  for (const file of packageFiles) fs.writeFileSync(path.join(packageDir, file), files[file])
  assert.strictEqual(JSON.parse(files['package.json']).types, 'index.d.ts')

  const modes = [
    [ts.ModuleKind.CommonJS, ts.ModuleResolutionKind.Node10],
    [ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
    [ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext]
  ]
  for (const [module, moduleResolution] of modes) {
    for (const esModuleInterop of [false, true]) {
      const extension = esModuleInterop && module !== ts.ModuleKind.CommonJS ? 'mts' : 'ts'
      const entry = path.join(consumer, `consumer.${extension}`)
      const importLine = esModuleInterop
        ? "import killPort from 'kill-port';"
        : "import killPort = require('kill-port');"
      fs.writeFileSync(entry, `${importLine}\n${fixture}`)
      const program = ts.createProgram([entry], {
        module,
        moduleResolution,
        esModuleInterop,
        target: ts.ScriptTarget.ES2015,
        lib: ['lib.es2015.d.ts'],
        types: [],
        strict: true,
        skipLibCheck: false,
        noEmit: true
      })
      const diagnostics = ts.getPreEmitDiagnostics(program)
      const details = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: file => file,
        getCurrentDirectory: () => consumer,
        getNewLine: () => '\n'
      })
      assert.strictEqual(diagnostics.length, 0, `${label}, ${moduleResolution}, interop=${esModuleInterop}\n${details}`)
      assert(program.getSourceFile(path.join(packageDir, 'index.d.ts')), 'Must resolve bundled declarations')
    }
  }
  console.log(`${label}: 6 strict type consumer checks passed`)
}

try {
  const source = Object.fromEntries(packageFiles.map(file => [file, fs.readFileSync(path.join(root, file))]))
  checkConsumer('source', source)

  // Use npm explicitly even when another package manager starts this test.
  // The command is constant; paths go through cwd/env, never shell interpolation.
  const output = execSync('npm pack --ignore-scripts --offline --json', {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, npm_config_pack_destination: temp }
  })
  const [packed] = JSON.parse(output)
  const files = declarationsFromTarball(path.join(temp, packed.filename))
  for (const file of packageFiles) assert.deepStrictEqual(files[file], source[file])
  checkConsumer('packed', files)
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}
