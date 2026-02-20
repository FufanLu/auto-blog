# 🚀 BlogAuto - 一键博客发布工具

输入任何文字（多乱都行），AI 自动整理成博客文章 + 生成语音 + 一键发布。

## 功能

- 🤖 **AI 意图识别**：自动识别你想表达什么
- ✍️ **AI 文本整理**：把杂乱的文字整理成通顺的博客文章
- 🔊 **语音合成**：自动生成文章的语音版本（免费，使用 Edge-TTS）
- 📝 **一键发布**：自动发布到内置博客，可浏览、播放音频
- 📖 **博客页面**：查看所有已发布文章

## 技术栈

- **前端 + API**：Next.js 16 (TypeScript + Tailwind CSS)
- **TTS 后端**：Python FastAPI + Edge-TTS
- **AI**：OpenAI 兼容 API（GeekAI）

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/blog-auto.git
cd blog-auto
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local`：

```
API_KEY=你的API密钥
BASE_URL=https://geekai.dev/api/v1
MODEL_NAME=gpt-4o-mini
```

### 4. 安装 Python 依赖

```bash
cd tts-backend
pip install fastapi uvicorn edge-tts
```

### 5. 启动服务（需要两个终端）

**终端 1 - Next.js 前端：**
```bash
cd blog-auto
npm run dev
```

**终端 2 - Python TTS 后端：**
```bash
cd blog-auto/tts-backend
uvicorn main:app --reload --port 8000
```

### 6. 打开浏览器

- 主页面（编辑器）：http://localhost:3000
- 博客页面：http://localhost:3000/blog
- TTS 服务：http://localhost:8000

## 使用方法

1. 打开 http://localhost:3000
2. 输入任何文字（或点击示例按钮）
3. 点击「🚀 一键发布」
4. 等待 AI 分析 → 生成语音 → 发布完成
5. 点击「查看文章」或去 /blog 浏览

## 项目结构

```
blog-auto/
├── app/
│   ├── page.tsx              # 主页面
│   ├── api/
│   │   ├── analyze/route.ts  # AI 分析 API
│   │   ├── tts/route.ts      # TTS 转发 API
│   │   └── publish/route.ts  # 发布 API
│   └── blog/
│       ├── page.tsx           # 博客列表页
│       └── [id]/page.tsx      # 文章详情页
├── components/
│   ├── MainLayout.tsx         # 主布局组件
│   ├── TextInput.tsx          # 文本输入组件
│   └── AnalysisResult.tsx     # 分析结果组件
├── tts-backend/
│   └── main.py                # Python TTS 服务
└── .env.local                 # 环境变量（不上传）
```