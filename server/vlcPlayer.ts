// Use direct VLC command line approach instead of the problematic npm package
import path from 'path';
import { spawn } from 'child_process';

interface VLCPlayerInstance {
  id: string;
  port: number;
  player: any;
  videoPath: string;
  isReady: boolean;
}

export class VLCPlayerService {
  private players: Map<string, VLCPlayerInstance> = new Map();
  private startPort = 8081;

  async createPlayer(videoId: string, videoPath: string): Promise<number> {
    // Use the direct VLC command line approach
    return this.createDirectVLCStream(videoId, videoPath);
  }

  async destroyPlayer(videoId: string): Promise<void> {
    const instance = this.players.get(videoId);
    if (instance) {
      try {
        console.log(`Destroying VLC player for video ${videoId}`);
        if (instance.player && instance.player.kill) {
          instance.player.kill();
        }
        this.players.delete(videoId);
      } catch (error) {
        console.error(`Error destroying VLC player for video ${videoId}:`, error);
      }
    }
  }

  getPlayerPort(videoId: string): number | null {
    const instance = this.players.get(videoId);
    return instance && instance.isReady ? instance.port : null;
  }

  getStreamUrl(videoId: string): string | null {
    const port = this.getPlayerPort(videoId);
    if (port) {
      return `http://localhost:${port}/stream`;
    }
    return null;
  }

  private getNextAvailablePort(): number {
    const usedPorts = Array.from(this.players.values()).map(p => p.port);
    let port = this.startPort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }

  // Alternative: Use VLC command line directly for better control
  async createDirectVLCStream(videoId: string, videoPath: string): Promise<number> {
    const port = this.getNextAvailablePort();
    
    return new Promise((resolve, reject) => {
      const vlcArgs = [
        videoPath,
        '--intf', 'dummy',                    // No GUI interface
        '--extraintf', 'http',                // Enable HTTP interface
        '--http-host', '0.0.0.0',             // Listen on all interfaces
        '--http-port', port.toString(),       // HTTP interface port
        '--http-password', 'vlc123',          // HTTP password
        '--sout', `#http{mux=ts,dst=:${port + 1000}/stream}`, // Stream output
        '--sout-keep',                        // Keep stream active
        '--no-sout-display',                  // Don't display locally
        '--no-audio',                         // Disable audio for testing
        '--no-video-title-show',              // Don't show title
        '--quiet'                             // Reduce console output
      ];

      console.log(`Starting VLC stream for video ${videoId}:`, 'vlc', vlcArgs.join(' '));
      
      const vlcProcess = spawn('vlc', vlcArgs);

      let isResolved = false;

      vlcProcess.stdout.on('data', (data) => {
        console.log(`VLC stdout ${videoId}:`, data.toString());
      });

      vlcProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`VLC stderr ${videoId}:`, output);
        
        // Look for signs that VLC is ready
        if (output.includes('http interface') || output.includes('listening on')) {
          if (!isResolved) {
            isResolved = true;
            console.log(`VLC direct stream ready for video ${videoId} on port ${port + 1000}`);
            
            // Store the process reference
            this.players.set(videoId, {
              id: videoId,
              port: port + 1000,
              player: vlcProcess,
              videoPath: videoPath,
              isReady: true
            });
            
            resolve(port + 1000);
          }
        }
      });

      vlcProcess.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          console.error(`VLC process error for video ${videoId}:`, error);
          reject(error);
        }
      });

      vlcProcess.on('exit', (code) => {
        console.log(`VLC process exited for video ${videoId} with code:`, code);
        this.players.delete(videoId);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log(`VLC stream timeout, assuming ready for video ${videoId}`);
          
          this.players.set(videoId, {
            id: videoId,
            port: port + 1000,
            player: vlcProcess,
            videoPath: videoPath,
            isReady: true
          });
          
          resolve(port + 1000);
        }
      }, 5000);
    });
  }

  // Clean up all players
  async cleanup(): Promise<void> {
    console.log('Cleaning up all VLC players...');
    const videoIds = Array.from(this.players.keys());
    for (const videoId of videoIds) {
      await this.destroyPlayer(videoId);
    }
  }
}

export const vlcPlayerService = new VLCPlayerService();

// Clean up on process exit
process.on('exit', () => vlcPlayerService.cleanup());
process.on('SIGINT', () => vlcPlayerService.cleanup());
process.on('SIGTERM', () => vlcPlayerService.cleanup());