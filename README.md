# LiveTranscriptCopier

LiveTranscriptCopier is a real-time transcription management tool that captures and organizes live captions from various video conferencing and streaming platforms. It provides a seamless way to copy, format, and save transcriptions during live sessions.

## Features

### Multi-Platform Support
- **Zoom**: Capture transcriptions from Zoom meetings
- **Google Meet**: Support for Google Meet captions
- **Microsoft Teams**: Integration with Teams live captions
- **Cisco WebEx**: Compatible with WebEx transcription
- **YouTube**: Capture auto-generated captions from live streams

### Real-Time Management
- Live transcription capture and display
- Automatic timestamp tracking
- Speaker identification (when available)
- Real-time copy to clipboard functionality

### Smart Features
- **Auto-Copy**: Automatically copy new transcriptions to clipboard
- **Text Cleanup**: Remove unnecessary formatting and standardize text
- **Target Application Support**: 
  - Text Editor (Default)
  - Microsoft Word
  - Google Docs
  - Notepad
  - Custom application support

### User Interface
- Clean, modern interface with light/dark mode support
- Split-panel view with control panel and transcription display
- Real-time status indicators
- Easy meeting name customization

## Technical Stack

### Frontend
- React with TypeScript
- TanStack Query for data management
- WebSocket for real-time updates
- Tailwind CSS for styling
- shadcn/ui components

### Backend
- Express.js server
- WebSocket server for real-time communication
- In-memory storage with interface-based design
- TypeScript for type safety


## Setup

1. **Prerequisites**
   - Node.js (v20 or later)
   - npm package manager

2. **Installation**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   npm run dev
   ```
   This will start both the frontend and backend servers.

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Usage

1. **Start a Session**
   - Select your meeting platform (Zoom, Meet, Teams, etc.)
   - Enable transcription in your meeting platform
   - Click "Enable Transcription" in LiveTranscriptCopier

2. **Configure Settings**
   - Toggle auto-copy functionality
   - Enable/disable text cleanup
   - Select target application
   - Customize meeting name

3. **During the Meeting**
   - View live transcriptions in real-time
   - Manually copy specific lines if needed
   - Save complete transcript at any time

4. **After the Meeting**
   - Export full transcript as text file
   - Access historical transcriptions
   - Review and organize saved content

## Project Structure
```
LiveTranscriptCopier/
├── client/
│   └── src/
│       ├── components/
│       │   ├── ControlPanel.tsx    # Settings and control interface
│       │   └── TranscriptionPanel.tsx  # Main transcription display
│       └── pages/
│           └── Home.tsx    # Main application page
├── server/
│   ├── storage.ts    # Data storage implementation
│   └── routes.ts     # API endpoints
└── shared/
    └── schema.ts     # Shared type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
