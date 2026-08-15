import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'translate-plugin'
export const inject = ['tools']

const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V4-Flash'
const QUALITY_MODEL = 'deepseek-ai/DeepSeek-V3.2'

const LANGS = ['中文', '英语', '日语', '韩语', '法语', '德语', '西班牙语', '俄语', '葡萄牙语', '意大利语', '阿拉伯语', '泰语', '越南语', '印尼语', '土耳其语', '印地语', '波兰语', '荷兰语']

const STYLES = {
  formal: '正式、书面、专业',
  casual: '自然、口语化',
  technical: '技术文档风格，保留术语',
  literal: '贴近原文的直译',
}

async function callTranslate(ctx, prompt) {
  const shell = ctx.get('shell')
  if (shell === undefined) return { ok: false, error: 'shell service unavailable' }
  const body = JSON.stringify(prompt)
  const spec = shell.resolve({
    command: `curl -s --max-time 120 -X POST https://api.siliconflow.cn/v1/chat/completions -H "Authorization: Bearer ${process.env.SILICONFLOW_API_KEY}" -H 'Content-Type: application/json' -d @-`,
    stdin: body,
    timeoutMs: 130000,
  })
  const result = await shell.run(spec)
  if (result.exitCode !== 0) {
    return { ok: false, error: `curl failed (exit ${result.exitCode}). ${result.stderr.text}` }
  }
  try {
    const data = JSON.parse(result.stdout.text)
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return { ok: true, content: data.choices[0].message.content, model: data.model }
    }
    return { ok: false, error: JSON.stringify(data) }
  } catch (e) {
    return { ok: false, error: `cannot parse response: ${result.stdout.text.slice(0, 400)}` }
  }
}

async function translateText(ctx, args) {
  const target = args.target || '中文'
  const sourceLang = args.source ? `源语言是${args.source}。` : '自动检测源语言。'
  const glossary = args.glossary ? `\n术语表（必须严格遵守）：${args.glossary}` : ''
  const system = `You are a professional translator. ${sourceLang}将文本翻译成${target}。风格：${STYLES[args.style] || STYLES.formal}。${glossary}\n输出格式（严格遵守）：\n原文：<原文>\n译文：<译文>\n只输出这两行，不要任何解释。`
  const prompt = {
    model: args.model || DEFAULT_MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: args.text }],
    max_tokens: 2000,
    temperature: 0.3,
  }
  const r = await callTranslate(ctx, prompt)
  if (!r.ok) return r
  return { ok: true, content: r.content }
}

async function translateFile(ctx, args) {
  const fs = ctx.get('fs')
  if (fs === undefined) return { ok: false, error: 'fs service unavailable' }
  const target = args.target || '中文'
  const targetResolved = await fs.resolve(args.path)
  const content = await fs.readText(targetResolved)
  const glossary = args.glossary ? `\n术语表（必须严格遵守）：${args.glossary}` : ''
  const system = `You are a professional document translator. 将整个文档翻译成${target}。风格：${STYLES[args.style] || STYLES.formal}。${glossary}\n严格要求：\n1. 保持原文的标记格式不变（Markdown 标题/列表/引用/代码块、注释符号等）。\n2. 代码块、命令行、URL、文件路径、变量名、包名一律不翻译。\n3. 只输出翻译后的完整文档，不要任何解释或额外文字。`
  const prompt = {
    model: args.model || DEFAULT_MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content }],
    max_tokens: Math.min(16000, Math.max(2000, Math.ceil(content.length * 1.5))),
    temperature: 0.3,
  }
  const r = await callTranslate(ctx, prompt)
  if (!r.ok) return r
  const translated = r.content.trim()
  if (args.inPlace) {
    await fs.writeText(targetResolved, translated)
    return { ok: true, content: `译文：\n${translated}\n\n（已写回 ${args.path}）` }
  }
  return { ok: true, content: `原文：\n${content}\n\n译文：\n${translated}` }
}

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'translate',
    description: 'Professional translation with controllable style and terminology. Supports 18 target languages, 4 styles (formal/casual/technical/literal), and optional glossary for consistent terminology. Powered by DeepSeek via SiliconFlow.',
    parameters: {
      text: { type: 'string', required: true, description: 'The text to translate.' },
      target: { type: 'string', enum: LANGS, description: 'Target language. Default: 中文.' },
      source: { type: 'string', description: 'Source language (optional; auto-detected when omitted).' },
      style: { type: 'string', enum: ['formal', 'casual', 'technical', 'literal'], description: 'Translation style. Default: formal.' },
      glossary: { type: 'string', description: 'Optional glossary for consistent terminology, e.g. "API=应用程序接口,LLM=大语言模型".' },
      model: { type: 'string', enum: [DEFAULT_MODEL, QUALITY_MODEL], description: 'Engine model. V4-Flash (fast/cheap) or V3.2 (highest quality).' },
    },
    async execute(args) {
      if (!process.env.SILICONFLOW_API_KEY) {
        return 'translate: SILICONFLOW_API_KEY environment variable is not set. Set it before starting dsh.'
      }
      const r = await translateText(ctx, args)
      return r.ok ? r.content : `translate: API error: ${r.error}`
    },
  }))

  ctx.tools.register(defineTool({
    name: 'translate_file',
    description: 'Translate an entire file (README, docs, subtitles, code comments) while preserving its format. Keeps code blocks, commands, URLs, paths, and identifiers untranslated. Can write back in place.',
    parameters: {
      path: { type: 'string', required: true, description: 'Path to the file to translate (relative to workspace or absolute).' },
      target: { type: 'string', enum: LANGS, description: 'Target language. Default: 中文.' },
      style: { type: 'string', enum: ['formal', 'casual', 'technical', 'literal'], description: 'Translation style. Default: formal.' },
      glossary: { type: 'string', description: 'Optional glossary, e.g. "API=应用程序接口".' },
      inPlace: { type: 'boolean', description: 'Write the translation back to the file (default false: return both original and translation).' },
      model: { type: 'string', enum: [DEFAULT_MODEL, QUALITY_MODEL], description: 'Engine model.' },
    },
    async execute(args) {
      if (!process.env.SILICONFLOW_API_KEY) {
        return 'translate_file: SILICONFLOW_API_KEY environment variable is not set. Set it before starting dsh.'
      }
      try {
        const r = await translateFile(ctx, args)
        return r.ok ? r.content : `translate_file: API error: ${r.error}`
      } catch (e) {
        return `translate_file: error: ${String(e && e.message ? e.message : e).slice(0, 300)}`
      }
    },
  }))
}
