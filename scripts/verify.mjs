import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = path.join(root, '.venv-ocr', 'Scripts', 'python.exe');
// 工程回归只使用测试注入的模型响应，不继承真实服务商密钥。
const env = {...process.env, PYTHONUTF8:'1', STUDY_LLM_API_KEY:'', STUDY_ASR_API_KEY:''};
const guides = [
  'README.md', 'COLLAB.md', 'docs/协作与阶段交付.md',
  'docs/云端API接入.md', 'docs/阶段交付-2026-10-23.md', 'docs/双人分工与验收.md',
];

function filesIn(directory) {
  return fs.readdirSync(path.join(root, directory), {withFileTypes:true})
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .flatMap(entry => {
      const relative = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(relative) : entry.isFile() ? [relative] : [];
    });
}

function run(label, executable, args, hint = '') {
  const result = spawnSync(executable, args, {cwd:root, env, stdio:'inherit', windowsHide:true});
  if (result.error) throw Error(`${label}无法启动：${result.error.message}`);
  if (result.status !== 0) throw Error(`${label}失败（${result.signal || `退出码 ${result.status}`}）。${hint}`);
}

function checkGuides() {
  let checked = 0;
  for (const guide of guides) {
    const filename = path.join(root, guide);
    for (const match of fs.readFileSync(filename, 'utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
      const relative = decodeURIComponent(target.split('#', 1)[0]);
      const destination = path.resolve(path.dirname(filename), relative);
      if (!fs.existsSync(destination) || !fs.statSync(destination).isFile()) {
        throw Error(`说明链接不存在：${guide} -> ${target}`);
      }
      checked++;
    }
  }
  console.log(`${guides.length} 份当前说明、${checked} 个相对链接通过。`);
}

try {
  if (process.argv.length > 2) throw Error('用法：npm run verify（不接受跳过检查的参数）。');
  if (Number(process.versions.node.split('.')[0]) < 22) throw Error('请使用 Node.js 22 或更新版本。');
  if (!fs.existsSync(python)) {
    throw Error('缺少 .venv-ocr/Scripts/python.exe。请在 Windows PowerShell 的项目目录运行 .\\setup-course.ps1，再运行 npm.cmd run verify；这只安装校验依赖，不下载模型。');
  }

  const started = Date.now();
  console.log(`工程验收：Node ${process.versions.node} / ${process.platform}；根目录 ${root}`);
  console.log('\n[1/5] 校验 Python 3.10+ 与 Pydantic 2.10+ 环境');
  run('Python 环境校验', python, ['-c', "import sys, pydantic; assert sys.version_info >= (3,10), 'Python 3.10+ is required'; assert (2,10) <= tuple(map(int,pydantic.__version__.split('.')[:2])) < (3,0), 'Pydantic >=2.10,<3 is required'; print('Python:', sys.version.split()[0], '| Pydantic:', pydantic.__version__)"], '请在 Windows PowerShell 运行 .\\setup-course.ps1 后重试。');

  console.log('\n[2/5] 检查应用、模块、脚本及 Node 测试的语法');
  const sourceFiles = ['server.mjs', ...['public', 'src', 'scripts', 'tests'].flatMap(filesIn)]
    .filter(filename => /\.(mjs|js)$/.test(filename));
  for (const filename of sourceFiles) run(`语法检查 ${filename}`, process.execPath, ['--check', filename]);
  console.log(`${sourceFiles.length} 个 JavaScript 文件通过。`);

  console.log('\n[3/5] 检查当前接手说明的相对链接');
  checkGuides();

  console.log('\n[4/5] 顺序执行 Node 回归（使用独立临时数据）');
  const nodeTests = filesIn('tests').filter(filename => filename.endsWith('.test.mjs'));
  if (!nodeTests.length) throw Error('没有发现 Node 测试，不能视为通过。');
  run('Node 回归', process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=spec', ...nodeTests]);

  console.log('\n[5/5] 执行 Python 回归');
  run('Python 回归', python, ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py']);
  console.log(`\n工程验收通过，用时 ${((Date.now() - started) / 1000).toFixed(1)} 秒。`);
  console.log('模型响应为协议模拟；真实服务商、课程内容质量及人工审核仍需另行验收。');
} catch (error) {
  console.error(`\n工程验收未通过：${error.message}`);
  process.exitCode = 1;
}
