// app/api/publish/route.ts
// ============================
// 📌 发布 API 路由
// 转发发布请求给 Python 后端
// ============================

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.TTS_BACKEND_URL || "http://localhost:8000";

// POST /api/publish - 发布文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("发布失败:", error);
    return NextResponse.json(
      { error: "无法连接后端服务" },
      { status: 500 }
    );
  }
}

// GET /api/publish - 获取所有文章
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/posts`);
    const posts = await res.json();
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "无法连接后端服务" },
      { status: 500 }
    );
  }
}