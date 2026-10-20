# Study Companion × DeepTutor：真实课程驱动的迭代

2026-10-20；测试课程 BV19W4y1X79X。用户提供的《全链路重构与开发指南》作为目标规范。

## 第一轮 T35
补齐 B站 UI/API/下载器入口，复用 yt-dlp，不另造下载器。
URL 视频管线使用持久化上传与 ASR 队列；取消 32 MB 静默跳过，保留失败状态、时间戳与回放关系。
复跑复用媒体哈希与有效转写；250 MB 上传上限仍存在，超限明确报错。
先定义 Pydantic 协议，适配层输出 raw-document.json，时间统一为秒（原库为毫秒）。
安装依赖：tools/.venv-dl/Scripts/python.exe -m pip --python .venv-ocr/Scripts/python.exe install -r requirements-course.txt

## 后续可验收模块
1. T13：全篇分段蒸馏、稳定来源映射；用本课尾部序列比对问题检验覆盖率，不能仅靠提高截断预算。
2. 视频关键帧：保留准确帧时间、OCR/VLM 输出和语音冲突；未识别不能伪造 visual_description。当前 raw-document 只含 ASR，抽帧不等于已理解画面。
3. DeepTutor：独立 prompts.py；每次一道题，回答后反馈，持久化 LearningSession 和 KnowledgeMastery；重启后恢复进度。当前只有协议，未实现引擎，未接入外部 DeepTutor 项目。
4. Skill 编译：独立提示词与 SKILL.md 目录包，保留来源和待核对项。来源缺失的数字不补猜，待核对草稿不能标成已验证 SOP。

## 工程边界
保留现有 Node 服务和 Python worker，渐进适配，不一次性重写。
普通质粒课程不能直接充当 100 kb YAC/BAC 的操作依据。
所有 LLM 提示词与配置在相应模块实现时抽离；本轮没有新增模型调用。
自动测试使用独立数据目录；真实课程现有笔记与资料不覆盖。

## 本地视频入口（保留）
唧唧Down（C:/Program Files/JiJiDown）下载得到合并后的 MP4 → 学习资料 → 导入资料 → 转成文字。也可导入 MP3/M4A/WAV/WebM/OGG 与 SRT；媒体单文件上限 250 MB。无需启动下载软件或配置网络抓取。
