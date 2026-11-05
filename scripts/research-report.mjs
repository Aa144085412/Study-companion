import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildResearchReport} from '../src/research_notes/index.mjs';
import {renderResearchReport} from '../src/research_notes/render.mjs';

const usage = '用法：node scripts/research-report.mjs --artifact artifact.json --out 新目录 [--template research|meeting] [--outline outline.json]';

function readJSON(file) {
  if (!fs.statSync(file).isFile() || fs.statSync(file).size > 16 * 1024 * 1024) throw Error('输入必须是16 MiB以内的JSON文件');
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

export function runReportCLI(argv) {
  const options = {};
  if (argv.length === 1 && argv[0] === '--help') { console.log(usage); return; }
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!['--artifact', '--out', '--template', '--outline'].includes(key) || !argv[i + 1] ||
        argv[i + 1].startsWith('--') || Object.hasOwn(options, key)) throw Error(usage);
    options[key] = argv[i + 1];
  }
  if (!options['--artifact'] || !options['--out']) throw Error(usage);
  const artifactPath = path.resolve(options['--artifact']), output = path.resolve(options['--out']);
  if (fs.existsSync(output)) throw Error('输出目录已存在；请指定新目录，避免覆盖旧报告或用户数据');
  // Validate and render everything before creating output. No network, model or store access.
  const report = buildResearchReport(readJSON(artifactPath), {
    template: options['--template'] || 'research', outline: options['--outline'] ? readJSON(options['--outline']) : {},
  });
  const payloads = [['report.json', JSON.stringify(report, null, 2) + '\n'], ['report.md', renderResearchReport(report)]];
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.mkdirSync(output); // Exclusive ownership; never replace an existing output directory.
  const written = [];
  try {
    for (const [name, content] of payloads) {
      const file = path.join(output, name);
      const fd = fs.openSync(file, 'wx');
      written.push(file);
      try { fs.writeFileSync(fd, content, 'utf8'); }
      finally { fs.closeSync(fd); }
    }
  } catch (error) {
    for (const file of written) fs.unlinkSync(file);
    try { fs.rmdirSync(output); } catch { /* Preserve any file not created by this invocation. */ }
    throw error;
  }
  console.log(JSON.stringify({report_id: report.report_id, template: report.template,
    source_items: report.metrics.source_items, pending_items: report.metrics.pending_items, output}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runReportCLI(process.argv.slice(2)); }
  catch (error) { console.error(`科研报告未生成：${error.message}`); process.exitCode = 1; }
}
