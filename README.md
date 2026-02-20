# 🚀 BlogAuto - AI 一键播客发布工具

输入任何文字（多乱都行），AI 自动整理成文章 + 生成语音 + 发布到播客 RSS，支持 Spotify 上架。

## 在线体验

- 🌐 网页：https://auto-blog-chi.vercel.app
- 📡 RSS Feed：https://auto-blog-espm.onrender.com/rss
- 🎧 Spotify：审核中...

## 功能

- 🤖 **AI 意图识别** — 自动识别你想表达什么
- ✍️ **AI 文本整理** — 把杂乱的文字整理成通顺的文章
- 🔊 **语音合成** — 自动生成语音（免费 Edge-TTS）
- 📡 **RSS Feed** — 自动生成播客 RSS，支持 Spotify / Apple Podcasts
- 🚀 **一键发布** — 输入文字，点一个按钮，全自动完成

## 架构

```
用户输入文字
     ↓
┌─────────────────────────────────────┐
│  Next.js 前端 (Vercel)              │
│  https://auto-blog-chi.vercel.app   │
│                                     │
│  ① /api/analyze → 调用 GeekAI API   │
│     AI 识别意图 + 整理文本            │
│                                     │
│  ② /api/tts-save → 转发给 Python    │
│     生成语音 MP3                     │
│                                     │
│  ③ /api/publish → 转发给 Python     │
│     保存节目 + 更新 RSS              │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Python 后端 (Render)               │
│  https://auto-blog-espm.onrender.com│
│                                     │
│  /tts/save  → Edge-TTS 生成语音     │
│  /publish   → 保存节目为 JSON       │
│  /rss       → 生成播客 RSS Feed     │
│  /audio/*   → 提供音频文件下载       │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Spotify                            │
│  自动从 RSS 拉取新节目上架           │
└─────────────────────────────────────┘
```

## 技术栈

- **前端 + API**：Next.js 16（TypeScript + Tailwind CSS）→ 部署在 Vercel
- **后端**：Python FastAPI + Edge-TTS → 部署在 Render
- **AI**：OpenAI 兼容 API（GeekAI）

## 本地运行

### 1. 克隆项目

```bash
git clone https://github.com/FufanLu/auto-blog.git
cd auto-blog
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
TTS_BACKEND_URL=http://localhost:8000
```

### 4. 安装 Python 依赖

```bash
cd tts-backend
pip install -r requirements.txt
```

### 5. 启动（需要两个终端）

**终端 1 — Next.js：**
```bash
npm run dev
```

**终端 2 — Python 后端：**
```bash
cd tts-backend
uvicorn main:app --reload --port 8000
```

### 6. 打开浏览器

- 主页：http://localhost:3000
- RSS：http://localhost:8000/rss

## 项目结构

```
auto-blog/
├── app/
│   ├── page.tsx               # 主页面
│   ├── api/
│   │   ├── analyze/route.ts   # AI 分析 API
│   │   ├── tts/route.ts       # TTS 转发 API
│   │   ├── tts-save/route.ts  # TTS 保存 API
│   │   └── publish/route.ts   # 发布 API
│   └── blog/
│       ├── page.tsx            # 博客列表页
│       └── [id]/page.tsx       # 文章详情页
├── components/
│   ├── MainLayout.tsx          # 主布局
│   ├── TextInput.tsx           # 文本输入
│   └── AnalysisResult.tsx      # 分析结果
├── tts-backend/
│   ├── main.py                 # Python 后端
│   └── requirements.txt
└── .env.local                  # 环境变量（不上传）
```

## 部署

### Python 后端 → Render（免费）
1. 注册 https://render.com（用 GitHub 登录）
2. New → Web Service → 选这个仓库
3. 设置：Root Directory `tts-backend`，Runtime `Python`
4. Build Command：`pip install -r requirements.txt`
5. Start Command：`uvicorn main:app --host 0.0.0.0 --port $PORT`
6. 选 Free，部署

### Next.js 前端 → Vercel（免费）
1. 注册 https://vercel.com（用 GitHub 登录）
2. Add New Project → 选这个仓库
3. 添加 Environment Variables：
   - `TTS_BACKEND_URL` = 你的 Render URL
   - `API_KEY` = 你的 AI API 密钥
   - `BASE_URL` = `https://geekai.dev/api/v1`
   - `MODEL_NAME` = `gpt-4o-mini`
4. Deploy

## Spotify 对接

1. 在网页上发布几个节目
2. 去 https://creators.spotify.com 登录
3. Add a new show → Find an existing show → Somewhere else
4. 粘贴 RSS 链接，验证邮箱
5. 等审核通过，之后发新节目 Spotify 自动更新

## 作者

Fufan Lu — [@FufanLu](https://github.com/FufanLu)