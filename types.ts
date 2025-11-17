
export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoFile {
  url: string;
  name: string;
  duration: number;
}

// FIX: Added Message type for chat components
export interface Message {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}
