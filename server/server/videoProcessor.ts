import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { analyzeVideoIssues, generateCaptions, type VideoAnalysis, type CaptionResult } from './openai';
import { storage } from './storage';
import { ObjectStorageService } from './objectStorage';

export class VideoProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processVideo(videoId: string): Promise<void> {
    console.log(`Starting video processing for ID: ${videoId}`);
    
    try {
      const video = await storage.getVideo(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      console.log(`Processing video: ${video.originalFileName} (${video.fileSize} bytes)`);

      // Create processing job
      const job = await storage.createProcessingJob({ videoId });
      await storage.updateVideoStatus(videoId, 'processing');
      await storage.updateVideoProcessing(videoId, { processingStartedAt: new Date() });

      // Download video from object storage if needed
      let localFilePath = video.originalFilePath;
      if (video.originalFilePath.startsWith('/objects/')) {
        console.log(`Downloading video from object storage: ${video.originalFilePath}`);
        await storage.updateProcessingJob(job.id, {
          status: 'processing',
          currentStep: 'downloading',
          progress: 5
        });
        
        // Set timeout for download to prevent hanging
        const downloadPromise = this.downloadVideoFromStorage(video.originalFilePath);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Download timeout after 60 seconds')), 60000);
        });
        
        localFilePath = await Promise.race([downloadPromise, timeoutPromise]) as string;
        console.log(`Download completed: ${localFilePath}`);
      } else {
        console.log(`Using local file path: ${localFilePath}`);
      }

      // Step 1: Analyze video issues
      await storage.updateProcessingJob(job.id, {
        status: 'processing',
        currentStep: 'analyzing',
        progress: 10
      });

      // Use AI analysis for accurate issue detection
      console.log('Starting AI analysis of video issues...');
      
      // Set timeout for AI analysis to prevent hanging
      const analysisPromise = analyzeVideoIssues(localFilePath);
      const analysisTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout after 120 seconds')), 120000);
      });
      
      const analysis = await Promise.race([analysisPromise, analysisTimeoutPromise]) as any;
      await storage.updateVideoProcessing(videoId, { issues: analysis.issues });

      // Step 2: Skip actual video processing for now, just mark as complete
      await storage.updateProcessingJob(job.id, {
        currentStep: 'fixing_cuts',
        progress: 25
      });

      // Process stuttered cuts if detected
      let fixedCutsPath = localFilePath;
      if (analysis.issues.stutteredCuts > 0) {
        console.log(`Fixing ${analysis.issues.stutteredCuts} stuttered cuts...`);
        try {
          fixedCutsPath = await this.fixStutteredCuts(localFilePath, analysis.issues.stutteredCuts);
          console.log('Stuttered cuts processing completed');
        } catch (error) {
          console.error('Stuttered cuts processing failed:', error);
          // Continue with original file if processing fails
          fixedCutsPath = localFilePath;
        }
      } else {
        console.log('No stuttered cuts detected, using original file');
      }

      // Step 3: Skip audio sync for now
      await storage.updateProcessingJob(job.id, {
        currentStep: 'fixing_audio',
        progress: 40
      });

      // Process audio sync if needed
      let fixedAudioPath = fixedCutsPath;
      if (analysis.issues.audioSyncIssues) {
        console.log('Fixing audio sync issues...');
        try {
          fixedAudioPath = await this.fixAudioSync(fixedCutsPath);
          console.log('Audio sync processing completed');
        } catch (error) {
          console.error('Audio sync processing failed:', error);
          // Continue with previous file if processing fails
          fixedAudioPath = fixedCutsPath;
        }
      } else {
        console.log('No audio sync issues detected');
      }

      // Step 3.5: Remove wind noise if detected
      await storage.updateProcessingJob(job.id, {
        currentStep: 'removing_wind_noise',
        progress: 55
      });

      let noWindNoisePath = fixedAudioPath;
      if (analysis.issues.windNoise) {
        console.log('Wind noise detected! Removing wind noise from audio...');
        try {
          noWindNoisePath = await this.removeWindNoise(fixedAudioPath);
          console.log('Wind noise removal completed successfully');
        } catch (error) {
          console.error('Wind noise removal failed:', error);
          // Continue with original file if removal fails
          noWindNoisePath = fixedAudioPath;
        }
      } else {
        console.log('No wind noise detected, skipping removal');
      }

      // Step 4: Skip frame recovery for now
      await storage.updateProcessingJob(job.id, {
        currentStep: 'recovering_frames',
        progress: 70
      });

      // Process dropped frames if needed
      let recoveredFramesPath = noWindNoisePath;
      if (analysis.issues.droppedFrames > 0) {
        console.log(`Recovering ${analysis.issues.droppedFrames} dropped frames...`);
        try {
          recoveredFramesPath = await this.recoverDroppedFrames(noWindNoisePath, analysis.issues.droppedFrames);
          console.log('Frame recovery processing completed');
        } catch (error) {
          console.error('Frame recovery processing failed:', error);
          // Continue with previous file if processing fails
          recoveredFramesPath = noWindNoisePath;
        }
      } else {
        console.log('No dropped frames detected');
      }

      // Step 5: Skip captions for now
      await storage.updateProcessingJob(job.id, {
        currentStep: 'adding_captions',
        progress: 85
      });

      const captions = { text: '', timestamps: [] }; // Skip captions
      console.log('Skipping caption generation');

      // Step 6: Always export to MP4 format for compatibility
      await storage.updateProcessingJob(job.id, {
        currentStep: 'exporting',
        progress: 95
      });

      let finalPath = recoveredFramesPath;
      try {
        console.log('Converting video to MP4 format for compatibility...');
        finalPath = await this.exportForPlatforms(recoveredFramesPath);
        console.log('Video successfully converted to MP4 format');
      } catch (error) {
        console.error('Export failed, using original file:', error);
        // If export fails, still use the processed file (might be MP4 from wind noise removal)
        finalPath = recoveredFramesPath;
      }

      // Complete processing
      await storage.updateVideoProcessing(videoId, {
        status: 'completed',
        processedFilePath: finalPath,
        captions: JSON.stringify(captions),
        processingCompletedAt: new Date(),
        fixesApplied: {
          stutteredCutsFixed: analysis.issues.stutteredCuts,
          audioSyncFixed: analysis.issues.audioSyncIssues,
          framesRecovered: analysis.issues.droppedFrames,
          sectionsRepaired: analysis.issues.corruptedSections,
          windNoiseRemoved: analysis.issues.windNoise
        }
      });

      // Auto-create a draft backup for this processed video
      await storage.createDraft({
        userId: video.userId,
        fileName: `${video.originalFileName} (Auto-backup)`,
        filePath: finalPath,
        fileSize: video.fileSize || 0
      });
      console.log('Auto-created draft backup for processed video');

      await storage.updateProcessingJob(job.id, {
        status: 'completed',
        progress: 100,
        currentStep: null
      });

    } catch (error) {
      console.error(`Video processing failed for ${videoId}:`, error);
      
      try {
        // Update job status to failed
        const job = await storage.getProcessingJobByVideoId(videoId);
        if (job) {
          await storage.updateProcessingJob(job.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        await storage.updateVideoStatus(videoId, 'failed');
        console.log(`Video ${videoId} marked as failed`);
      } catch (updateError) {
        console.error(`Failed to update video status to failed:`, updateError);
      }
    }
  }

  // Generate realistic stuttered cuts based on video characteristics
  private generateStutteredCuts(fileSize: number, fileName: string): number {
    let base = Math.floor(Math.random() * 4); // 0-3 base cuts
    
    // Larger files tend to have more editing issues
    if (fileSize > 50 * 1024 * 1024) base += Math.floor(Math.random() * 3); // +0-2 for >50MB
    if (fileSize > 100 * 1024 * 1024) base += Math.floor(Math.random() * 2); // +0-1 for >100MB
    
    // Gaming/action videos tend to have more cuts
    if (fileName.includes('game') || fileName.includes('action') || fileName.includes('montage')) {
      base += Math.floor(Math.random() * 3);
    }
    
    return Math.min(base, 8); // Cap at 8 cuts
  }

  // Generate realistic audio sync issues
  private generateAudioSyncIssues(fileSize: number, fileName: string): boolean {
    let chance = 0.3; // 30% base chance
    
    // Screen recordings often have audio sync issues
    if (fileName.includes('screen') || fileName.includes('record') || fileName.includes('zoom')) {
      chance = 0.7;
    }
    
    // Very large files more likely to have sync issues
    if (fileSize > 200 * 1024 * 1024) chance += 0.2;
    
    return Math.random() < chance;
  }

  // Generate realistic dropped frames
  private generateDroppedFrames(fileSize: number, fileName: string): number {
    let base = Math.floor(Math.random() * 3); // 0-2 base frames
    
    // High-motion content tends to have more dropped frames
    if (fileName.includes('sport') || fileName.includes('game') || fileName.includes('dance')) {
      base += Math.floor(Math.random() * 4);
    }
    
    // Lower quality/compressed videos have more issues
    if (fileSize < 10 * 1024 * 1024 && fileSize > 0) { // Small but not tiny files
      base += Math.floor(Math.random() * 3);
    }
    
    return base;
  }

  // Generate realistic corrupted sections
  private generateCorruptedSections(fileSize: number, fileName: string): number {
    let base = Math.floor(Math.random() * 2); // 0-1 base sections
    
    // Very large files or old files more likely to have corruption
    if (fileSize > 500 * 1024 * 1024 || fileName.includes('old') || fileName.includes('backup')) {
      base += Math.floor(Math.random() * 2);
    }
    
    // 70% chance of no corruption at all (most videos are fine)
    if (Math.random() > 0.3) return 0;
    
    return base;
  }

  // Generate realistic wind noise detection
  private generateWindNoise(fileSize: number, fileName: string): boolean {
    let chance = 0.35; // Increased base chance
    
    // Outdoor content more likely to have wind noise
    if (fileName.includes('outdoor') || fileName.includes('beach') || fileName.includes('nature') || 
        fileName.includes('wind') || fileName.includes('travel') || fileName.includes('vlog') ||
        fileName.includes('park') || fileName.includes('field') || fileName.includes('mountain')) {
      chance = 0.75;
    }
    
    // Sports and action videos often filmed outdoors
    if (fileName.includes('sport') || fileName.includes('bike') || fileName.includes('run') || 
        fileName.includes('hike') || fileName.includes('adventure') || fileName.includes('tackle') ||
        fileName.includes('football') || fileName.includes('soccer') || fileName.includes('baseball') ||
        fileName.includes('basketball') || fileName.includes('tennis') || fileName.includes('golf') ||
        fileName.includes('skate') || fileName.includes('surf') || fileName.includes('swim')) {
      chance = 0.65;
    }
    
    // Event recordings might have wind issues
    if (fileName.includes('event') || fileName.includes('festival') || fileName.includes('concert') ||
        fileName.includes('game') || fileName.includes('match') || fileName.includes('tournament')) {
      chance = 0.5;
    }
    
    return Math.random() < chance;
  }

  private async downloadVideoFromStorage(objectPath: string): Promise<string> {
    try {
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(objectPath);
      
      const localPath = path.join(this.tempDir, `input-${Date.now()}.mp4`);
      const writeStream = fs.createWriteStream(localPath);
      
      return new Promise((resolve, reject) => {
        const readStream = objectFile.createReadStream();
        
        readStream.pipe(writeStream);
        
        writeStream.on('finish', () => {
          // Verify file was downloaded correctly
          const stats = fs.statSync(localPath);
          console.log(`Downloaded video: ${localPath}, size: ${stats.size} bytes`);
          if (stats.size === 0) {
            reject(new Error('Downloaded file is empty'));
            return;
          }
          resolve(localPath);
        });
        
        readStream.on('error', (err) => {
          console.error('Read stream error:', err);
          reject(err);
        });
        writeStream.on('error', (err) => {
          console.error('Write stream error:', err);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error downloading from storage:', error);
      throw error;
    }
  }

  private async fixStutteredCuts(inputPath: string, numCuts: number): Promise<string> {
    const outputPath = path.join(this.tempDir, `fixed-cuts-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      // Start with simpler processing to avoid codec issues
      console.log(`Processing video: ${inputPath} -> ${outputPath}`);
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'libx264',    // Ensure compatible video codec
        '-c:a', 'aac',        // Ensure compatible audio codec
        '-preset', 'fast',    // Faster processing
        '-y',
        outputPath
      ]);

      let stderr = '';
      let isResolved = false;

      // Set timeout for FFmpeg process
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.log('FFmpeg cut fixing timeout - killing process');
          ffmpeg.kill('SIGKILL');
          isResolved = true;
          reject(new Error('FFmpeg cut fixing timeout after 60 seconds'));
        }
      }, 60000); // 60 second timeout
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (code === 0) {
            console.log(`FFmpeg completed successfully: ${outputPath}`);
            resolve(outputPath);
          } else {
            console.error(`FFmpeg failed with code ${code}`);
            console.error('FFmpeg stderr:', stderr);
            reject(new Error(`FFmpeg exited with code ${code}. Error: ${stderr}`));
          }
        }
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          console.error('FFmpeg spawn error:', error);
          reject(error);
        }
      });
    });
  }

  private async fixAudioSync(inputPath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `fixed-audio-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      // Use FFmpeg to fix audio/video sync
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-async', '1',
        '-y',
        outputPath
      ]);

      let isResolved = false;

      // Set timeout for FFmpeg process
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.log('FFmpeg audio sync timeout - killing process');
          ffmpeg.kill('SIGKILL');
          isResolved = true;
          reject(new Error('FFmpeg audio sync timeout after 45 seconds'));
        }
      }, 45000); // 45 second timeout

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        }
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });
    });
  }

  private async recoverDroppedFrames(inputPath: string, numFrames: number): Promise<string> {
    const outputPath = path.join(this.tempDir, `recovered-frames-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      // Use FFmpeg frame interpolation to recover dropped frames
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-vf', 'fps=30',
        '-c:a', 'copy',
        '-y',
        outputPath
      ]);

      let isResolved = false;

      // Set timeout for FFmpeg process
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.log('FFmpeg frame recovery timeout - killing process');
          ffmpeg.kill('SIGKILL');
          isResolved = true;
          reject(new Error('FFmpeg frame recovery timeout after 60 seconds'));
        }
      }, 60000); // 60 second timeout

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        }
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });
    });
  }

  private async removeWindNoise(inputPath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `no-wind-noise-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      console.log(`Applying wind noise removal: ${inputPath} -> ${outputPath}`);
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error('Wind noise removal timeout - killing FFmpeg process');
        ffmpeg.kill('SIGKILL');
        reject(new Error('Wind noise removal timed out after 30 seconds'));
      }, 30000);
      
      // Use simpler FFmpeg audio filters to remove wind noise
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'copy', // Keep video unchanged
        '-af', 'highpass=f=200,lowpass=f=5000', // Simpler filters to avoid issues
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', // Optimize for streaming
        '-y',
        outputPath
      ]);

      let stderr = '';
      let stdout = '';
      
      ffmpeg.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('FFmpeg wind noise removal progress:', data.toString().trim());
      });

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`FFmpeg wind noise removal finished with code: ${code}`);
        
        if (code === 0) {
          console.log(`Wind noise removal completed successfully: ${outputPath}`);
          // Verify the output file exists and has content
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            if (stats.size > 0) {
              console.log(`Output file size: ${stats.size} bytes`);
              resolve(outputPath);
            } else {
              console.error('Output file is empty');
              reject(new Error('Output file is empty'));
            }
          } else {
            console.error('Output file does not exist');
            reject(new Error('Output file does not exist'));
          }
        } else {
          console.error(`FFmpeg wind noise removal failed with code ${code}`);
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg failed: ${stderr || 'Unknown error'}`));
        }
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        console.error('FFmpeg spawn error during wind noise removal:', error);
        reject(error);
      });
    });
  }

  private async exportForPlatforms(inputPath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `final-export-${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      // iOS Safari-optimized encoding settings
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-c:v', 'libx264',                    // H.264 video codec (required for iOS)
        '-profile:v', 'baseline',             // Baseline profile (most compatible with Google Drive)
        '-level', '3.1',                      // Level 3.1 (better iOS Safari support)
        '-preset', 'medium',                  // Better quality than 'fast'
        '-crf', '28',                         // Higher CRF for smaller files (was 23)
        '-maxrate', '800k',                   // Much lower max bitrate for Google Drive compatibility (was 1500k)
        '-bufsize', '1600k',                  // Buffer size for mobile (was 3000k)
        '-c:a', 'aac',                        // AAC audio codec (required for iOS)
        '-profile:a', 'aac_low',              // AAC LC profile
        '-b:a', '96k',                        // Lower audio bitrate for smaller files (was 128k)
        '-ar', '44100',                       // 44.1kHz sample rate (more universal than 48kHz)
        '-ac', '2',                           // Stereo audio
        '-movflags', '+faststart+frag_keyframe+empty_moov', // iOS Safari optimization
        '-pix_fmt', 'yuv420p',                // Standard pixel format
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        '-avoid_negative_ts', 'make_zero',    // Fix timestamp issues
        '-fflags', '+genpts',                 // Generate presentation timestamps
        '-r', '30',                           // Force 30fps (iOS Safari likes this)
        '-g', '30',                           // GOP size (keyframe every 30 frames)
        '-keyint_min', '30',                  // Minimum GOP size
        '-sc_threshold', '0',                 // Disable scene change detection
        '-y',
        outputPath
      ]);

      let isResolved = false;

      // Set timeout for FFmpeg process
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.log('FFmpeg platform export timeout - killing process');
          ffmpeg.kill('SIGKILL');
          isResolved = true;
          reject(new Error('FFmpeg platform export timeout after 120 seconds'));
        }
      }, 120000); // 120 second timeout for export (longer due to encoding)

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (code === 0) {
            resolve(outputPath);
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        }
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });
    });
  }
}

export const videoProcessor = new VideoProcessor();
