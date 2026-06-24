const { readFileSync, writeFileSync } = require('node:fs');
const { join, relative } = require('node:path');

const rootDir = join(__dirname, '..');
const lcovPath = join(rootDir, 'coverage', 'rust-lcov.info');

const content = readFileSync(lcovPath, 'utf8');

const fixed = content
  .split('\n')
  .map((line) => {
    if (!line.startsWith('SF:'))
      return line;

    return `SF:${relative(rootDir, line.slice(3))}`;
  })
  .join('\n');

writeFileSync(lcovPath, fixed);
