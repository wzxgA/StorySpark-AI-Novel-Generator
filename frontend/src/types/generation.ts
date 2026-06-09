export interface TokenEvent {
  token: string;
  chapterId: number;
}

export interface DoneEvent {
  chapterId: number;
  wordCount: number;
}

export interface ErrorEvent {
  message: string;
}
