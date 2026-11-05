# 科研端合成开发样例

本目录不含真实论文、人员、录音或模型输出。make-fixture.mjs是可读的样例定义，artifact.json是其序列化结果，符合原PipelineArtifact 2.0。outline.json仅指定已有事实放在哪个栏目，不补写事实。

八条合成事实中，F1–F4应成为来源要点；F5错误泛化、F6不明画面、F7/F8未裁决冲突必须留待核对。两份合成媒体有相同时间段但不同mediaId，不能合并。F4的“下次讨论”只是来源建议，不得填为共同决议、具体任务或日期。

本例用于编排/门禁/CLI回归，不是模型准确率评估。真实材料与模型验证见T62。

从项目根目录重新生成输入：

```powershell
node --input-type=module -e "import fs from 'node:fs'; import {makeFixture} from './tests/fixtures/research-notes/make-fixture.mjs'; fs.writeFileSync('tests/fixtures/research-notes/artifact.json', JSON.stringify(makeFixture(),null,2)+'\n');"
```

运行方式见 [业务B协作入口](../../../docs/工作与科研端协作.md)。所有开发样例只在独立输出目录运行，禁止导入或改写真实用户学习库来制造演示结果。
