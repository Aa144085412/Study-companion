import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const statuses = new Set(['open', 'doing', 'blocked', 'done']);

// 兼容主项目原有的标题任务与粗体列表任务，检查整份文件而非仅顶部。
export function parseTasks(markdown) {
  const result = [];
  let current, inherited;
  function finish() {
    if (!current) return;
    const text = current.lines.join('\n');
    const explicit = text.match(/^-\s*status:\s*(\w+)/m)?.[1];
    const inline = current.lines[0].match(/—\s*`?(open|doing|blocked|done)\b/)?.[1];
    result.push({id:current.id, line:current.line, status:explicit || inline || current.inherited || null,
      owner:text.match(/\bowner:\s*([^·\r\n]+)/)?.[1].trim() || '',
      branch:text.match(/\bbranch:\s*([^·\r\n]+)/)?.[1].trim() || '',
      hold:/^-\s*hold:\s*true\b/m.test(text),
      integration:text.match(/^-\s*integration:\s*([^·\r\n]+)/m)?.[1].trim() || ''});
    current = undefined;
  }
  markdown.split(/\r?\n/).forEach((line, index) => {
    const task = line.match(/^##\s+(T\d+[a-z]?)\s*[·:：—-]/i)
      || line.match(/^-\s+\*\*(T\d+[a-z]?)\s*[·:：—-]/i);
    if (task) {
      finish(); current = {id:task[1], line:index + 1, lines:[line], inherited};
    } else if (/^##\s/.test(line)) {
      finish();
      inherited = /已完成/.test(line) ? 'done' : /待认领/.test(line) ? 'open' : /阻塞/.test(line) ? 'blocked' : undefined;
    } else if (current) current.lines.push(line);
  });
  finish();
  return result;
}

export function inspectTaskProgress(tasksText, contextText, {task, owner} = {}) {
  const tasks = parseTasks(tasksText), errors = [], warnings = [];
  const counts = new Map();
  for (const item of tasks) counts.set(item.id, (counts.get(item.id) || 0) + 1);
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([id]) => id);
  const refs = [...new Set(contextText.match(/\bT\d+[a-z]?\b/g) || [])];
  const missing = refs.filter(id => !counts.has(id));
  if (!tasks.length) errors.push('TASKS.md 没有可识别的任务定义。');
  if (duplicates.length) errors.push(`任务重复定义：${duplicates.join(', ')}。请合并状态记录，保留历史依据。`);
  if (missing.length) errors.push(`CONTEXT.md 引用了未登记任务：${missing.join(', ')}。请先核对遗漏。`);
  for (const item of tasks) {
    if (!statuses.has(item.status)) errors.push(`${item.id} 缺少有效状态（第${item.line}行）。`);
    if (item.status === 'doing' && !item.owner) errors.push(`${item.id} 正在进行，但没有 owner。`);
    if (item.hold) warnings.push(`${item.id} 已暂停；不能因状态仍为 open 而自动认领。`);
    if (item.integration === 'branch-only') warnings.push(`${item.id} 仅在任务分支完成，尚未集成 main。`);
  }
  const selected = task ? tasks.find(item => item.id === task) : undefined;
  if (task) {
    if (!selected) errors.push(`任务 ${task} 未登记。`);
    else if (selected.hold) errors.push(`${task} 已暂停，需用户明确恢复后才能执行。`);
    else if (selected.status !== 'doing') errors.push(`${task} 当前为 ${selected.status}；开工前需核查并认领为 doing，已完成任务不能重复认领。`);
    else if (!owner || selected.owner !== owner) errors.push(`${task} 当前 owner 为“${selected.owner}”；与执行者“${owner || '未提供'}”不一致。`);
  }
  return {tasks, missing, duplicates, errors, warnings, selected};
}

function git(root, args, required = true) {
  const result = spawnSync('git', args, {cwd:root, encoding:'utf8', windowsHide:true});
  if (result.error || result.status !== 0) {
    if (required) throw Error(`无法读取 Git 状态：git ${args.join(' ')}。请先检查仓库和 origin/main。`);
    return null;
  }
  return result.stdout.trim();
}

export function runEntryCheck(argv = process.argv.slice(2)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  let task, owner;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) task = argv[++i];
    else if (argv[i] === '--owner' && argv[i + 1]) owner = argv[++i];
    else throw Error('用法：npm run task:check [-- --task T编号 --owner "TASKS中的准确owner"]');
  }
  for (const file of ['TASKS.md', 'CONTEXT.md', 'COLLAB.md', 'AGENTS.md', 'docs/任务进入检查.md']) {
    if (!fs.existsSync(path.join(root, file))) throw Error(`缺少接手文件 ${file}。`);
  }
  const report = inspectTaskProgress(fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8'),
    fs.readFileSync(path.join(root, 'CONTEXT.md'), 'utf8'), {task, owner});
  const branch = git(root, ['branch', '--show-current']);
  const main = git(root, ['rev-parse', 'origin/main']);
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], {cwd:root, windowsHide:true});
  if (ancestor.error || ancestor.status !== 0) report.errors.push('当前分支未包含本机已获取的 origin/main，请先检查并同步主项目，再开工。');
  if (git(root, ['diff', '--name-only', '--diff-filter=U'])) report.errors.push('存在未解决的合并冲突，不能进入任务。');
  if (git(root, ['status', '--porcelain'])) report.warnings.push('存在未提交文件；先确认归属，不覆盖、不自动清理。');
  console.log(`任务进入检查：branch=${branch || '(detached)'}；origin/main=${main.slice(0, 12)}`);
  console.log(`已扫描整份 TASKS.md：${report.tasks.length} 项；未登记引用 ${report.missing.length}；重复定义 ${report.duplicates.length}。`);
  console.log('未完成/暂停任务：' + report.tasks.filter(item => item.status !== 'done' || item.hold)
    .map(item => `${item.id}=${item.hold ? '暂停' : item.status}(${item.owner || '待认领'})`).join('；'));
  for (const warning of report.warnings) console.log(`提示：${warning}`);
  for (const error of report.errors) console.error(`未通过：${error}`);
  if (report.errors.length) return 1;
  console.log(task ? `进入检查通过：${task} / ${owner}。仍须将本轮核查记录写入 Markdown 后开始实现。`
    : '进度扫描通过。请阅读原框架与遗漏台账，认领任务后用 --task 和 --owner 再核对；本命令不自动认领或修改任务。');
  console.log('本命令只读本地 Git 与 Markdown；执行前由执行者 git fetch origin，不能据此声称远端没有新变化。');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runEntryCheck(); }
  catch (error) { console.error(`任务进入检查未通过：${error.message}`); process.exitCode = 1; }
}
