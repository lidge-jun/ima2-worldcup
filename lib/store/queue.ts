export type JobStatus = 'queued' | 'generating' | 'done' | 'error';
export type JobMode = 'image' | 'frames' | 'single' | 'v2v';

export interface Job {
  id: string;
  fileName: string;
  file: File;
  mode: JobMode;
  style: string;
  customPrompt: string;
  fps: number;
  status: JobStatus;
  progress?: { current: number; total: number };
  resultB64?: string;
  gifUrl?: string;
  videoUrl?: string;
  videoBlob?: Blob;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

let nextId = 1;

export function createJob(file: File, mode: JobMode, style: string, customPrompt: string, fps: number): Job {
  return {
    id: `job_${nextId++}_${Date.now()}`,
    fileName: file.name,
    file,
    mode,
    style,
    customPrompt,
    fps,
    status: 'queued',
    createdAt: Date.now(),
  };
}

export function getActiveJob(jobs: Job[]): Job | undefined {
  return jobs.find(j => j.status === 'generating');
}

export function getNextQueued(jobs: Job[]): Job | undefined {
  return jobs.find(j => j.status === 'queued');
}

export function getPendingJobs(jobs: Job[]): Job[] {
  return jobs.filter(j => j.status === 'queued');
}

export function getCompletedJobs(jobs: Job[]): Job[] {
  return jobs.filter(j => j.status === 'done' || j.status === 'error');
}
