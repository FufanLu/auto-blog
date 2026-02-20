# blog-auto-tts/main.py
# ============================
# 📌 Python 后端
# TTS 语音合成 + 播客管理 + RSS Feed 生成
# ============================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import edge_tts
import uuid
import json
import os
from datetime import datetime, timezone
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString

app = FastAPI(title="BlogAuto Podcast Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = "audio_files"
EPISODES_DIR = "episodes"
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(EPISODES_DIR, exist_ok=True)

app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# ============================
# 播客配置 - 部署后改成你的真实域名
# ============================
PODCAST_CONFIG = {
    "title": "BlogAuto Podcast",
    "description": "AI 自动生成的博客播客，输入文字自动整理、生成语音、发布节目。",
    "author": "Fufan Lu",
    "email": "lu.fu@northeastern.edu",
    "language": "zh-cn",
    "image_url": "https://placehold.co/1400x1400/1a1a2e/ffffff?text=BlogAuto+Podcast",
    "base_url": "https://auto-blog-espm.onrender.com",
}

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
    return [{"id": k, "name": k, "code": v} for k, v in VOICES.items()]


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
        communicate = edge_tts.Communicate(text=req.text, voice=voice_code, rate=req.rate)
        await communicate.save(filepath)
        return FileResponse(filepath, media_type="audio/mpeg", filename=f"tts_{req.voice}.mp3")
    except Exception as e:
        return {"error": f"语音合成失败: {str(e)}"}


@app.post("/tts/save")
async def tts_save(req: TTSRequest):
    voice_code = VOICES.get(req.voice)
    if not voice_code:
        return {"error": f"未知语音: {req.voice}"}

    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    try:
        communicate = edge_tts.Communicate(text=req.text, voice=voice_code, rate=req.rate)
        await communicate.save(filepath)
        file_size = os.path.getsize(filepath)
        return {"filename": filename, "url": f"/audio/{filename}", "file_size": file_size}
    except Exception as e:
        return {"error": f"语音合成失败: {str(e)}"}


# ============================
# 📌 播客节目管理（替代博客）
# ============================

class PublishRequest(BaseModel):
    title: str
    content: str
    summary: str = ""
    tags: list[str] = []
    audio_filename: str = ""


def load_episodes() -> list[dict]:
    eps = []
    for fname in sorted(os.listdir(EPISODES_DIR), reverse=True):
        if fname.endswith(".json"):
            with open(os.path.join(EPISODES_DIR, fname), "r", encoding="utf-8") as f:
                eps.append(json.load(f))
    return eps


@app.post("/publish")
async def publish_episode(req: PublishRequest):
    ep_id = uuid.uuid4().hex[:8]
    now = datetime.now(timezone.utc).isoformat()

    # 获取音频文件大小
    file_size = 0
    if req.audio_filename:
        filepath = os.path.join(AUDIO_DIR, req.audio_filename)
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)

    episode = {
        "id": ep_id,
        "title": req.title,
        "content": req.content,
        "summary": req.summary,
        "tags": req.tags,
        "audio_filename": req.audio_filename,
        "audio_url": f"/audio/{req.audio_filename}" if req.audio_filename else "",
        "file_size": file_size,
        "created_at": now,
        "status": "published",
    }

    filepath = os.path.join(EPISODES_DIR, f"{now[:10]}_{ep_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(episode, f, ensure_ascii=False, indent=2)

    return {"message": "发布成功！", "post": episode}


@app.get("/posts")
async def get_episodes():
    return load_episodes()


@app.get("/posts/{ep_id}")
async def get_episode(ep_id: str):
    for ep in load_episodes():
        if ep["id"] == ep_id:
            return ep
    return {"error": "节目不存在"}


@app.delete("/posts/{ep_id}")
async def delete_episode(ep_id: str):
    for fname in os.listdir(EPISODES_DIR):
        if fname.endswith(".json"):
            filepath = os.path.join(EPISODES_DIR, fname)
            with open(filepath, "r", encoding="utf-8") as f:
                ep = json.load(f)
            if ep["id"] == ep_id:
                os.remove(filepath)
                return {"message": "删除成功"}
    return {"error": "节目不存在"}


# ============================
# 📌 RSS Feed 生成
# Spotify 通过这个 RSS 拉取你的播客
# ============================

@app.get("/rss")
async def rss_feed():
    base = PODCAST_CONFIG["base_url"]
    episodes = load_episodes()

    # 构建 RSS XML
    rss = Element("rss")
    rss.set("version", "2.0")
    rss.set("xmlns:itunes", "http://www.itunes.com/dtds/podcast-1.0.dtd")
    rss.set("xmlns:content", "http://purl.org/rss/1.0/modules/content/")

    channel = SubElement(rss, "channel")

    # 播客基本信息
    SubElement(channel, "title").text = PODCAST_CONFIG["title"]
    SubElement(channel, "description").text = PODCAST_CONFIG["description"]
    SubElement(channel, "language").text = PODCAST_CONFIG["language"]
    SubElement(channel, "link").text = base

    # iTunes 专用标签（Spotify 也用这些）
    SubElement(channel, "itunes:author").text = PODCAST_CONFIG["author"]
    SubElement(channel, "itunes:summary").text = PODCAST_CONFIG["description"]
    SubElement(channel, "itunes:explicit").text = "false"

    owner = SubElement(channel, "itunes:owner")
    SubElement(owner, "itunes:name").text = PODCAST_CONFIG["author"]
    SubElement(owner, "itunes:email").text = PODCAST_CONFIG["email"]

    if PODCAST_CONFIG["image_url"]:
        img = SubElement(channel, "itunes:image")
        img.set("href", PODCAST_CONFIG["image_url"])

    cat = SubElement(channel, "itunes:category")
    cat.set("text", "Technology")

    # 添加每个节目
    for ep in episodes:
        if not ep.get("audio_filename"):
            continue

        item = SubElement(channel, "item")
        SubElement(item, "title").text = ep["title"]
        SubElement(item, "description").text = ep.get("summary", "")

        # content:encoded 放完整内容
        encoded = SubElement(item, "content:encoded")
        encoded.text = ep.get("content", "")

        SubElement(item, "pubDate").text = format_rfc822(ep["created_at"])
        SubElement(item, "guid").text = ep["id"]

        # 音频附件 - Spotify 需要这个
        enclosure = SubElement(item, "enclosure")
        enclosure.set("url", f"{base}/audio/{ep['audio_filename']}")
        enclosure.set("length", str(ep.get("file_size", 0)))
        enclosure.set("type", "audio/mpeg")

        SubElement(item, "itunes:summary").text = ep.get("summary", "")
        SubElement(item, "itunes:explicit").text = "false"

        # 标签作为关键词
        if ep.get("tags"):
            SubElement(item, "itunes:keywords").text = ",".join(ep["tags"])

    # 格式化 XML
    xml_str = tostring(rss, encoding="unicode")
    pretty = parseString(xml_str).toprettyxml(indent="  ")
    # 去掉多余的 xml declaration
    lines = pretty.split("\n")[1:]
    xml_out = '<?xml version="1.0" encoding="UTF-8"?>\n' + "\n".join(lines)

    return Response(content=xml_out, media_type="application/rss+xml; charset=utf-8")


def format_rfc822(iso_date: str) -> str:
    """把 ISO 日期转成 RFC 822 格式（RSS 需要的）"""
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")
    except Exception:
        return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")


# ============================
# 播客配置接口（前端可以修改配置）
# ============================

class PodcastConfigUpdate(BaseModel):
    title: str = ""
    description: str = ""
    author: str = ""
    email: str = ""
    image_url: str = ""
    base_url: str = ""


@app.get("/config")
async def get_config():
    return PODCAST_CONFIG


@app.post("/config")
async def update_config(req: PodcastConfigUpdate):
    if req.title: PODCAST_CONFIG["title"] = req.title
    if req.description: PODCAST_CONFIG["description"] = req.description
    if req.author: PODCAST_CONFIG["author"] = req.author
    if req.email: PODCAST_CONFIG["email"] = req.email
    if req.image_url: PODCAST_CONFIG["image_url"] = req.image_url
    if req.base_url: PODCAST_CONFIG["base_url"] = req.base_url
    return {"message": "配置已更新", "config": PODCAST_CONFIG}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "BlogAuto Podcast Backend"}