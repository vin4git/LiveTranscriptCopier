import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Video, Radio, MessageSquare, Monitor } from "lucide-react";
import { TranscriptionSettings } from "@/pages/Home";

interface ControlPanelProps {
  settings: TranscriptionSettings;
  updateSettings: (settings: Partial<TranscriptionSettings>) => void;
  isTranscribing: boolean;
  startTranscription: () => void;
  stopTranscription: () => void;
  saveTranscript: () => void;
  lastCopied: string | null;
}

export default function ControlPanel({
  settings,
  updateSettings,
  isTranscribing,
  startTranscription,
  stopTranscription,
  saveTranscript,
  lastCopied
}: ControlPanelProps) {
  const [activePlatform, setActivePlatform] = useState<string>(settings.platform);
  
  const handlePlatformChange = (platform: string) => {
    setActivePlatform(platform);
    updateSettings({ platform: platform as 'zoom' | 'meet' | 'teams' | 'webex' });
  };
  
  const handleToggleChange = (key: keyof TranscriptionSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };
  
  const handleAppChange = (value: string) => {
    updateSettings({ targetApp: value });
  };
  
  return (
    <div className="w-full md:w-80 border-r border-neutral-200 bg-neutral-100 p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-700 mb-3">Meeting Platform</h2>
        {/* Platform selection tabs */}
        <div className="flex flex-wrap border-b border-neutral-200">
          <button 
            className={`platform-tab flex items-center py-2 px-3 text-sm font-medium ${activePlatform === 'zoom' ? 'active border-b-2 border-primary text-primary' : ''}`}
            onClick={() => handlePlatformChange('zoom')}
          >
            <Video className="w-4 h-4 mr-1" />
            Zoom
          </button>
          <button 
            className={`platform-tab flex items-center py-2 px-3 text-sm font-medium ${activePlatform === 'meet' ? 'active border-b-2 border-primary text-primary' : ''}`}
            onClick={() => handlePlatformChange('meet')}
          >
            <Radio className="w-4 h-4 mr-1" />
            Meet
          </button>
          <button 
            className={`platform-tab flex items-center py-2 px-3 text-sm font-medium ${activePlatform === 'teams' ? 'active border-b-2 border-primary text-primary' : ''}`}
            onClick={() => handlePlatformChange('teams')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Teams
          </button>
          <button 
            className={`platform-tab flex items-center py-2 px-3 text-sm font-medium ${activePlatform === 'webex' ? 'active border-b-2 border-primary text-primary' : ''}`}
            onClick={() => handlePlatformChange('webex')}
          >
            <Monitor className="w-4 h-4 mr-1" />
            WebEx
          </button>
          <button 
            className={`platform-tab flex items-center py-2 px-3 text-sm font-medium ${activePlatform === 'youtube' ? 'active border-b-2 border-primary text-primary' : ''}`}
            onClick={() => handlePlatformChange('youtube')}
          >
            <Video className="w-4 h-4 mr-1" />
            YouTube
          </button>
        </div>
        <div className="mt-2 overflow-auto h-12">
          {activePlatform === 'zoom' && (
            <div className="platform-content">
              <p className="text-xs text-neutral-500">Capture transcriptions from Zoom meetings. Make sure Zoom's transcription feature is enabled.</p>
            </div>
          )}
          {activePlatform === 'meet' && (
            <div className="platform-content">
              <p className="text-xs text-neutral-500">Capture transcriptions from Google Meet. Captions must be turned on in the meeting.</p>
            </div>
          )}
          {activePlatform === 'teams' && (
            <div className="platform-content">
              <p className="text-xs text-neutral-500">Capture transcriptions from Microsoft Teams. Make sure Live Captions are enabled in your meeting.</p>
            </div>
          )}
          {activePlatform === 'webex' && (
            <div className="platform-content">
              <p className="text-xs text-neutral-500">Capture transcriptions from Cisco WebEx. Ensure that transcription or closed captions are turned on.</p>
            </div>
          )}
          {activePlatform === 'youtube' && (
            <div className="platform-content">
              <p className="text-xs text-neutral-500">Capture auto-generated captions from YouTube videos. Enable subtitles on the video player.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-700 mb-3">Transcription Settings</h2>
        
        {/* Transcription toggle */}
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="capture-toggle" className="text-sm">Enable Transcription</Label>
          <Switch 
            id="capture-toggle" 
            checked={isTranscribing} 
            onCheckedChange={(checked) => {
              if (checked) {
                startTranscription();
              } else {
                stopTranscription();
              }
            }}
          />
        </div>
        
        {/* Auto-copy toggle */}
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="copy-toggle" className="text-sm">Auto-copy to Clipboard</Label>
          <Switch 
            id="copy-toggle" 
            checked={settings.autoCopy} 
            onCheckedChange={(checked) => handleToggleChange('autoCopy', checked)}
          />
        </div>
        
        {/* Text cleanup toggle */}
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="cleanup-toggle" className="text-sm">Clean Formatting</Label>
          <Switch 
            id="cleanup-toggle" 
            checked={settings.cleanFormatting} 
            onCheckedChange={(checked) => handleToggleChange('cleanFormatting', checked)}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-700 mb-3">Target Application</h2>
        <Select
          value={settings.targetApp}
          onValueChange={handleAppChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a target application" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Text Editor (Default)</SelectItem>
            <SelectItem value="word">Microsoft Word</SelectItem>
            <SelectItem value="docs">Google Docs</SelectItem>
            <SelectItem value="notepad">Notepad</SelectItem>
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-700 mb-3">Status</h2>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full ${isTranscribing ? 'bg-secondary' : 'bg-neutral-300'} mr-2`}></div>
          <span className="text-sm font-medium">
            {isTranscribing ? 'Transcription Active' : 'Transcription Inactive'}
          </span>
        </div>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full ${settings.autoCopy ? 'bg-secondary' : 'bg-neutral-300'} mr-2`}></div>
          <span className="text-sm font-medium">
            {settings.autoCopy ? 'Auto-copy Enabled' : 'Auto-copy Disabled'}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-neutral-400">
            {lastCopied ? `Last copied: ${lastCopied}` : 'No transcriptions copied yet'}
          </span>
        </div>
      </div>
      
      <div className="mt-auto">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white"
          onClick={saveTranscript}
        >
          <Upload className="mr-2 h-4 w-4" />
          Save Transcript
        </Button>
      </div>
    </div>
  );
}
