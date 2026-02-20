// app/api/tts/route.ts
// ============================
// 📌 TTS API 路由
// Next.js 转发请求给 Python TTS 服务
// 前端调 /api/tts → 这里转发给 localhost:8000/tts
// ============================

import { NextRequest, NextResponse } from "next/server";

const TTS_SERVER = "http://localhost:8000";

// POST /api/tts - 文本转语音
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${TTS_SERVER}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error || "TTS 服务出错" },
        { status: 500 }
      );
    }

    // 把 Python 返回的音频流转发给前端
    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="tts.mp3"',
      },
    });
  } catch (error: unknown) {
    console.error("TTS 请求失败:", error);
    return NextResponse.json(
      { error: "无法连接 TTS 服务，请确认 Python 后端已启动" },
      { status: 500 }
    );
  }
}

// GET /api/tts/voices - 获取语音列表
export async function GET() {
  try {
    const res = await fetch(`${TTS_SERVER}/voices`);
    const voices = await res.json();
    return NextResponse.json(voices);
  } catch {
    return NextResponse.json(
      { error: "无法连接 TTS 服务" },
      { status: 500 }
    );
  }
}