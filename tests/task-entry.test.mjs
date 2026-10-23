import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTasks, inspectTaskProgress} from '../scripts/check-task-entry.mjs';

test('entry scan reads original heading and legacy bullet task formats', () => {
  const items = parseTasks('## T44 · 质量\n- status: open · owner: Codex\n## 待认领（open）\n- **T12 · OCR** — `open` · owner: 待确认\n');
  assert.deepEqual(items.map(({id, status}) => [id, status]), [['T44', 'open'], ['T12', 'open']]);
});
test('legacy tasks under the completed section keep their historical completion', () => {
  const result = inspectTaskProgress('## 已完成（done）\n- **T6 · 备份** — 历史已上传\n- **T1 · 删除** — 已验证\n', 'T1 和 T6 保留历史');
  assert.equal(result.errors.length, 0);
  assert.ok(result.tasks.every(item => item.status === 'done'));
});
test('a task at the end of a long file is not mistaken for an omission', () => {
  const text = '## T1 · 首项\n- status: done\n' + '\n历史说明\n'.repeat(1000) + '## T49 · 末尾任务\n- status: done\n';
  assert.deepEqual(inspectTaskProgress(text, '当前 T49').missing, []);
});
test('context task references without a definition stop task entry', () => {
  const result = inspectTaskProgress('## T1 · 首项\n- status: done\n', '先检查 T1，再接手 T44');
  assert.deepEqual(result.missing, ['T44']);
  assert.ok(result.errors.length);
});
test('conflicting duplicate task definitions cannot silently replace one another', () => {
  const result = inspectTaskProgress('## T44 · 旧记录\n- status: done\n## T44 · 新记录\n- status: open\n', 'T44');
  assert.deepEqual(result.duplicates, ['T44']);
  assert.ok(result.errors.length);
});
test('a worker cannot enter a task owned by the other worker', () => {
  const result = inspectTaskProgress('## T57 · 检查\n- status: doing · owner: 工作者A/Codex · branch: codex/main-task-review\n', 'T57', {task:'T57', owner:'工作者B'});
  assert.ok(result.errors.some(item => item.includes('不一致')));
});
test('completed and unclaimed tasks require an explicit new claim before execution', () => {
  for (const status of ['open', 'blocked', 'done']) {
    const result = inspectTaskProgress(`## T44 · 质量\n- status: ${status} · owner: Codex\n`, 'T44', {task:'T44', owner:'Codex'});
    assert.ok(result.errors.length, status);
  }
});
test('an open task on user hold cannot be restarted by changing the worker name', () => {
  const text = '## T45 · 产品化\n- status: open · owner: Codex\n- hold: true · 用户要求暂停\n';
  assert.ok(inspectTaskProgress(text, 'T45', {task:'T45', owner:'Codex'}).errors.some(item => item.includes('暂停')));
  assert.equal(inspectTaskProgress(text, 'T45').tasks[0].status, 'open');
});
test('a claimed task passes only for the exact owner without changing the files', () => {
  const text = '## T57 · 检查\n- status: doing · owner: 工作者A/Codex · branch: codex/main-task-review\n';
  const result = inspectTaskProgress(text, 'T57', {task:'T57', owner:'工作者A/Codex'});
  assert.deepEqual(result.errors, []);
  assert.equal(result.selected.branch, 'codex/main-task-review');
});
test('branch completion remains visibly separate from availability in main', () => {
  const result = inspectTaskProgress('## T51 · 云端接入\n- status: done · owner: Codex\n- integration: branch-only\n', 'T51');
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some(item => item.includes('尚未集成')));
});
