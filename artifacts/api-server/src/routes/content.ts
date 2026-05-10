import { Router, type IRouter } from "express";
import { db, generationsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GenerateContentBody,
  GetGenerationParams,
  DeleteGenerationParams,
} from "@workspace/api-zod";
import { desc, eq, sum, avg, count, sql } from "drizzle-orm";

const router: IRouter = Router();

function buildPrompt(
  feature: string,
  userInput: string,
  tone: string,
  audience: string,
  keywords: string
): string {
  const keywordList = keywords
    ? keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
        .join(", ")
    : "none provided";

  if (feature === "blog_post") {
    return `You are an expert content writer. Write a high-quality, SEO-friendly blog post with the following specifications:

ROLE: Expert content strategist and SEO writer
CONTEXT: The user needs an engaging blog post that naturally incorporates keywords
AUDIENCE: ${audience}
TONE: ${tone}
KEYWORDS TO INCLUDE: ${keywordList}
TOPIC: ${userInput}

LENGTH: 400-650 words

FORMAT REQUIREMENTS:
- Start with a TL;DR (one sentence summary)
- Write an engaging introduction (2-3 sentences max)
- Include exactly 3 main sections, each with a clear subheading (use ## for subheadings)
- Include one practical example or relatable analogy
- Keep paragraphs short — maximum 2 sentences each
- End with a conclusion that includes a call-to-action
- Naturally weave in the provided keywords throughout

ETHICAL GUIDELINES:
- Use inclusive, respectful language
- Avoid stereotypes and bias
- Do not invent facts or sources — only state what is clearly true
- Keep output practical and structured

Write the blog post now:`;
  }

  if (feature === "code_explain") {
    return `You are a patient and skilled programming educator. Explain the following code clearly:

ROLE: Expert programming educator
CONTEXT: Help the learner understand this code deeply without shame or condescension
AUDIENCE: ${audience}
TONE: ${tone}
CODE TO EXPLAIN: ${userInput}

FORMAT REQUIREMENTS:
1. Identify the programming language
2. Provide a quick summary (1-2 sentences) of what the code does
3. Give a step-by-step explanation of how the code works
4. Explain any important concepts or patterns used
5. Include a beginner-friendly analogy to make it memorable
6. Suggest any improvements or point out potential issues (kindly)

ETHICAL GUIDELINES:
- Never shame or mock the code author
- Use inclusive, encouraging language
- Focus on learning, not judging
- Do not invent behavior the code doesn't have

Explain the code now:`;
  }

  if (feature === "prompt_library") {
    return `You are a world-class AI prompt engineer. Generate 5 reusable, professional prompt cards.

ROLE: Expert AI prompt engineer and workflow designer
CONTEXT: Create production-ready prompt templates for teams and professionals
AUDIENCE: ${audience}
THEME/DOMAIN: ${userInput}
TONE: ${tone}
KEYWORDS/FOCUS AREAS: ${keywordList}

For each of the 5 prompt cards, provide:

**Card [N]: [Descriptive Name]**
- Department Tag: [e.g., Marketing, Engineering, HR]
- Task Tag: [e.g., Content Creation, Code Review, Analysis]
- Tone Tag: [e.g., Professional, Creative, Analytical]
- Context: [What situation this prompt is used for]
- Length: [Expected output length]
- Examples: [1-2 example use cases]
- Audience: [Who will use this prompt]
- Role: [What role the AI should take]
- Full Prompt Template: [The complete, ready-to-use prompt with [VARIABLES] in brackets]
- Why It Works: [Brief explanation of why this prompt is effective]
- Quality Score Criteria (1-5):
  - 1: Missing key context
  - 3: Clear and usable
  - 5: Comprehensive, professional, and immediately actionable

ETHICAL GUIDELINES:
- All prompts should promote inclusive and respectful outputs
- Avoid prompts that could generate biased or harmful content
- Design prompts that produce factual, practical results

Generate all 5 prompt cards now:`;
  }

  return `Answer the following in a helpful, structured way for ${audience} with a ${tone} tone: ${userInput}`;
}

function calculateSeoScore(
  result: string,
  keywords: string,
  wordCount: number
): number {
  const keywordList = keywords
    ? keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const resultLower = result.toLowerCase();

  let score = 50;

  // Word count bonus
  if (wordCount >= 300 && wordCount <= 800) score += 20;
  else if (wordCount >= 150) score += 10;

  // Keyword usage bonus
  if (keywordList.length > 0) {
    const keywordsFound = keywordList.filter((kw) =>
      resultLower.includes(kw)
    ).length;
    const ratio = keywordsFound / keywordList.length;
    score += Math.round(ratio * 25);
  } else {
    score += 15;
  }

  // Structure bonus (headings detected)
  if (result.includes("##") || result.includes("**")) score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateReadability(wordCount: number): string {
  if (wordCount >= 200 && wordCount <= 700) return "Excellent";
  if (wordCount >= 100) return "Good";
  return "Fair";
}

function countKeywordsUsed(result: string, keywords: string): string {
  const keywordList = keywords
    ? keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (keywordList.length === 0) return "0/0";
  const resultLower = result.toLowerCase();
  const found = keywordList.filter((kw) => resultLower.includes(kw)).length;
  return `${found}/${keywordList.length}`;
}

router.post("/generate", async (req, res): Promise<void> => {
  const parsed = GenerateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { feature, input, audience, tone, keywords = "" } = parsed.data;

  if (!input || input.trim().length === 0) {
    res.status(400).json({ error: "Input cannot be empty" });
    return;
  }

  const prompt = buildPrompt(feature, input, tone, audience, keywords ?? "");

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const result = completion.choices[0]?.message?.content ?? "";
  const modelUsed = completion.model ?? "gpt-5.4";
  const wordCount = result
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const seoScore = calculateSeoScore(result, keywords ?? "", wordCount);
  const readability = calculateReadability(wordCount);
  const toneMatch = tone;
  const keywordsUsed = countKeywordsUsed(result, keywords ?? "");

  const [saved] = await db
    .insert(generationsTable)
    .values({
      feature,
      input,
      audience,
      tone,
      keywords: keywords ?? null,
      result,
      wordCount,
      seoScore,
      readability,
      toneMatch,
      keywordsUsed,
      modelUsed,
    })
    .returning();

  res.json({
    id: saved.id,
    result,
    wordCount,
    seoScore,
    readability,
    toneMatch,
    keywordsUsed,
    modelUsed,
  });
});

router.get("/generations", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(generationsTable)
    .orderBy(desc(generationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.get("/generations/:id", async (req, res): Promise<void> => {
  const params = GetGenerationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(generationsTable)
    .where(eq(generationsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Generation not found" });
    return;
  }
  res.json(row);
});

router.delete("/generations/:id", async (req, res): Promise<void> => {
  const params = DeleteGenerationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(generationsTable)
    .where(eq(generationsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Generation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalGenerations: count(),
      totalWords: sum(generationsTable.wordCount),
      avgSeoScore: avg(generationsTable.seoScore),
    })
    .from(generationsTable);

  const featureCounts = await db
    .select({
      feature: generationsTable.feature,
      cnt: count(),
    })
    .from(generationsTable)
    .groupBy(generationsTable.feature);

  const byFeature = { blog_post: 0, code_explain: 0, prompt_library: 0 };
  for (const row of featureCounts) {
    if (row.feature in byFeature) {
      byFeature[row.feature as keyof typeof byFeature] = Number(row.cnt);
    }
  }

  res.json({
    totalGenerations: Number(totals?.totalGenerations ?? 0),
    totalWords: Number(totals?.totalWords ?? 0),
    avgSeoScore: Number(totals?.avgSeoScore ?? 0),
    byFeature,
  });
});

export default router;
