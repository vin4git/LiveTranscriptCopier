import { TranscriptLine } from "@/pages/Home";

// Interface for platform-specific handlers
export interface PlatformHandler {
  initialize: () => Promise<boolean>;
  startCapturing: (callback: (text: string, speaker?: string) => void) => void;
  stopCapturing: () => void;
  isSupported: () => boolean;
}

// WebSpeech API for direct browser transcription
export class WebSpeechTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isCapturing: boolean = false;
  private callback: ((text: string, speaker?: string) => void) | null = null;
  
  constructor() {
    // Check if browser supports SpeechRecognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // @ts-ignore - WebkitSpeechRecognition is not in TypeScript's lib
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }
  
  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      if (!this.callback) return;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          this.callback(transcript);
        }
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };
    
    this.recognition.onend = () => {
      if (this.isCapturing) {
        // Restart if it was supposed to be capturing
        this.recognition?.start();
      }
    };
  }
  
  public isSupported(): boolean {
    return this.recognition !== null;
  }
  
  public startCapturing(callback: (text: string, speaker?: string) => void) {
    if (!this.recognition) return;
    
    this.callback = callback;
    this.isCapturing = true;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }
  
  public stopCapturing() {
    if (!this.recognition) return;
    
    this.isCapturing = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }
}

// Function to format and clean transcription text
export function formatTranscriptionText(text: string, cleanFormatting: boolean): string {
  if (!cleanFormatting) return text;
  
  // Remove extra spaces
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter of sentences
  cleaned = cleaned.replace(/(?:^|[.!?]\s+)([a-z])/g, (match, letter) => {
    return match.replace(letter, letter.toUpperCase());
  });
  
  return cleaned;
}

// Helper function to create transcript lines
export function createTranscriptLine(text: string, speaker?: string): TranscriptLine {
  return {
    timestamp: new Date(),
    speaker,
    content: text,
    isCopied: false
  };
}
