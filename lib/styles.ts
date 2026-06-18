export const STYLE_PROMPTS: Record<string, string> = {
  crayon: "Redraw this image in crayon/colored pencil children's art style. Keep the exact same composition, player positions, and scene. Thick waxy crayon strokes, bright primary colors, paper texture visible.",
  watercolor: "Redraw this image as a loose watercolor painting. Keep the exact same composition and scene. Wet-on-wet technique, soft edges, translucent washes, white paper showing through.",
  oil: "Redraw this image as a classical oil painting. Keep the exact same composition and scene. Visible brushstrokes, rich impasto texture, warm light, gallery-quality finish.",
  sketch: "Redraw this image as a pencil sketch. Keep the exact same composition and scene. Graphite on white paper, cross-hatching for shading, loose confident lines.",
  anime: "Redraw this image in Japanese anime/manga art style. Keep the exact same composition and scene. Bold outlines, flat cel-shading, vibrant saturated colors, dynamic energy lines.",
};

export function getStylePrompt(style: string, customPrompt?: string): string {
  if (style === 'custom' && customPrompt) return customPrompt;
  return STYLE_PROMPTS[style] || STYLE_PROMPTS.crayon;
}
