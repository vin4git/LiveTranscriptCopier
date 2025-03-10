import { 
  users, 
  User, 
  InsertUser, 
  transcriptions, 
  Transcription, 
  InsertTranscription,
  transcriptLines,
  TranscriptLine,
  InsertTranscriptLine,
  settings,
  Settings,
  InsertSettings,
  UpdateSettings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transcription methods
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  getTranscription(id: number): Promise<Transcription | undefined>;
  getTranscriptionsByUser(userId: number): Promise<Transcription[]>;
  updateTranscription(id: number, endTime: Date): Promise<Transcription | undefined>;
  
  // Transcript line methods
  addTranscriptLine(line: InsertTranscriptLine): Promise<TranscriptLine>;
  getTranscriptLines(transcriptionId: number): Promise<TranscriptLine[]>;
  getRecentTranscriptLines(transcriptionId: number, count: number): Promise<TranscriptLine[]>;
  markLineAsCopied(id: number): Promise<void>;
  
  // Settings methods
  getSettings(userId: number): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, updatedSettings: UpdateSettings): Promise<Settings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transcriptions: Map<number, Transcription>;
  private transcriptLines: Map<number, TranscriptLine>;
  private userSettings: Map<number, Settings>;
  
  private userId: number;
  private transcriptionId: number;
  private lineId: number;
  private settingsId: number;

  constructor() {
    this.users = new Map();
    this.transcriptions = new Map();
    this.transcriptLines = new Map();
    this.userSettings = new Map();
    
    this.userId = 1;
    this.transcriptionId = 1;
    this.lineId = 1;
    this.settingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transcription methods
  async createTranscription(transcription: InsertTranscription): Promise<Transcription> {
    const id = this.transcriptionId++;
    const newTranscription: Transcription = { 
      ...transcription, 
      id,
      endTime: null
    };
    this.transcriptions.set(id, newTranscription);
    return newTranscription;
  }

  async getTranscription(id: number): Promise<Transcription | undefined> {
    return this.transcriptions.get(id);
  }

  async getTranscriptionsByUser(userId: number): Promise<Transcription[]> {
    return Array.from(this.transcriptions.values())
      .filter(transcription => transcription.userId === userId);
  }

  async updateTranscription(id: number, endTime: Date): Promise<Transcription | undefined> {
    const transcription = this.transcriptions.get(id);
    if (!transcription) return undefined;

    const updatedTranscription: Transcription = {
      ...transcription,
      endTime
    };
    this.transcriptions.set(id, updatedTranscription);
    return updatedTranscription;
  }

  // Transcript line methods
  async addTranscriptLine(line: InsertTranscriptLine): Promise<TranscriptLine> {
    const id = this.lineId++;
    const newLine: TranscriptLine = {
      ...line,
      id
    };
    this.transcriptLines.set(id, newLine);
    return newLine;
  }

  async getTranscriptLines(transcriptionId: number): Promise<TranscriptLine[]> {
    return Array.from(this.transcriptLines.values())
      .filter(line => line.transcriptionId === transcriptionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getRecentTranscriptLines(transcriptionId: number, count: number): Promise<TranscriptLine[]> {
    return Array.from(this.transcriptLines.values())
      .filter(line => line.transcriptionId === transcriptionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  async markLineAsCopied(id: number): Promise<void> {
    const line = this.transcriptLines.get(id);
    if (line) {
      this.transcriptLines.set(id, { ...line, isCopied: true });
    }
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.userSettings.values())
      .find(setting => setting.userId === userId);
  }

  async createSettings(userSettings: InsertSettings): Promise<Settings> {
    const id = this.settingsId++;
    const newSettings: Settings = {
      ...userSettings,
      id
    };
    this.userSettings.set(id, newSettings);
    return newSettings;
  }

  async updateSettings(userId: number, updatedSettings: UpdateSettings): Promise<Settings | undefined> {
    const existingSettings = Array.from(this.userSettings.values())
      .find(setting => setting.userId === userId);
    
    if (!existingSettings) return undefined;

    const newSettings: Settings = {
      ...existingSettings,
      ...updatedSettings
    };
    
    this.userSettings.set(existingSettings.id, newSettings);
    return newSettings;
  }
}

export const storage = new MemStorage();
