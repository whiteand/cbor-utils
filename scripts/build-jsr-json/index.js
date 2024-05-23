import assert from "node:assert";
import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd();

function rel(from, to) {
  const res = path.relative(from, to)
  if (res[0] !== '.') {
    return './' + res
  }
  return res
}

async function main() {
    /**
     * @type {import('../../package.json')}
     */
    const packageJson = await fs.readFile(path.resolve(rootDir, './package.json'), 'utf-8').then(x => JSON.parse(x))
    const entryFiles = packageJson.tsup.entry;
    
    assert.equal(entryFiles.length, 1);
    
    const entryFilePath = rel(rootDir, path.resolve(rootDir, entryFiles[0]))
    
    const jsrJson = {
      name: "@whiteand/cbor",
      version: packageJson.version,
      exports: entryFilePath,
    };

    console.log(JSON.stringify(jsrJson, null, 2));
}


main()