// app/api/analyze/route.ts
// ============================
// 📌 AI 分析 + 意图识别 + 文本整理
// 用户输入杂乱的文字，AI 帮忙：
// 1. 识别意图（用户想干嘛）
// 2. 整理润色文本（变成通顺的博客文章）
// 3. 生成标题、摘要、标签
// ============================

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.BASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "请输入文本内容" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一个专业的博客内容助手。你的任务是：
1. 识别用户输入文本的意图（用户想表达什么、想做什么）
2. 把用户输入的文字整理成一篇通顺、有条理的博客文章
3. 生成合适的标题、摘要和标签

注意：
- 用户输入可能很杂乱、有错别字、语序混乱，你需要理解他的意思并重新组织
- 整理后的文章要保留用户原意，但语言要通顺、段落要清晰
- 可以适当补充过渡句，但不要编造用户没说过的内容
- 严格返回 JSON 格式，不要包含 markdown 代码块标记`,
        },
        {
          role: "user",
          content: `请分析并整理以下文本，返回 JSON 格式：

{
  "intent": "用户的意图（如：分享美食经验、技术教程、产品评测、生活记录等）",
  "polished_content": "整理润色后的完整博客文章，段落之间用\\n\\n分隔",
  "title_suggestion": "建议的博客标题",
  "summary": "100字以内的内容摘要",
  "tags": ["标签1", "标签2", "标签3"],
  "tone": "文章语气",
  "changes_made": "简要说明你做了哪些整理（如：修正错别字、调整语序、补充过渡句等）"
}

用户原始输入：
${text}`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "";

    let analysis;
    try {
      const cleaned = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { raw: responseText };
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("分析失败:", error);
    const errMsg = error instanceof Error ? error.message : "分析过程出错";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}