// app/blog/[id]/page.tsx
// ============================
// 📌 文章详情页
// URL: http://localhost:3000/blog/xxxxx
// [id] 是动态路由，Next.js 会把 URL 里的 id 传给组件
// 这是 Next.js 的核心概念之一！
// ============================
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  created_at: string;
  audio_url: string;
  audio_filename: string;
}

// 📌 Next.js 动态路由：文件名 [id] 里的 id 会通过 params 传进来
export default function BlogPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setNotFound(true);
        } else {
          setPost(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        加载中...
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-gray-400">
        <p className="text-xl">文章不存在</p>
        <Link
          href="/blog"
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-500"
        >
          返回文章列表
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/blog"
            className="text-gray-400 transition hover:text-blue-400"
          >
            ← 返回文章列表
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 transition hover:border-blue-500 hover:text-blue-400"
          >
            编辑器
          </Link>
        </div>
      </header>

      {/* 文章内容 */}
      <article className="mx-auto max-w-3xl px-6 py-10">
        {/* 标题 */}
        <h1 className="text-3xl font-bold leading-tight text-gray-100">
          {post.title}
        </h1>

        {/* 元信息 */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>
            {new Date(post.created_at).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>{post.content?.length || 0} 字</span>
        </div>

        {/* 标签 */}
        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-purple-900/40 px-3 py-1 text-sm text-purple-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 摘要 */}
        {post.summary && (
          <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-gray-900 p-4">
            <p className="text-sm font-medium text-gray-400">📌 摘要</p>
            <p className="mt-1 text-gray-300">{post.summary}</p>
          </div>
        )}

        {/* 音频播放器 */}
        {post.audio_filename && (
          <div className="mt-6 rounded-xl border border-green-800 bg-green-950/20 p-4">
            <p className="mb-2 text-sm font-medium text-green-400">
              🔊 听文章
            </p>
            <audio
              controls
              src={`http://localhost:8000/audio/${post.audio_filename}`}
              className="w-full"
            />
          </div>
        )}

        {/* 正文 */}
        <div className="mt-8 leading-relaxed text-gray-300">
          {post.content.split("\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ) : null
          )}
        </div>
      </article>
    </div>
  );
}