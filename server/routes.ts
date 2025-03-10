import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertTranscriptionSchema, 
  insertTranscriptLineSchema, 
  updateSettingsSchema,
  WebSocketMessage,
  TranscriptionMessage,
  StatusMessage,
  CopyStatusMessage
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  sessionId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Set up WebSocket connection handling
  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    console.log('WebSocket client connected');
    
    // Send connection status
    const statusMessage: StatusMessage = {
      type: 'status',
      status: 'connected'
    };
    ws.send(JSON.stringify(statusMessage));
    
    // Handle messages from client
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message) as WebSocketMessage;
        
        // Handle different message types
        switch (data.type) {
          case 'transcription':
            handleTranscriptionMessage(ws, data);
            break;
            
          case 'settingsUpdate':
            handleSettingsUpdate(ws, data);
            break;
            
          case 'copyStatus':
            handleCopyStatus(ws, data);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        const errorMessage: StatusMessage = {
          type: 'status',
          status: 'error',
          message: 'Error processing message'
        };
        ws.send(JSON.stringify(errorMessage));
      }
    });
    
    // Handle ping to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Keep connections alive with ping
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // API Endpoints
  app.post('/api/transcriptions', async (req, res) => {
    try {
      const transcriptionData = insertTranscriptionSchema.parse(req.body);
      const newTranscription = await storage.createTranscription(transcriptionData);
      res.status(201).json(newTranscription);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Error creating transcription' });
      }
    }
  });
  
  app.get('/api/transcriptions', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const transcriptions = await storage.getTranscriptionsByUser(userId);
      res.json(transcriptions);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching transcriptions' });
    }
  });
  
  app.get('/api/transcriptions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transcription ID' });
      }
      
      const transcription = await storage.getTranscription(id);
      if (!transcription) {
        return res.status(404).json({ error: 'Transcription not found' });
      }
      
      res.json(transcription);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching transcription' });
    }
  });
  
  app.put('/api/transcriptions/:id/end', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transcription ID' });
      }
      
      const updatedTranscription = await storage.updateTranscription(id, new Date());
      if (!updatedTranscription) {
        return res.status(404).json({ error: 'Transcription not found' });
      }
      
      res.json(updatedTranscription);
    } catch (error) {
      res.status(500).json({ error: 'Error updating transcription' });
    }
  });
  
  app.get('/api/transcriptions/:id/lines', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transcription ID' });
      }
      
      const lines = await storage.getTranscriptLines(id);
      res.json(lines);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching transcript lines' });
    }
  });
  
  app.post('/api/transcriptions/:id/lines', async (req, res) => {
    try {
      const transcriptionId = parseInt(req.params.id);
      if (isNaN(transcriptionId)) {
        return res.status(400).json({ error: 'Invalid transcription ID' });
      }
      
      const lineData = insertTranscriptLineSchema.parse({
        ...req.body,
        transcriptionId
      });
      
      const newLine = await storage.addTranscriptLine(lineData);
      res.status(201).json(newLine);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Error adding transcript line' });
      }
    }
  });
  
  app.get('/api/settings/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      let userSettings = await storage.getSettings(userId);
      
      if (!userSettings) {
        // Create default settings if none exist
        userSettings = await storage.createSettings({
          userId,
          platform: 'zoom',
          autoCopy: true,
          cleanFormatting: true,
          targetApp: 'default'
        });
      }
      
      res.json(userSettings);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching settings' });
    }
  });
  
  app.put('/api/settings/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const settingsData = updateSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(userId, settingsData);
      
      if (!updatedSettings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      // Broadcast settings update to all connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'settingsUpdate',
            settings: updatedSettings
          }));
        }
      });
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: 'Error updating settings' });
      }
    }
  });
  
  return httpServer;
}

// Helper functions for WebSocket message handling
async function handleTranscriptionMessage(ws: ExtendedWebSocket, message: TranscriptionMessage) {
  // Store the session ID with the WebSocket connection
  ws.sessionId = message.sessionId;
  
  // Broadcast the transcription to all connected clients
  // In a real app, we might filter by user or session
  const clients = Array.from(ws.constructor['clients']);
  clients.forEach((client: ExtendedWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  
  // TODO: Store the transcription in the database
  // This would require finding the transcription ID from the session ID
}

async function handleSettingsUpdate(ws: ExtendedWebSocket, message: any) {
  try {
    const settingsData = updateSettingsSchema.parse(message.settings);
    // Here we would update the settings in the database
    // For now, just acknowledge the update
    ws.send(JSON.stringify({
      type: 'status',
      status: 'connected',
      message: 'Settings updated'
    }));
  } catch (error) {
    const errorMessage: StatusMessage = {
      type: 'status',
      status: 'error',
      message: 'Invalid settings data'
    };
    ws.send(JSON.stringify(errorMessage));
  }
}

async function handleCopyStatus(ws: ExtendedWebSocket, message: CopyStatusMessage) {
  // Broadcast copy status to all clients
  // Could be filtered by session or user in a real application
  const clients = Array.from(ws.constructor['clients']);
  clients.forEach((client: ExtendedWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
