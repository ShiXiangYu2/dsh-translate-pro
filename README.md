# 🌐 DSH Translate Pro

> Professional translation for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — 18 target languages, 4 writing styles, terminology control, and whole-file translation with format preservation.

[![dsh-plugin](https://img.shields.io/badge/dsh-plugin-4d7fff)](https://github.com/topics/dsh-plugin) [![DeepSeek Harness](https://img.shields.io/badge/deepseek--harness-plugin-4d7fff)](https://github.com/deepseek-ai/deepseek-harness) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Why this plugin

LLMs can "sort of" translate. **DSH Translate Pro** gives you *professional-grade* translation with controls you can't get from a casual chat prompt:

| Feature | What it does |
|---|---|
| 🌍 **18 target languages** | Chinese, English, Japanese, Korean, French, German, Spanish, Russian, Portuguese, Italian, Arabic, Thai, Vietnamese, Indonesian, Turkish, Hindi, Polish, Dutch |
| 🎭 **4 writing styles** | `formal` / `casual` / `technical` / `literal` — from legal documents to daily chat |
| 📖 **Glossary control** | Pin terminology: `API=应用程序接口, LLM=大语言模型` — consistent terms across every translation |
| 📄 **Whole-file translation** | Translate READMEs, docs, subtitles, code comments **while preserving Markdown, code blocks, URLs, and paths** |
| ✍️ **In-place write-back** | One call translates your file and writes the result back — instant localized docs |
| 🧠 **DeepSeek engine** | Powered by DeepSeek V4-Flash (fast/cheap) or V3.2 (highest quality) via SiliconFlow |
| 🎨 **Conversation cards** | Side-by-side 原文/译文 cards rendered right in the chat stream |

## 📸 Demo

> *Screenshots coming soon — the plugin renders bilingual comparison cards directly in your DSH conversation.*

```
你: 把这段翻译成日语，正式风格：
    "Please find attached the revised contract for your review."

DSH: 🌐 translate → 日语 · formal
    原文: Please find attached the revised contract for your review.
    译文: 修正後の契約書をレビューのため添付しましたので、ご確認ください。
```

## 🚀 Install

### Prerequisite: one free API key

Register at [SiliconFlow](https://cloud.siliconflow.cn) (free credits included) and set the key:

```sh
export SILICONFLOW_API_KEY=sk-xxxxxxxx
```

### Install the plugin

```sh
# From GitHub (no build step needed — ships plain ESM)
dsh plugin --profile demo add github:ShiXiangYu2/dsh-translate-pro

# From npm (prebuilt)
dsh plugin --profile demo add dsh-translate-pro
```

Verify the layer:

```sh
dsh --profile demo --dump-config   # shows a "# == dsh-translate-pro" layer
```

Start and use it:

```sh
SILICONFLOW_API_KEY=sk-xxx dsh --profile demo
```

## 🛠 Tools

### `translate`

Translate text with full control:

| Parameter | Type | Description |
|---|---|---|
| `text` | string (required) | The text to translate |
| `target` | string | Target language (default: 中文) |
| `source` | string | Source language (auto-detected if omitted) |
| `style` | string | `formal` / `casual` / `technical` / `literal` |
| `glossary` | string | Terminology map, e.g. `API=应用程序接口,LLM=大语言模型` |
| `model` | string | `deepseek-ai/DeepSeek-V4-Flash` (default) or `deepseek-ai/DeepSeek-V3.2` |

### `translate_file`

Translate an entire file, preserving its format:

| Parameter | Type | Description |
|---|---|---|
| `path` | string (required) | File to translate (workspace-relative or absolute) |
| `target` | string | Target language (default: 中文) |
| `style` | string | Translation style |
| `glossary` | string | Terminology map |
| `inPlace` | boolean | Write the translation back to the file (default: false) |
| `model` | string | Engine model |

## 💬 Examples

```md
<!-- In your DSH conversation -->

翻译："The quick brown fox jumps over the lazy dog." 到英语 casual 风格

用 translate_file 把 README.md 翻译成中文并写回 (inPlace: true)

把这段 API 文档翻译成日语，术语表：API=API, function=関数
```

## 🧩 Structure

```
dsh-translate-pro/
├── package.json       # declares dsh.bundle
├── cordis.patch.yml   # the layer applied when a profile lists this bundle
└── index.js           # plugin module: translate + translate_file tools
```

## ⚠️ Note

- `inPlace` writes require file write permissions in your dsh profile's sandbox policy.
- Translation is powered by DeepSeek models hosted on SiliconFlow — data is sent to that API.

## 📄 License

MIT
