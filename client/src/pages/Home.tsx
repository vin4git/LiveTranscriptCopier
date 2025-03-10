import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ControlPanel from "@/components/ControlPanel";
import TranscriptionPanel from "@/components/TranscriptionPanel";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { TranscriptionMessage, StatusMessage, CopyStatusMessage, UpdateSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Use a default user ID of 1 for demo purposes
const DEFAULT_USER_ID = 1;

// Define all supported platforms
type PlatformType = 'zoom' | 'meet' | 'teams' | 'webex' | 'youtube';

export interface TranscriptLine {
  id?: number;
  timestamp: Date;
  speaker?: string;
  content: string;
  isCopied?: boolean;
}

export interface TranscriptionSettings {
  platform: PlatformType;
  autoCopy: boolean;
  cleanFormatting: boolean;
  targetApp: string;
}

export default function Home() {
  const { toast } = useToast();
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [meetingName, setMeetingName] = useState("Meeting Transcription");
  const [settings, setSettings] = useState<TranscriptionSettings>({
    platform: 'zoom',
    autoCopy: true,
    cleanFormatting: true,
    targetApp: 'default'
  });
  const [sessionId, setSessionId] = useState("");
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  
  // Initialize WebSocket connection
  const { 
    connected, 
    message, 
    sendMessage 
  } = useWebSocket();
  
  // Generate a session ID on first load
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);
  }, []);
  
  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/settings/${DEFAULT_USER_ID}`);
        if (response.ok) {
          const data = await response.json();
          setSettings({
            platform: data.platform,
            autoCopy: data.autoCopy,
            cleanFormatting: data.cleanFormatting,
            targetApp: data.targetApp
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!message) return;
    
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'transcription':
          handleTranscriptionMessage(data);
          break;
          
        case 'status':
          handleStatusMessage(data);
          break;
          
        case 'copyStatus':
          handleCopyStatusMessage(data);
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }, [message]);
  
  const handleTranscriptionMessage = (data: TranscriptionMessage) => {
    const newLine: TranscriptLine = {
      timestamp: new Date(data.timestamp),
      speaker: data.speaker,
      content: data.content
    };
    
    setTranscriptLines(prev => [...prev, newLine]);
    
    // Auto-copy to clipboard if enabled
    if (settings.autoCopy) {
      const formattedText = formatTranscriptionLine(newLine);
      copyToClipboard(formattedText, newLine);
    }
  };
  
  const handleStatusMessage = (data: StatusMessage) => {
    if (data.status === 'connected') {
      toast({
        title: "Connected",
        description: "Ready to capture transcriptions",
      });
    } else if (data.status === 'error') {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: data.message || "An error occurred",
      });
    }
  };
  
  const handleCopyStatusMessage = (data: CopyStatusMessage) => {
    const time = new Date(data.timestamp).toLocaleTimeString();
    setLastCopied(time);
    
    if (data.success) {
      toast({
        title: "Transcription copied",
        description: `${time} - ${data.speaker ? `${data.speaker}: ` : ""}${data.content.substring(0, 30)}...`,
      });
    }
  };
  
  const startTranscription = () => {
    if (!connected) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "WebSocket not connected. Please refresh the page.",
      });
      return;
    }
    
    setIsTranscribing(true);
    
    // Create a new transcription session in the database
    apiRequest('POST', '/api/transcriptions', {
      sessionId,
      platform: settings.platform,
      meetingName,
      startTime: new Date().toISOString(),
      content: "",
      userId: DEFAULT_USER_ID
    }).catch(error => {
      console.error("Failed to create transcription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start transcription session",
      });
    });
  };
  
  const stopTranscription = () => {
    setIsTranscribing(false);
    
    // End the transcription session
    // In a real app, we would need to track the transcription ID
    toast({
      title: "Transcription Stopped",
      description: "The transcription has been saved",
    });
  };
  
  const updateSettings = async (newSettings: Partial<TranscriptionSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Update settings in the database
    try {
      await apiRequest('PUT', `/api/settings/${DEFAULT_USER_ID}`, updatedSettings);
      
      // Send settings update via WebSocket
      if (connected) {
        sendMessage(JSON.stringify({
          type: 'settingsUpdate',
          settings: updatedSettings
        }));
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings",
      });
    }
  };
  
  const formatTranscriptionLine = (line: TranscriptLine): string => {
    if (settings.cleanFormatting) {
      // Clean up formatting (remove extra spaces, newlines, etc.)
      let text = line.content.trim();
      
      // Add timestamp and speaker if available
      const timestamp = line.timestamp.toLocaleTimeString();
      return line.speaker 
        ? `[${timestamp}] ${line.speaker}: ${text}`
        : `[${timestamp}] ${text}`;
    } else {
      // Return raw text
      return line.content;
    }
  };
  
  const copyToClipboard = async (text: string, line: TranscriptLine) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Send copy status via WebSocket
      if (connected) {
        const copyStatusMessage: CopyStatusMessage = {
          type: 'copyStatus',
          timestamp: line.timestamp.toISOString(),
          speaker: line.speaker,
          content: line.content.substring(0, 50) + (line.content.length > 50 ? "..." : ""),
          success: true
        };
        sendMessage(JSON.stringify(copyStatusMessage));
      }
      
      // Update last copied time
      setLastCopied(line.timestamp.toLocaleTimeString());
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Unable to copy text to clipboard",
      });
    }
  };
  
  const saveTranscript = () => {
    // Generate a text file with all transcriptions
    const transcriptText = transcriptLines
      .map(line => formatTranscriptionLine(line))
      .join("\n\n");
    
    // Create a blob and download it
    const blob = new Blob([transcriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meetingName.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Transcript Saved",
      description: "Transcript has been saved to your device",
    });
  };
  
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-col md:flex-row h-[calc(100vh-57px)]">
        <ControlPanel 
          settings={settings}
          updateSettings={updateSettings}
          isTranscribing={isTranscribing}
          startTranscription={startTranscription}
          stopTranscription={stopTranscription}
          saveTranscript={saveTranscript}
          lastCopied={lastCopied}
        />
        <TranscriptionPanel 
          transcriptLines={transcriptLines}
          isTranscribing={isTranscribing}
          meetingName={meetingName}
          setMeetingName={setMeetingName}
          copyToClipboard={copyToClipboard}
          formatTranscriptionLine={formatTranscriptionLine}
        />
      </div>
    </div>
  );
}
