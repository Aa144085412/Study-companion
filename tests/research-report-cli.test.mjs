import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runReportCLI} from '../scripts/research-report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifact = path.join(root, 'tests/fixtures/research-notes/artifact.json');
const outline = path.join(root, 'tests/fixtures/research-notes/outline.json');
const run = args => spawnSync(process.execPath, [path.join(root, 'scripts/research-report.mjs'), ...args],
  {encoding: 'utf8', windowsHide: true, timeout: 15000});
function temporary(t) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'research-cli-'));
  t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
  return folder;
}

test('real CLI exports research JSON and Markdown without changing input or requiring a model', t => {
  const folder = temporary(t), out = path.join(folder, '科研 report'), before = fs.readFileSync(artifact);
  const result = run(['--artifact', artifact, '--outline', outline, '--out', out]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).source_items, 4);
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
  assert.equal(report.metrics.pending_items, 4);
  assert.equal(report.sections.find(s => s.id === 'methods').items[0].fact_id, 'F2');
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /证据索引/);
  assert.deepEqual(fs.readFileSync(artifact), before);
});

test('meeting CLI and repeat exports do not fabricate actions and remain byte-stable', t => {
  const folder = temporary(t), dirs = ['first', 'second'].map(name => path.join(folder, name));
  for (const out of dirs) assert.equal(run(['--artifact', artifact, '--template', 'meeting', '--out', out]).status, 0);
  for (const file of ['report.json', 'report.md']) {
    assert.deepEqual(fs.readFileSync(path.join(dirs[0], file)), fs.readFileSync(path.join(dirs[1], file)));
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirs[0], 'report.json'), 'utf8')).action_items, []);
});

test('existing output is refused and all previous files remain intact', t => {
  const folder = temporary(t), marker = path.join(folder, 'keep.txt'); fs.writeFileSync(marker, 'keep');
  const result = run(['--artifact', artifact, '--out', folder]);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /已存在/);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'keep');
  assert.deepEqual(fs.readdirSync(folder), ['keep.txt']);
});

test('invalid JSON, wrong artifact and invalid outline fail before creating output', t => {
  const folder = temporary(t);
  for (const [name, content, isOutline] of [['bad-json', '{', false], ['bad-artifact', '{}', false],
    ['bad-outline', '{"decisions":["F1"]}', true]]) {
    const file = path.join(folder, name + '.json'), out = path.join(folder, name); fs.writeFileSync(file, content);
    const args = ['--artifact', isOutline ? artifact : file, '--out', out];
    if (isOutline) args.push('--outline', file);
    const result = run(args); assert.notEqual(result.status, 0); assert.equal(fs.existsSync(out), false);
  }
});

test('unknown or duplicate arguments and unsupported templates fail without output', t => {
  const folder = temporary(t), out = path.join(folder, 'out');
  for (const extra of [['--publish', 'true'], ['--template', 'invalid'], ['--artifact', artifact], ['--outline']]) {
    assert.notEqual(run(['--artifact', artifact, '--out', out, ...extra]).status, 0);
    assert.equal(fs.existsSync(out), false);
  }
});

test('a partial disk write removes only this invocation files and leaves no half report', t => {
  const folder = temporary(t), out = path.join(folder, 'failed-report');
  const original = fs.writeFileSync;
  let writes = 0;
  const mock = t.mock.method(fs, 'writeFileSync', (fd, content, options) => {
    if (++writes === 2) { fs.writeSync(fd, 'partial'); throw Error('simulated disk write failure'); }
    return original(fd, content, options);
  });
  try {
    assert.throws(() => runReportCLI(['--artifact', artifact, '--out', out]), /disk write failure/);
    assert.equal(fs.existsSync(out), false);
    assert.deepEqual(fs.readdirSync(folder), []);
  } finally { mock.mock.restore(); }
});

test('committed input remains synchronized with its synthetic source definition', async () => {
  const {makeFixture} = await import('./fixtures/research-notes/make-fixture.mjs');
  assert.deepEqual(JSON.parse(fs.readFileSync(artifact, 'utf8')), makeFixture());
});
