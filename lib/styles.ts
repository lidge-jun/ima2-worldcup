const COMMON_SUFFIX = `
Remove ALL TV broadcast logos, channel watermarks (JTBC, SBS, etc.), and digital overlay graphics completely — replace those areas with the surrounding scene in the same art style.
Replace any scoreboard or score display with hand-drawn text in the same art style, showing only the team names and score. The entire image should look like a page torn from a sketchbook — no digital or broadcast elements should remain.`;

const SCORE_STYLE: Record<string, string> = {
  crayon: 'Write the score in thick crayon handwriting with wobbly childlike letters.',
  watercolor: 'Paint the score in loose watercolor brush lettering with paint drips.',
  oil: 'Paint the score in oil with visible impasto brushstrokes.',
  sketch: 'Write the score in rough pencil handwriting with eraser smudges.',
  anime: 'Draw the score in bold manga-style hand lettering with speed lines.',
};

export const STYLE_PROMPTS: Record<string, string> = {
  crayon: `Redraw this image in crayon/colored pencil children's art style. Keep the exact same composition, player positions, and scene. Thick waxy crayon strokes, bright primary colors, paper texture visible. ${SCORE_STYLE.crayon}${COMMON_SUFFIX}`,
  watercolor: `Redraw this image as a loose watercolor painting. Keep the exact same composition and scene. Wet-on-wet technique, soft edges, translucent washes, white paper showing through. ${SCORE_STYLE.watercolor}${COMMON_SUFFIX}`,
  oil: `Redraw this image as a classical oil painting. Keep the exact same composition and scene. Visible brushstrokes, rich impasto texture, warm light, gallery-quality finish. ${SCORE_STYLE.oil}${COMMON_SUFFIX}`,
  sketch: `Redraw this image as a pencil sketch. Keep the exact same composition and scene. Graphite on white paper, cross-hatching for shading, loose confident lines. ${SCORE_STYLE.sketch}${COMMON_SUFFIX}`,
  anime: `Redraw this image in Japanese anime/manga art style. Keep the exact same composition and scene. Bold outlines, flat cel-shading, vibrant saturated colors, dynamic energy lines. ${SCORE_STYLE.anime}${COMMON_SUFFIX}`,
};

export function getStylePrompt(style: string, customPrompt?: string): string {
  if (style === 'custom' && customPrompt) return customPrompt + COMMON_SUFFIX;
  return STYLE_PROMPTS[style] || STYLE_PROMPTS.crayon;
}
