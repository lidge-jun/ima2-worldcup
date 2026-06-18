export interface Frame {
  index: number;
  timestamp: number;
  blob: Blob;
  b64: string;
}

export type FrameStatus = 'pending' | 'active' | 'done' | 'error';

export interface StyledFrame extends Frame {
  styledB64?: string;
  status: FrameStatus;
  error?: string;
}
