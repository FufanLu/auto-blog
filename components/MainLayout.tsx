"use client";

import { useState } from "react";
import Link from "next/link";

interface StepStatus {
  analyzing: boolean;
  analyzeDone: boolean;
  ttsing: boolean;
  ttsDone: boolean;
  publishing: boolean;
  publishDone: boolean;
}

interface Result {
  title: string;
  intent: string;
  summary: string;
  tags: string[];
  postId: string;
  audioUrl: string;
  polishedContent: string;
  changesMade: string;
  originalText: string;
}

export default function MainLayout() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StepStatus>({
    analyzing: false, analyzeDone: false,
    ttsing: false, ttsDone: false,
    publishing: false, publishDone: false,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // 📌 示例 prompt - 各种杂乱程度的文本
  const examples = [
    {
      label: "🍜 杂乱美食分享",
      text: "昨天去吃了个火锅 特别好吃 就是那个海底捞 锅底选的番茄的 还有牛油的 毛肚特别新鲜 涮7秒就好了 鹅肠也不错 最后甩面表演太帅了 下次还去 推荐给大家 对了他们的小料台也很丰富 我调了个麻酱的 加了点香菜和葱花",
    },
    {
      label: "💻 口语化技术笔记",
      text: "今天搞了一天nextjs 终于搞懂了那个服务端组件和客户端组件的区别 就是use client加了才能用useState 不加的话默认在服务器跑 api route也挺方便的 直接在app/api下面建文件就行 不用单独搞后端了 感觉比以前用create react app好多了 路由也不用自己配 文件名就是路由 nb",
    },
    {
      label: "🎮 碎碎念产品体验",
      text: "switch2要出了吧 好像是 我现在还在玩旧的switch 塞尔达王国之泪真的太好玩了 开放世界做得太牛了 就是手柄摇杆有点飘 玩了两年了 电池也不太行了 不知道switch2兼容不兼容老游戏 如果兼容的话第一时间入 不兼容就再等等看 有没有人知道具体发售日期啊",
    },
    {
      label: "📚 凌乱学习记录",
      text: "考研复习第30天 今天看了线代的特征值和特征向量 感觉有点绕 就是Ax=λx那个 然后行列式那块还要再看看 政治开始背肖秀荣了 英语阅读错了3个 比昨天好一点 明天计划把概率论的大数定律搞完 加油吧 感觉时间不够用 每天学10个小时还是觉得少",
    },
  ];

  const handleOneClick = async () => {
    if (!text.trim()) { setError("请输入文本内容"); return; }

    setRunning(true);
    setError("");
    setResult(null);
    setShowOriginal(false);
    setStatus({
      analyzing: true, analyzeDone: false,
      ttsing: false, ttsDone: false,
      publishing: false, publishDone: false,
    });

    const originalText = text;

    try {
      // ====== 步骤1：AI 意图分析 + 文本整理 ======
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || "AI 分析失败");

      const analysis = analyzeData.analysis;
      const title = analysis.title_suggestion || "无标题文章";
      const summary = analysis.summary || "";
      const tags = analysis.tags || [];
      const intent = analysis.intent || "未识别";
      const polishedContent = analysis.polished_content || text;
      const changesMade = analysis.changes_made || "";

      setStatus((s) => ({ ...s, analyzing: false, analyzeDone: true, ttsing: true }));

      // ====== 步骤2：用整理后的文本生成语音 ======
      let audioFilename = "";
      try {
        const ttsRes = await fetch("http://localhost:8000/tts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: polishedContent, voice: "xiaoxiao", rate: "+0%" }),
        });
        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          audioFilename = ttsData.filename || "";
        }
      } catch {
        // TTS 失败不阻塞
      }

      setStatus((s) => ({ ...s, ttsing: false, ttsDone: true, publishing: true }));

      // ====== 步骤3：发布整理后的文章 ======
      const publishRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: polishedContent,
          summary,
          tags,
          audio_filename: audioFilename,
        }),
      });
      const publishData = await publishRes.json();
      if (publishData.error) throw new Error(publishData.error);

      setStatus((s) => ({ ...s, publishing: false, publishDone: true }));

      setResult({
        title,
        intent,
        summary,
        tags,
        postId: publishData.post.id,
        audioUrl: audioFilename ? `http://localhost:8000/audio/${audioFilename}` : "",
        polishedContent,
        changesMade,
        originalText,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "处理失败");
      setStatus({
        analyzing: false, analyzeDone: false,
        ttsing: false, ttsDone: false,
        publishing: false, publishDone: false,
      });
    } finally {
      setRunning(false);
    }
  };

  const Step = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
    <div className="flex items-center gap-2">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
        done ? "bg-green-500 text-white" : active ? "animate-pulse bg-blue-500 text-white" : "bg-gray-700 text-gray-500"
      }`}>
        {done ? "✓" : active ? "..." : "·"}
      </div>
      <span className={`text-sm ${done ? "text-green-400" : active ? "text-blue-400" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold">一键发布播客</h2>
        <p className="mt-2 text-gray-400">输入任何文字，AI 自动整理、生成语音、发布到播客 RSS</p>
      </div>

      {/* 示例 prompt */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-gray-500">试试这些杂乱文本，看 AI 怎么整理：</p>
        <div className="grid grid-cols-2 gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setText(ex.text); setResult(null); setError(""); }}
              disabled={running}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-left text-sm text-gray-300 transition hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
            >
              <span className="font-medium">{ex.label}</span>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{ex.text.slice(0, 50)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* 输入区域 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="随便写点什么，多乱都行，AI 会帮你整理成博客文章..."
        rows={6}
        disabled={running}
        className="w-full rounded-xl border border-gray-700 bg-gray-900 p-5 text-gray-200 placeholder-gray-600 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      <p className="mt-1 text-right text-sm text-gray-500">{text.length} 字</p>

      {/* 一键发布按钮 */}
      <button
        onClick={handleOneClick}
        disabled={running || !text.trim()}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 px-6 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "处理中..." : "🚀 一键发布播客"}
      </button>

      {/* 处理进度 */}
      {running && (
        <div className="mt-6 flex justify-center gap-8 rounded-xl border border-gray-700 bg-gray-900 p-4">
          <Step label="AI 分析整理" active={status.analyzing} done={status.analyzeDone} />
          <Step label="生成语音" active={status.ttsing} done={status.ttsDone} />
          <Step label="发布文章" active={status.publishing} done={status.publishDone} />
        </div>
      )}

      {/* 错误 */}
      {error && (
        <p className="mt-4 rounded-xl bg-red-900/30 p-4 text-red-400">❌ {error}</p>
      )}

      {/* 发布结果 */}
      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-gray-700 bg-gray-900 p-6">
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-2xl">✅</span>
            <span className="text-lg font-semibold">发布成功！</span>
          </div>

          {/* 基本信息 */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">标题：</span>
              <span className="font-medium text-gray-200">{result.title}</span>
            </div>
            <div>
              <span className="text-gray-500">AI 识别意图：</span>
              <span className="text-blue-400">{result.intent}</span>
            </div>
            <div>
              <span className="text-gray-500">摘要：</span>
              <span className="text-gray-300">{result.summary}</span>
            </div>
            {result.changesMade && (
              <div>
                <span className="text-gray-500">AI 整理说明：</span>
                <span className="text-yellow-400">{result.changesMade}</span>
              </div>
            )}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {result.tags.map((t, i) => (
                  <span key={i} className="rounded-full bg-purple-900/40 px-3 py-1 text-xs text-purple-300">#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* 📌 整理后的文章（语音朗读的就是这个版本） */}
          <div className="rounded-lg border border-blue-800 bg-blue-950/20 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-blue-400">📝 AI 整理后的文章（语音 & 发布版本）</p>
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-xs text-gray-500 transition hover:text-gray-300"
              >
                {showOriginal ? "隐藏原文" : "对比原文"}
              </button>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-gray-300">
              {result.polishedContent}
            </p>
          </div>

          {/* 原文对比 */}
          {showOriginal && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <p className="mb-2 text-sm font-medium text-gray-500">📋 你的原始输入：</p>
              <p className="whitespace-pre-line text-gray-400">{result.originalText}</p>
            </div>
          )}

          {/* 音频播放 */}
          {result.audioUrl && (
            <div className="rounded-lg border border-green-800 bg-green-950/20 p-4">
              <p className="mb-2 text-sm font-medium text-green-400">🔊 语音版本（朗读的是整理后的文章）</p>
              <audio controls src={result.audioUrl} className="w-full" />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <a
              href="http://localhost:8000/rss"
              target="_blank"
              className="flex-1 rounded-lg bg-orange-600 px-4 py-3 text-center font-medium text-white transition hover:bg-orange-500"
            >
              📡 查看 RSS Feed
            </a>
            <button
              onClick={() => { setResult(null); setText(""); setError(""); }}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-3 font-medium text-gray-400 transition hover:border-gray-500 hover:text-gray-300"
            >
              ✏️ 发布新节目
            </button>
          </div>
        </div>
      )}

      {/* 底部链接 */}
      <div className="mt-8 flex justify-center gap-6 text-sm">
        <a href="http://localhost:8000/rss" target="_blank" className="text-gray-500 transition hover:text-orange-400">
          📡 RSS Feed
        </a>
        <a href="http://localhost:8000/posts" target="_blank" className="text-gray-500 transition hover:text-blue-400">
          📋 所有节目
        </a>
        <a href="https://podcasters.spotify.com" target="_blank" className="text-gray-500 transition hover:text-green-400">
          🎧 Spotify for Podcasters
        </a>
      </div>
    </div>
  );
}