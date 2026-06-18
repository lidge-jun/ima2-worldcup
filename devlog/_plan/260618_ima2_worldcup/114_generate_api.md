# 114 — Image Generation API Route + Style Prompts

## Files: NEW
```
app/api/generate/route.ts   — POST handler
                              Input: { imageB64, style, customPrompt?, token }
                              Output: { resultB64, model, elapsed_ms }
                              Calls OpenAI Responses API (gpt-5.4-mini, non-thinking)
                              Reference: ima2-gen/lib/responsesImageAdapter.js → editViaResponses()

lib/styles.ts               — Style preset → prompt 매핑
                              STYLE_PROMPTS: Record<string, string>
                              예: crayon → "Redraw this image in crayon/colored pencil children's art style.
                                   Keep the exact same composition, player positions, and scene.
                                   Thick waxy crayon strokes, bright primary colors, paper texture visible."

lib/generate.ts             — generateImage(imageB64, stylePrompt, token) → resultB64
                              OpenAI Responses API 호출 래퍼
                              Base URL: https://api.openai.com/v1/responses
                              Model: gpt-5.4-mini
                              Tool: image_generation (i2i edit mode)
```

## API Route Shape
```typescript
// POST /api/generate
export async function POST(req: Request) {
  const { imageB64, style, customPrompt, token } = await req.json();
  // validate token, image size
  const prompt = customPrompt || STYLE_PROMPTS[style];
  const result = await generateImage(imageB64, prompt, token);
  return Response.json({ resultB64: result, model: 'gpt-5.4-mini' });
}
```

## Style Prompts (6개)
```typescript
export const STYLE_PROMPTS = {
  crayon: "Redraw in crayon/colored pencil children's art style. Same composition, thick waxy strokes, bright colors, paper texture.",
  watercolor: "Redraw as a loose watercolor painting. Same composition, wet-on-wet technique, soft edges, translucent washes, white paper showing through.",
  oil: "Redraw as a classical oil painting. Same composition, visible brushstrokes, rich impasto texture, warm light, gallery-quality finish.",
  sketch: "Redraw as a pencil sketch. Same composition, graphite on white paper, cross-hatching for shading, loose confident lines.",
  anime: "Redraw in Japanese anime/manga art style. Same composition, bold outlines, flat cel-shading, vibrant saturated colors, dynamic energy lines.",
  custom: "" // user provides
};
```

## OpenAI API Call (from ima2-gen reference)
```typescript
// Responses API — i2i edit with reference
POST https://api.openai.com/v1/responses
Authorization: Bearer <codex_token>
{
  model: "gpt-5.4-mini",
  input: [
    { role: "user", content: [
      { type: "input_image", image_url: `data:image/png;base64,${imageB64}` },
      { type: "input_text", text: stylePrompt }
    ]}
  ],
  tools: [{ type: "image_generation", quality: "low", size: "1024x1024" }],
  tool_choice: { type: "image_generation" }
}
```

## Done
- POST /api/generate — 이미지 B64 + 스타일 → 결과 이미지 B64
- 6개 스타일 프리셋 프롬프트 작동
- Custom 프롬프트 전달 가능
- 에러 핸들링: 토큰 만료, rate limit, moderation refusal
