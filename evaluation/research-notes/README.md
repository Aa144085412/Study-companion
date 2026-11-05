# 科研端首阶段开发回归

负责人：cmccjiang（业务B，Codex代执行）。本目录全部是去标识合成开发产出，输入来自 [固定样例](../../tests/fixtures/research-notes/README.md)，不是实际论文、组会或模型效果评估。

## 本例预期

- 输入8条事实；F1–F4为来源要点，F5错误泛化、F6不明视觉、F7/F8冲突共4条留待核对。
- 科研模板依据显式outline组织问题/方法/结果，未指定的讲者建议留在来源要点；会议模板不猜研究栏目。
- 决议与行动项为空，责任人/日期不自动生成；文献元数据未核验。原管线审阅状态只作既有来源记录。
- 相同时间、不同媒体保留两条独立索引；原秒范围12.375–19.125转换为12375–19125毫秒，无真实视频。

## 运行

在项目根目录生成到新的输出目录后，与本目录文件进行字节比对。CLI不会覆盖已有报告。

```powershell
node scripts/research-report.mjs --artifact tests/fixtures/research-notes/artifact.json --outline tests/fixtures/research-notes/outline.json --out ../research-demo-check
node scripts/research-report.mjs --artifact tests/fixtures/research-notes/artifact.json --template meeting --out ../meeting-demo-check
node --test --test-concurrency=1 tests/research-notes.test.mjs tests/research-report-cli.test.mjs
```

原项目PipelineArtifact契约校验（使用已安装Pydantic的Python）：

```powershell
.\.venv-ocr\Scripts\python.exe scripts/validate_pipeline.py pipeline tests/fixtures/research-notes/artifact.json
```

专项检查覆盖来源门禁、缺失/重复审计、无效引用、原文与清洗文本、冲突、视觉风险、时间/媒体、Markdown转义、输入不变、确定性、新目录保护和部分写入失败回滚。实际回归结果、环境和提交见 [T60记录](../../docs/任务进入记录/2026-10-26-T60.md)。

本期开发回归不统计真实内容准确率，未运行真实模型或留出材料；T61网页按钮、来源跳转与报告版本已在任务分支完成。T62提供的真实记录模板和汇总工具见[验收说明](T62-真实材料验收说明.md)，但真实服务、获准材料和人工复核尚未提供，任务保持blocked。旧T44/T41等公共任务不据此关闭。
