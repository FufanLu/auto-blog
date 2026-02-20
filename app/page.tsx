// app/page.tsx
// ============================
// 📌 Next.js 页面组件
// app/page.tsx = http://localhost:3000/ 首页
// 这是「服务端组件」，交互逻辑在 MainLayout 里
// ============================

import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">
          🚀 BlogAuto
          <span className="ml-2 text-sm font-normal text-gray-400">
            博客内容自动化工具
          </span>
        </h1>
      </header>
      <MainLayout />
    </main>
  );
}