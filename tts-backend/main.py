# blog-auto-tts/main.py
# ============================
# 📌 Python 后端
# TTS 语音合成 + 博客文章管理
# ============================

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import edge_tts
import uuid
import json
import os
from datetime import datetime

app = FastAPI(title="BlogAuto Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 目录设置
AUDIO_DIR = "audio_files"
POSTS_DIR = "posts"
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(POSTS_DIR, exist_ok=True)

# 挂载静态文件，让音频可以通过 URL 访问
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


# ============================
# TTS 相关
# ============================
VOICES = {
    "xiaoxiao": "zh-CN-XiaoxiaoNeural",
    "xiaoyi": "zh-CN-XiaoyiNeural",
    "yunjian": "zh-CN-YunjianNeural",
    "yunxi": "zh-CN-YunxiNeural",
    "yunxia": "zh-CN-YunxiaNeural",
    "xiaobei": "zh-CN-liaoning-XiaobeiNeural",
}


class TTSRequest(BaseModel):
    text: str
    voice: str = "xiaoxiao"
    rate: str = "+0%"


@app.get("/voices")
async def get_voices():
    return [
        {"id": key, "name": key, "code": val}
        for key, val in VOICES.items()
    ]


@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    voice_code = VOICES.get(req.voice)
    if not voice_code:
        return {"error": f"未知语音: {req.voice}"}
    if not req.text or not req.text.strip():
        return {"error": "文本不能为空"}

    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        communicate = edge_tts.Communicate(
            text=req.text, voice=voice_code, rate=req.rate
        )
        await communicate.save(filepath)
        return FileResponse(filepath, media_type="audio/mpeg", filename=f"tts_{req.voice}.mp3")
    except Exception as e:
        return {"error": f"语音合成失败: {str(e)}"}


# 单独的 TTS 接口：生成并保存，返回文件名（给发布用）
@app.post("/tts/save")
async def tts_save(req: TTSRequest):
    voice_code = VOICES.get(req.voice)
    if not voice_code:
        return {"error": f"未知语音: {req.voice}"}

    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        communicate = edge_tts.Communicate(
            text=req.text, voice=voice_code, rate=req.rate
        )
        await communicate.save(filepath)
        return {"filename": filename, "url": f"/audio/{filename}"}
    except Exception as e:
        return {"error": f"语音合成失败: {str(e)}"}


# ============================
# 📌 博客文章管理
# 用 JSON 文件存储，简单够用
# ============================

class PublishRequest(BaseModel):
    title: str
    content: str
    summary: str = ""
    tags: list[str] = []
    audio_filename: str = ""  # TTS 生成的音频文件名


def load_posts() -> list[dict]:
    """读取所有文章"""
    posts = []
    for fname in sorted(os.listdir(POSTS_DIR), reverse=True):
        if fname.endswith(".json"):
            with open(os.path.join(POSTS_DIR, fname), "r", encoding="utf-8") as f:
                posts.append(json.load(f))
    return posts


# POST /publish - 发布文章
@app.post("/publish")
async def publish_post(req: PublishRequest):
    post_id = uuid.uuid4().hex[:8]
    now = datetime.now().isoformat()

    post = {
        "id": post_id,
        "title": req.title,
        "content": req.content,
        "summary": req.summary,
        "tags": req.tags,
        "audio_filename": req.audio_filename,
        "audio_url": f"/audio/{req.audio_filename}" if req.audio_filename else "",
        "created_at": now,
        "status": "published",
    }

    # 保存为 JSON 文件
    filepath = os.path.join(POSTS_DIR, f"{now[:10]}_{post_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(post, f, ensure_ascii=False, indent=2)

    return {"message": "发布成功！", "post": post}


# GET /posts - 获取所有文章
@app.get("/posts")
async def get_posts():
    return load_posts()


# GET /posts/{post_id} - 获取单篇文章
@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    for post in load_posts():
        if post["id"] == post_id:
            return post
    return {"error": "文章不存在"}


# DELETE /posts/{post_id} - 删除文章
@app.delete("/posts/{post_id}")
async def delete_post(post_id: str):
    for fname in os.listdir(POSTS_DIR):
        if fname.endswith(".json"):
            filepath = os.path.join(POSTS_DIR, fname)
            with open(filepath, "r", encoding="utf-8") as f:
                post = json.load(f)
            if post["id"] == post_id:
                os.remove(filepath)
                return {"message": "删除成功"}
    return {"error": "文章不存在"}


# ============================
# 健康检查
# ============================
@app.get("/health")
async def health():
    return {"status": "ok", "service": "BlogAuto Backend"}