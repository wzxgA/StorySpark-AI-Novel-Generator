export interface AIConfig {
  id: number;
  apiUrl: string;
  apiKey: string;
  model: string;
  chapterWordCount: number;
  temperature: number;
  maxTokens: number;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}
