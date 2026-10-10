# 交接提示词：小红书图文爬取（给 Codex 接管）

> 用法：整段复制给 Codex。目标 = 完成「小红书关键词爬取 → 图文落盘 → OCR → 导入研习伴」，重点先解决当前 `goto` 超时卡点。

---

## 任务目标
用 MediaCrawler 爬 3 个小红书关键词的**图文帖**（非视频），下载每篇的图片到 `data/xhs/media/{内容ID}/`，并产出 jsonl 元数据。关键词已配置：`大肠杆菌转化,菌种活化,PCR 实验`，`CRAWLER_MAX_NOTES_COUNT=8`。之后把每篇图片目录交给 OCR worker 出 markdown，再导入研习伴（`POST /api/sources`，kind:'text'）。

## 环境与路径（Windows，交互式桌面用户 = ziming，家目录在 C:\Users\a1440）
- 仓库：`C:\Users\a1440\Desktop\MediaCrawler`（已克隆，含 venv `.venv-mc`，Python 3.11）
- 浏览器二进制：`C:\Users\a1440\Desktop\MediaCrawler\.pw-browsers`
- 运行命令（**必须**先设 PLAYWRIGHT_BROWSERS_PATH）：
  ```
  $env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\a1440\Desktop\MediaCrawler\.pw-browsers'; Set-Location C:\Users\a1440\Desktop\MediaCrawler; .\.venv-mc\Scripts\python.exe main.py
  ```

## 配置现状（`config/base_config.py` 已设好，无需再改）
`PLATFORM="xhs"`；`LOGIN_TYPE="qrcode"`；`CRAWLER_TYPE="search"`；`ENABLE_CDP_MODE=True`；`CDP_CONNECT_EXISTING=False`（让 MC 自己启 Edge，独立档案，别连用户已开的浏览器——Windows Edge 后台进程会抢默认档案锁、吞 9222 端口）；`CDP_DEBUG_PORT=9222`；`CUSTOM_BROWSER_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`；`SAVE_LOGIN_STATE=True`（首次扫码后记住登录，之后免扫码）；`ENABLE_GET_MEDIA=True`；`SAVE_DATA_OPTION="jsonl"`。

## 当前卡点（必须先修，否则爬不起来）
`media_platform/xhs/core.py:104`：
```python
await self.context_page.goto(self.index_url)
```
默认 `wait_until="load"` + 30s 超时。小红书首页有个慢/卡住的子资源，`load` 事件 30s 内不触发 → 报 `playwright._impl._errors.TimeoutError: Page.goto: Timeout 30000ms exceeded`（已实测连现 2 次）。
**修法（二选一或都做）**：
- 改成 `await self.context_page.goto(self.index_url, wait_until="domcontentloaded")`（HTML 解析完即继续，不等全部图片/脚本），再
- `self.context_page.set_default_timeout(90000)`（或更长）放在 goto 之前，给后续元素等待留余量。
改完重跑即进入登录流程。

## 登录流程（改完 goto 后会走到）
新档案 `browser_data/cdp_xhs_user_data_dir` 未登录 → MC 弹出一个 Edge 窗口并显示**小红书二维码**（同时打印到终端）。**需要人用手机小红书 App 扫码并在手机确认**。`check_login_state` 最多等 600 次×1s ≈ **10 分钟**（`stop_after_attempt(600), wait_fixed(1)`；日志里 "remaining time is 120s" 是误导文案，实际 10 分钟）。扫码成功后 `SAVE_LOGIN_STATE` 把登录写进该档案 → 之后重跑免扫码。

⚠️ 为什么不能走 cookie：用户主 Edge 档案里小红书 `web_session` cookie **值为空**（会话已过期），抽 cookie 免扫码路线不可行。仓库里有 `extract_xhs_cookie.py`（DPAPI+AES 解密，读临时副本不传外），若用户之后在主 Edge 重新登录小红书，可先跑它确认 `web_session` 非空再切 `LOGIN_TYPE="cookie"`；当前一律用扫码。

## 爬取成功后（接 OCR + 导入）
- 图文落到 `C:\Users\a1440\Desktop\MediaCrawler\data\xhs/media/{内容ID}/`，jsonl 在 `data/xhs/`。
- OCR worker：`C:\Users\a1440\Desktop\Study companion\ocr_worker.py`（RapidOCR，JSON-lines stdout：loading/progress/result；按文件名自然序读图拼 markdown）。用法：`ocr_worker.py <image_dir> [--out <file.md>] [--label "图"] [--title "标题"]`。
- 导入研习伴：`POST /api/sources`（kind:'text'，正文 ≤200000 字符）→ `evidence(notebookId)` → 共读/草稿。
- ⚠️ 研习伴后端**勿长期双开**共享 `data/` store 的进程。

## 交付/验收
- 三个关键词各有图文落盘（jsonl 可查），图片目录非空。
- 至少 1 篇跑通 `ocr_worker.py` → markdown，并成功 `POST /api/sources` 导入，研习伴里能看到该资料并可共读/出草稿。
- 诚实声明：登录需人扫码一次；若风控（滑块/验证）出现，如实上报，不要静默绕过。
