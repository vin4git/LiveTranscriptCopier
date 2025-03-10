// Platform-specific handler implementations
// These are simplified examples - in a real app, these would need to be
// more complex to integrate with each platform's API or use DOM observation
// techniques to capture transcriptions from the UI elements

import { PlatformHandler } from "./transcription-service";

// Base handler with common functionality
abstract class BasePlatformHandler implements PlatformHandler {
  protected isActive: boolean = false;
  protected observer: MutationObserver | null = null;
  protected target: Element | null = null;
  protected callback: ((text: string, speaker?: string) => void) | null = null;
  
  public abstract initialize(): Promise<boolean>;
  
  public isSupported(): boolean {
    return true; // Override in platform-specific implementations
  }
  
  public startCapturing(callback: (text: string, speaker?: string) => void): void {
    this.callback = callback;
    this.isActive = true;
    this.setupObserver();
  }
  
  public stopCapturing(): void {
    this.isActive = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  
  protected abstract setupObserver(): void;
  
  protected processCaptionElement(element: Element): void {
    if (!this.callback || !this.isActive) return;
    
    // Extract text and speaker info from the caption element
    // Implementation varies by platform
    const text = element.textContent || '';
    
    if (text.trim()) {
      this.callback(text);
    }
  }
}

// Zoom handler
export class ZoomHandler extends BasePlatformHandler {
  async initialize(): Promise<boolean> {
    // Look for Zoom caption container
    // In a real implementation, this would be more sophisticated
    this.target = document.querySelector('.caption-container') || 
                 document.querySelector('[aria-label="closed_caption_container"]');
                 
    return !!this.target;
  }
  
  protected setupObserver(): void {
    if (!this.target || !this.callback) return;
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof Element) {
              // Extract speaker and text from Zoom caption elements
              const speakerElement = node.querySelector('.caption-name');
              const textElement = node.querySelector('.caption-text');
              
              if (textElement) {
                const speaker = speakerElement?.textContent?.trim() || undefined;
                const text = textElement.textContent?.trim() || '';
                
                if (text && this.callback) {
                  this.callback(text, speaker);
                }
              } else {
                // If structure is different, try to process the whole node
                this.processCaptionElement(node);
              }
            }
          }
        }
      }
    });
    
    this.observer.observe(this.target, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
  }
  
  public isSupported(): boolean {
    // Check if we're in a Zoom meeting
    return window.location.hostname.includes('zoom.us');
  }
}

// Google Meet handler
export class GoogleMeetHandler extends BasePlatformHandler {
  async initialize(): Promise<boolean> {
    // Look for Google Meet caption container
    this.target = document.querySelector('.Gv8Gvb') || // Caption container class
                 document.querySelector('[data-message-text]'); // Newer version
                 
    return !!this.target;
  }
  
  protected setupObserver(): void {
    if (!this.target || !this.callback) return;
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if ((mutation.type === 'childList' && mutation.addedNodes.length > 0) || 
            mutation.type === 'characterData') {
          
          // Google Meet often updates text in-place, so we need to check
          // the current state when any change happens
          const captionElements = document.querySelectorAll('[data-message-text]');
          
          captionElements.forEach(element => {
            const speaker = element.closest('[data-sender-name]')?.getAttribute('data-sender-name') || undefined;
            const text = element.textContent?.trim() || '';
            
            if (text && this.callback) {
              this.callback(text, speaker);
            }
          });
        }
      }
    });
    
    this.observer.observe(this.target, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
  }
  
  public isSupported(): boolean {
    // Check if we're in a Google Meet
    return window.location.hostname.includes('meet.google.com');
  }
}

// Microsoft Teams handler
export class TeamsHandler extends BasePlatformHandler {
  async initialize(): Promise<boolean> {
    // Look for Teams caption container
    this.target = document.querySelector('.ui-chat__message-list') || 
                 document.querySelector('.ts-captions-container');
                 
    return !!this.target;
  }
  
  protected setupObserver(): void {
    if (!this.target || !this.callback) return;
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof Element) {
              // Extract from Teams caption elements
              const speakerElement = node.querySelector('.ui-chat__message__author');
              const textElement = node.querySelector('.ui-chat__message__content');
              
              if (textElement) {
                const speaker = speakerElement?.textContent?.trim() || undefined;
                const text = textElement.textContent?.trim() || '';
                
                if (text && this.callback) {
                  this.callback(text, speaker);
                }
              } else {
                // If structure is different, try to process the whole node
                this.processCaptionElement(node);
              }
            }
          }
        }
      }
    });
    
    this.observer.observe(this.target, { 
      childList: true, 
      subtree: true
    });
  }
  
  public isSupported(): boolean {
    // Check if we're in a Teams meeting
    return window.location.hostname.includes('teams.microsoft.com') || 
           window.location.hostname.includes('teams.live.com');
  }
}

// WebEx handler
export class WebExHandler extends BasePlatformHandler {
  async initialize(): Promise<boolean> {
    // Look for WebEx caption container
    this.target = document.querySelector('.captionsView') || 
                 document.querySelector('.caption-text-container');
                 
    return !!this.target;
  }
  
  protected setupObserver(): void {
    if (!this.target || !this.callback) return;
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof Element) {
              // Extract from WebEx caption elements
              const textElement = node.querySelector('.caption-text');
              const speakerElement = node.querySelector('.caption-name');
              
              if (textElement) {
                const speaker = speakerElement?.textContent?.trim() || undefined;
                const text = textElement.textContent?.trim() || '';
                
                if (text && this.callback) {
                  this.callback(text, speaker);
                }
              } else {
                // If structure is different, try to process the whole node
                this.processCaptionElement(node);
              }
            }
          }
        }
      }
    });
    
    this.observer.observe(this.target, { 
      childList: true, 
      subtree: true
    });
  }
  
  public isSupported(): boolean {
    // Check if we're in a WebEx meeting
    return window.location.hostname.includes('webex.com');
  }
}

// YouTube handler
export class YouTubeHandler extends BasePlatformHandler {
  async initialize(): Promise<boolean> {
    // Look for YouTube caption container
    this.target = document.querySelector('.ytp-caption-segment') || 
                 document.querySelector('.captions-text') ||
                 document.querySelector('.caption-window');
                 
    return !!this.target;
  }
  
  protected setupObserver(): void {
    if (!this.target || !this.callback) return;
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if ((mutation.type === 'childList' && mutation.addedNodes.length > 0) ||
            mutation.type === 'characterData') {
          
          // YouTube updates captions frequently, check all caption elements
          const captionElements = document.querySelectorAll('.ytp-caption-segment');
          
          if (captionElements.length > 0) {
            // Combine all segments into one caption if there are multiple
            const fullText = Array.from(captionElements)
              .map(el => el.textContent?.trim() || '')
              .filter(text => text.length > 0)
              .join(' ');
            
            if (fullText && this.callback) {
              // YouTube doesn't typically show speaker names in captions
              this.callback(fullText);
            }
          } else {
            // Try alternate caption selectors
            const altCaptionElement = document.querySelector('.captions-text') || 
                                     document.querySelector('.caption-window');
            
            if (altCaptionElement) {
              const text = altCaptionElement.textContent?.trim() || '';
              
              if (text && this.callback) {
                this.callback(text);
              }
            }
          }
        }
      }
    });
    
    // Observe both the caption container and document body as YouTube
    // might recreate caption elements
    this.observer.observe(this.target, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    
    // Also observe the body to catch when caption container is recreated
    const body = document.body;
    if (body) {
      const bodyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Check if caption container has been added/updated
            const newTarget = document.querySelector('.ytp-caption-segment') || 
                             document.querySelector('.captions-text') ||
                             document.querySelector('.caption-window');
            
            if (newTarget && newTarget !== this.target) {
              // Update target and setup observer again
              this.target = newTarget;
              if (this.observer) {
                this.observer.disconnect();
              }
              this.setupObserver();
              return;
            }
          }
        }
      });
      
      bodyObserver.observe(body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  public isSupported(): boolean {
    // Check if we're on YouTube
    return window.location.hostname.includes('youtube.com');
  }
}

// Function to get the appropriate handler based on platform
export function getPlatformHandler(platform: string): PlatformHandler {
  switch (platform) {
    case 'zoom':
      return new ZoomHandler();
    case 'meet':
      return new GoogleMeetHandler();
    case 'teams':
      return new TeamsHandler();
    case 'webex':
      return new WebExHandler();
    case 'youtube':
      return new YouTubeHandler();
    default:
      // Fallback to WebSpeech API via an extension is not implemented here
      return new ZoomHandler(); // Default fallback
  }
}
