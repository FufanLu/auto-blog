// components/AnalysisResult.tsx
// ============================
// 📌 展示 AI 分析结果的组件
// ============================
"use client";

interface Analysis {
  intent: string;
  summary: string;
  title_suggestion: string;
  tags: string[];
  tone: string;
  word_count: number;
  suggested_improvements: string;
  raw?: string;
}

interface Props {
  analysis: Analysis;
}

export default function AnalysisResult({ analysis }: Props) {
  // 如果 JSON 解析失败，显示原始文本
  if (analysis.raw) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h3 className="mb-3 text-lg font-semibold">分析结果</h3>
        <p className="whitespace-pre-wrap text-gray-300">{analysis.raw}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">📊 AI 分析结果</h3>

      {/* 建议标题 */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          建议标题
        </p>
        <p className="mt-1 text-lg font-semibold text-blue-400">
          {analysis.title_suggestion}
        </p>
      </div>

      {/* 意图 & 语气 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            内容意图
          </p>
          <p className="mt-1 text-gray-200">{analysis.intent}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            文章语气
          </p>
          <p className="mt-1 text-gray-200">{analysis.tone}</p>
        </div>
      </div>

      {/* 摘要 */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          内容摘要
        </p>
        <p className="mt-2 leading-relaxed text-gray-300">
          {analysis.summary}
        </p>
      </div>

      {/* 标签 */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          推荐标签
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {analysis.tags?.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-blue-900/40 px-3 py-1 text-sm text-blue-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 字数 & 改进建议 */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          字数：{analysis.word_count} 字 · 改进建议
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {analysis.suggested_improvements}
        </p>
      </div>

      {/* 下一步按钮（阶段2预留） */}
      <button
        disabled
        className="w-full rounded-lg border border-gray-600 px-6 py-3 text-gray-500 cursor-not-allowed"
      >
        🔊 下一步：生成语音（阶段 2 开发中）
      </button>
    </div>
  );
}