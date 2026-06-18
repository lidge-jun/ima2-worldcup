export type StylePreset = 'crayon' | 'watercolor' | 'oil' | 'sketch' | 'anime' | 'custom';

export interface ReframeOptions {
  input: string;
  output: string;
  style: StylePreset | string;
  provider: 'ima2' | 'grok-v2v';
  fps?: number;
  mode: 'image' | 'video-frames' | 'video-single' | 'video-v2v';
}
