// components/TextInput.tsx
// ============================
// 📌 客户端组件 - 文本输入区域
// 这是一个受控组件，状态由父组件管理（通过 props）
// ============================
"use client";

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
}

export default function TextInput({ text, setText }: TextInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">
        输入博客内容
        <span className="ml-2 text-gray-500">
          ({text.length} 字)
        </span>
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在这里粘贴你的博客文章、笔记、或任何你想分析的文本内容..."
        rows={14}
        className="w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-gray-200 placeholder-gray-600 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}