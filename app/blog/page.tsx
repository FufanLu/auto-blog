// app/blog/page.tsx
// ============================
// 📌 博客列表页
// URL: http://localhost:3000/blog
// Next.js 文件路由：app/blog/page.tsx = /blog
// ============================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  created_at: string;
  audio_url: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/publish")
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-2xl font-bold">📖 我的博客</h1>
          <Link
            href="/"
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 transition hover:border-blue-500 hover:text-blue-400"
          >
            ← 返回编辑器
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-500">还没有文章</p>
            <p className="mt-2 text-gray-600">去编辑器写一篇吧！</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-500"
            >
              去写文章
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <article className="group cursor-pointer rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600">
                  <h2 className="text-xl font-semibold text-gray-100 transition group-hover:text-blue-400">
                    {post.title}
                  </h2>

                  {post.summary && (
                    <p className="mt-2 text-gray-400">{post.summary}</p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(post.created_at).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {post.audio_url && (
                      <span className="text-green-500">🔊 有音频</span>
                    )}
                    <span>{post.content?.length || 0} 字</span>
                  </div>

                  {post.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}