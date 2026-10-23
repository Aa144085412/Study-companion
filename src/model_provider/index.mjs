import fs from 'node:fs';
import path from 'node:path';

const fail = (message, status = 400) => Object.assign(new Error(message), {status});

export function providerURL(value, mode = 'local') {
  let u;
  try { u = new URL(String(value)); } catch { throw fail('请填写有效的 API 基础地址'); }
  if (u.username || u.password || u.search || u.hash) throw fail('API 地址不能包含账号、密码、查询参数或片段；密钥请填在单独的输入框');
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname);
  if (mode === 'cloud') {
    if (u.protocol !== 'https:' || loopback) throw fail('云端 API 仅接受 HTTPS 服务商地址');
  } else if (u.protocol !== 'http:' || !loopback) {
    throw fail('本地模式仅接受 http://127.0.0.1、localhost 或 [::1] 地址；云端接口请先选择云端模式');
  }
  const base = u.href.replace(/\/+$/, '');
  if (/\/(chat\/completions|audio\/transcriptions|models|responses)$/.test(u.pathname.replace(/\/+$/, ''))) {
    throw fail('请填写 API 基础地址，例如以 /v1 结尾的地址，不要填写完整的调用路径');
  }
  return base;
}

export function normalizeSettings(input = {}, previous = {}) {
  const x = {...previous, ...input};
  const llmMode = x.llmMode === 'cloud' ? 'cloud' : 'local';
  const asrMode = x.asrMode === 'cloud' ? 'cloud' : 'local';
  return {
    llmMode, llmUrl: providerURL(x.llmUrl || 'http://127.0.0.1:1234/v1', llmMode),
    model: String(x.model ?? '').trim().slice(0, 200),
    cloudImagesEnabled: x.cloudImagesEnabled === true || x.cloudImagesEnabled === 'on',
    asrEngine: x.asrEngine === 'external' ? 'external' : 'builtin',
    asrMode, asrUrl: providerURL(x.asrUrl || 'http://127.0.0.1:8000/v1', asrMode),
    asrModel: String(x.asrModel ?? 'whisper-1').trim().slice(0, 200),
    ttsVoice: /^zh-/.test(x.ttsVoice || '') ? x.ttsVoice : 'zh-CN-XiaoxiaoNeural'
  };
}

export function createProvider({dataDir, fetchImpl = fetch, env = process.env}) {
  const secretsPath = path.join(dataDir, 'api-secrets.json');
  let secrets = fs.existsSync(secretsPath) ? JSON.parse(fs.readFileSync(secretsPath, 'utf8')) : {};
  const envKey = kind => String(env[kind === 'llm' ? 'STUDY_LLM_API_KEY' : 'STUDY_ASR_API_KEY'] || '').trim();
  function credential(kind, settings) {
    const override = envKey(kind);
    if (override) return {key: override, source: 'environment'};
    const entry = secrets[kind];
    return entry?.url === settings[kind + 'Url'] && entry.key
      ? {key: entry.key, source: 'local'} : {key: '', source: 'none'};
  }
  function status(settings) {
    const out = {};
    for (const kind of ['llm', 'asr']) {
      const c = credential(kind, settings);
      out[kind + 'KeyConfigured'] = !!c.key;
      out[kind + 'KeySource'] = c.source;
    }
    return out;
  }
  function updateSecrets(settings, input) {
    const next = {...secrets};
    for (const kind of ['llm', 'asr']) {
      const key = String(input[kind + 'ApiKey'] ?? '').trim();
      if (key.length > 4096 || /[\r\n]/.test(key)) throw fail('API 密钥格式无效');
      if (input[kind + 'ClearKey'] === true || input[kind + 'ClearKey'] === 'on') delete next[kind];
      else if (key) next[kind] = {url: settings[kind + 'Url'], key};
      else if (next[kind]?.url !== settings[kind + 'Url']) delete next[kind];
    }
    fs.writeFileSync(secretsPath + '.tmp', JSON.stringify(next), {mode: 0o600});
    fs.renameSync(secretsPath + '.tmp', secretsPath);
    secrets = next;
  }
  async function request(kind, settings, pathname, payload, {timeoutMs = 120000, signal, method = 'POST'} = {}) {
    const mode = settings[kind + 'Mode'] || 'local';
    const base = providerURL(settings[kind + 'Url'], mode);
    const {key} = credential(kind, settings);
    if (mode === 'cloud' && !key) throw fail('请先为所选云端接口填写 API 密钥并保存');
    if (kind === 'llm' && mode === 'cloud' && payload && !(payload instanceof FormData)) {
      const hasImage = payload.messages?.some(m => Array.isArray(m.content) && m.content.some(part => part.type === 'image_url'));
      if (hasImage && !settings.cloudImagesEnabled) throw fail('请先在设置中允许向所选云端模型发送图片');
      // Local inference servers accept this extension; compatible cloud APIs may reject it.
      payload = {...payload};
      delete payload.chat_template_kwargs;
    }
    const headers = {};
    if (key) headers.Authorization = 'Bearer ' + key;
    if (payload !== undefined && !(payload instanceof FormData)) headers['Content-Type'] = 'application/json';
    const label = (mode === 'cloud' ? '云端' : '本地') + (kind === 'llm' ? '语言模型' : '语音识别');
    let response;
    try {
      response = await fetchImpl(base + pathname, {
        method, headers, redirect: 'error',
        body: payload === undefined ? undefined : payload instanceof FormData ? payload : JSON.stringify(payload),
        signal: AbortSignal.any([AbortSignal.timeout(timeoutMs), signal].filter(Boolean))
      });
    } catch (e) {
      if (signal?.aborted) throw fail('请求已取消', 499);
      if (e.name === 'TimeoutError' || e.name === 'AbortError' || e.cause?.code === 'UND_ERR_HEADERS_TIMEOUT') {
        throw fail(`${label}在 ${timeoutMs / 1000} 秒内未完成请求；已完成分批保留，可重试继续。`, 504);
      }
      throw fail(`无法连接${label}接口，请检查地址、网络与服务状态。不会自动切换服务商。`, 502);
    }
    if (!response.ok) {
      const advice = response.status === 401 || response.status === 403 ? '请检查密钥及模型访问权限'
        : response.status === 429 ? '请检查服务商的配额或频率限制，稍后重试'
        : '请检查模型名称、接口协议和服务商支持的参数';
      throw fail(`${label}接口返回 HTTP ${response.status}，${advice}。`, 502);
    }
    try { return await response.json(); } catch { throw fail(`${label}接口未返回有效 JSON，请核对 API 地址。`, 502); }
  }
  return {request, status, updateSecrets};
}
