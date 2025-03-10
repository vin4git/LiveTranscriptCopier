import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Copy, Save, X } from "lucide-react";
import { TranscriptLine } from "@/pages/Home";
import { Input } from "@/components/ui/input";

interface TranscriptionPanelProps {
  transcriptLines: TranscriptLine[];
  isTranscribing: boolean;
  meetingName: string;
  setMeetingName: (name: string) => void;
  copyToClipboard: (text: string, line: TranscriptLine) => void;
  formatTranscriptionLine: (line: TranscriptLine) => string;
}

export default function TranscriptionPanel({
  transcriptLines,
  isTranscribing,
  meetingName,
  setMeetingName,
  copyToClipboard,
  formatTranscriptionLine,
}: TranscriptionPanelProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(meetingName);
  
  const handleSaveName = () => {
    setMeetingName(nameInput);
    setEditingName(false);
  };
  
  const handleCopyLine = (line: TranscriptLine) => {
    const formattedText = formatTranscriptionLine(line);
    copyToClipboard(formattedText, line);
  };
  
  const startDate = new Date().toLocaleDateString();
  const startTime = transcriptLines.length > 0 
    ? transcriptLines[0].timestamp.toLocaleTimeString() 
    : new Date().toLocaleTimeString();
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-200 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" title="Copy all">
            <Clipboard className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Save">
            <Save className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="Clear">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Transcription Content */}
      <div className="flex-1 p-4 overflow-auto transcription-text">
        <div className="max-w-3xl mx-auto">
          <div className="border-b border-neutral-200 pb-3 mb-4">
            {editingName ? (
              <div className="flex items-center">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mr-2"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveName}>Save</Button>
              </div>
            ) : (
              <h2 
                className="text-xl font-medium text-neutral-700 mb-1 cursor-pointer"
                onClick={() => setEditingName(true)}
              >
                {meetingName}
              </h2>
            )}
            <div className="flex text-sm text-neutral-500">
              <span>{startDate}</span>
              <span className="mx-2">•</span>
              <span>Started {startTime}</span>
            </div>
          </div>
          
          {/* Transcript content */}
          {transcriptLines.map((line, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-start mb-2 group">
                <div className="w-12 text-xs text-neutral-400 pt-1">
                  {line.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="flex-1">
                  {line.speaker && (
                    <div className="text-sm font-medium text-neutral-600">{line.speaker}</div>
                  )}
                  <p className="text-neutral-700">{line.content}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => handleCopyLine(line)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Transcribing indicator */}
          {isTranscribing && (
            <div className="flex items-center text-neutral-500 text-sm mt-2 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              Transcribing...
            </div>
          )}
          
          {/* Empty state */}
          {transcriptLines.length === 0 && !isTranscribing && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 text-neutral-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">No Transcriptions Yet</h3>
              <p className="text-neutral-500 max-w-md">
                Enable transcription to start capturing text from your meeting.
                Make sure captions are turned on in your meeting platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
