import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { videoProcessor } from "./videoProcessor";
import { sendIdeaNotification } from "./sendgrid";
import { calculateReputation } from "./reputationSystem";
import { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import { insertVideoSchema, insertDraftSchema, insertUserSchema, insertIdeaSchema, insertStorylineBreakdownSchema } from "@shared/schema";
import { analyzeVideoStoryline } from "./openai";
import { vlcPlayerService } from "./vlcPlayer";

// Extend Express Request type to include user session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Check if user's email is verified
  const user = await storage.getUser(req.user.id);
  if (!user || !user.emailVerified) {
    return res.status(401).json({ error: "Email verification required" });
  }
  
  next();
};

// Optional auth middleware - adds user to request if logged in but doesn't require it
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // User will be added by session middleware if they're logged in
  next();
};

// Admin middleware - checks if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Check if user's email is verified
  const user = await storage.getUser(req.user.id);
  if (!user || !user.emailVerified) {
    return res.status(401).json({ error: "Email verification required" });
  }
  
  // Check if user is admin
  const isAdmin = user.email.includes('admin') || 
                  user.username.toLowerCase().includes('admin') || 
                  user.email === 'jason@smooth-edit.com' ||
                  user.email === 'jguynes74@gmail.com'; // Your admin access
  
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure session store
  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  // Configure session middleware with mobile-friendly settings
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Better mobile browser compatibility
    },
  }));

  // Middleware to add user to request object if logged in
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && (req.session as any).userId) {
      try {
        const user = await storage.getUser((req.session as any).userId);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
          };
        }
      } catch (error) {
        console.error("Error loading user from session:", error);
      }
    }
    next();
  });
  
  // Initialize demo user with error handling and timeout
  let DEMO_USER_ID: string = "demo-user-fallback-id";
  
  // Helper function to ensure demo user exists with timeout
  async function ensureDemoUser(): Promise<string> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout')), 10000); // 10 second timeout
      });
      
      const demoUserPromise = (async () => {
        let demoUser = await storage.getUserByEmail("demo@smoothedit.com");
        if (!demoUser) {
          demoUser = await storage.createUser({
            username: "demo-user", 
            email: "demo@smoothedit.com",
            password: process.env.DEMO_USER_PASSWORD || "secure-default-password"
          });
        }
        return demoUser.id;
      })();

      return await Promise.race([demoUserPromise, timeoutPromise]);
    } catch (error) {
      console.error("Failed to ensure demo user exists:", error);
      throw error;
    }
  }
  
  // Initialize demo user asynchronously without blocking server startup
  ensureDemoUser()
    .then((userId) => {
      DEMO_USER_ID = userId;
      console.log("Demo user initialized successfully:", userId);
    })
    .catch((error) => {
      console.error("Failed to initialize demo user, using fallback:", error);
      console.log("Server will continue with fallback demo user ID");
      // Keep using the fallback ID
    });

  // Authentication Routes
  
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: result.error.errors 
        });
      }

      const { username, email, password } = result.data;
      
      // Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // Create user with hashed password (email unverified by default)
      const user = await storage.createUserWithHashedPassword({
        username,
        email: normalizedEmail,
        password,
      });

      // Temporary: Skip email verification entirely for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: Auto-verifying user ${normalizedEmail} - skipping email`);
        await storage.verifyUserEmail(user.id);
      } else {
        // Generate verification token and send email for production
        const verificationToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await storage.setEmailVerificationToken(user.id, verificationToken, expiresAt);
        await sendVerificationEmail(normalizedEmail, verificationToken, username);
      }

      res.status(201).json({
        message: process.env.NODE_ENV === 'development' 
          ? "Registration successful! Your account is automatically verified in development mode."
          : "Registration successful! Please check your email to verify your account.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: process.env.NODE_ENV === 'development',
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user by username or email (normalize email to lowercase)
      let user = await storage.getUserByUsername(username);
      if (!user) {
        // Normalize email to lowercase for case-insensitive lookup
        const normalizedEmail = username.toLowerCase().trim();
        user = await storage.getUserByEmail(normalizedEmail);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Validate password
      const isValid = await storage.validateUserPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        // Temporary bypass for email verification during development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Development mode: Auto-verifying user ${user.email}`);
          await storage.verifyUserEmail(user.id);
          user.emailVerified = true;
        } else {
          return res.status(401).json({ 
            error: "Email not verified", 
            message: "Please check your email and verify your account before logging in.",
            emailVerified: false,
            userId: user.id
          });
        }
      }

      // Set up session
      (req.session as any).userId = user.id;
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      // More detailed error logging for debugging mobile issues
      console.error("Request details:", {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        host: req.headers.host,
        sessionId: req.sessionID,
        body: { ...req.body, password: "[REDACTED]" }
      });
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Health check endpoint for Elastic Beanstalk
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Forgot password route  
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();

      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        // Don't reveal whether user exists or not for security
        return res.json({ 
          message: "If an account with that email exists, we've sent a password reset link.",
          success: true 
        });
      }

      // Skip email sending for development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: Password reset requested for ${normalizedEmail} - skipping email`);
        
        // For development, just log the reset info
        const resetToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await storage.setPasswordResetToken(user.id, resetToken, expiresAt);
        
        console.log(`Password reset token for ${normalizedEmail}: ${resetToken}`);
        console.log(`Reset URL: http://localhost:5000/reset-password?token=${resetToken}`);
        
        return res.json({ 
          message: "Development mode: Check console for reset link.",
          success: true,
          resetToken: resetToken // Only include in development
        });
      } else {
        // Generate password reset token and send email for production
        const resetToken = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await storage.setPasswordResetToken(user.id, resetToken, expiresAt);
        await sendPasswordResetEmail(normalizedEmail, resetToken);
        
        return res.json({ 
          message: "If an account with that email exists, we've sent a password reset link.",
          success: true 
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Update password and clear reset token
      await storage.updateUserPassword(user.id, password);
      await storage.clearPasswordResetToken(user.id);

      res.json({ 
        message: "Password reset successfully! You can now log in with your new password.",
        success: true 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Email verification routes
  
  // Verify email with token
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ error: "Verification token has expired" });
      }

      // Verify the user's email
      await storage.verifyUserEmail(user.id);

      res.json({ 
        message: "Email verified successfully! You can now log in.",
        success: true 
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();

      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.setEmailVerificationToken(user.id, verificationToken, expiresAt);
      await sendVerificationEmail(normalizedEmail, verificationToken, user.username);

      res.json({ 
        message: "Verification email sent! Please check your inbox.",
        success: true 
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Get current user
  app.get("/api/auth/user", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  // Get upload URL for object storage
  app.post("/api/videos/upload-url", async (req, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      res.json({ uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Complete upload and create video record
  app.post("/api/videos/upload-complete", requireAuth, async (req, res) => {
    try {
      const { fileName, fileSize, uploadUrl } = req.body;
      
      if (!fileName || !fileSize || !uploadUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const objectStorage = new ObjectStorageService();
      const normalizedPath = objectStorage.normalizeObjectEntityPath(uploadUrl);

      // Create video record
      const video = await storage.createVideo({
        userId: req.user!.id,
        originalFileName: fileName,
        originalFilePath: normalizedPath,
        fileSize: parseInt(fileSize),
        duration: null // Would be extracted from video metadata
      });

      // Start processing asynchronously
      videoProcessor.processVideo(video.id).catch(error => {
        console.error("Video processing error:", error);
      });

      res.json({ 
        videoId: video.id,
        status: "uploaded",
        message: "Video uploaded successfully. Processing started."
      });
    } catch (error) {
      console.error("Upload completion error:", error);
      res.status(500).json({ error: "Failed to complete upload" });
    }
  });

  // Legacy upload endpoint (kept for backward compatibility)
  app.post("/api/videos/upload", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      // Create video record
      const video = await storage.createVideo({
        userId: DEMO_USER_ID,
        originalFileName: req.file.originalname,
        originalFilePath: req.file.path,
        fileSize: req.file.size,
        duration: null // Would be extracted from video metadata
      });

      // Start processing asynchronously
      videoProcessor.processVideo(video.id).catch(error => {
        console.error("Video processing error:", error);
      });

      res.json({ 
        videoId: video.id,
        status: "uploaded",
        message: "Video uploaded successfully. Processing started."
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // Get user videos
  app.get("/api/videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getVideosByUserId(req.user!.id);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Get video details
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  // Get processing status
  app.get("/api/videos/:id/status", async (req, res) => {
    try {
      const job = await storage.getProcessingJobByVideoId(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Processing job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching processing status:", error);
      res.status(500).json({ error: "Failed to fetch processing status" });
    }
  });

  // Handle HEAD requests for iOS Safari video compatibility
  app.head("/api/videos/:id/stream", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video || !video.processedFilePath) {
        return res.status(404).end();
      }

      const fs = await import('fs');
      let filePath = video.processedFilePath;
      
      // If specific processed file doesn't exist, try to find an alternative
      if (!fs.existsSync(filePath)) {
        const tempDir = path.join(process.cwd(), 'temp');
        const processedFiles = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('final-export-') && f.endsWith('.mp4'))
          .map(f => path.join(tempDir, f))
          .filter(f => fs.existsSync(f))
          .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
        
        if (processedFiles.length > 0) {
          filePath = processedFiles[0];
        } else {
          return res.status(404).end();
        }
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      
      // iOS Safari-specific headers for HEAD request
      res.set({
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept-Encoding',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Content-Type, Accept-Ranges',
        'Cache-Control': 'public, max-age=3600',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
      
      res.status(200).end();
    } catch (error) {
      console.error("Error handling HEAD request for video:", error);
      res.status(500).end();
    }
  });

  // Stream video for browser playback  
  app.get("/api/videos/:id/stream", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video || !video.processedFilePath) {
        return res.status(404).json({ error: "Processed video not found" });
      }

      const fs = await import('fs');
      let filePath = video.processedFilePath;
      
      // If specific processed file doesn't exist, try to find an alternative
      if (!fs.existsSync(filePath)) {
        console.log(`Streaming: specific video file not found: ${filePath}, looking for alternatives...`);
        
        const tempDir = path.join(process.cwd(), 'temp');
        const processedFiles = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('final-export-') && f.endsWith('.mp4'))
          .map(f => path.join(tempDir, f))
          .filter(f => fs.existsSync(f))
          .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
        
        if (processedFiles.length > 0) {
          filePath = processedFiles[0];
          console.log(`Using alternative processed file for streaming: ${filePath}`);
        } else {
          console.error(`No processed video files available for streaming in ${tempDir}`);
          return res.status(404).json({ error: "Video file not found on disk" });
        }
      }

      // Get file stats for range requests
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Detect the correct MIME type based on the PROCESSED file extension
      const getVideoMimeType = (fileName: string): string => {
        const ext = path.extname(fileName).toLowerCase();
        switch (ext) {
          case '.mp4':
            return 'video/mp4';
          case '.mov':
          case '.qt':
            return 'video/quicktime';
          case '.avi':
            return 'video/x-msvideo';
          case '.mkv':
            return 'video/x-matroska';
          case '.webm':
            return 'video/webm';
          case '.m4v':
            return 'video/x-m4v';
          default:
            return 'video/mp4';
        }
      };

      const mimeType = getVideoMimeType(filePath);

      // Enhanced iOS Safari-specific headers
      const iosSafariHeaders = {
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept-Encoding, Content-Range',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Content-Type, Accept-Ranges',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Content-Type-Options': 'nosniff'
      };

      if (range) {
        // Handle range requests for video seeking - iOS Safari critical path
        console.log(`iOS Safari range request: ${range} for video ${req.params.id}`);
        
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
        
        // Validate range values
        if (start >= fileSize || end >= fileSize || start > end) {
          return res.status(416).set({
            'Content-Range': `bytes */${fileSize}`,
            ...iosSafariHeaders
          }).end();
        }
        
        const chunksize = (end-start)+1;
        const file = fs.createReadStream(filePath, {start, end});
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunksize,
          'Content-Type': mimeType,
          ...iosSafariHeaders,
        };
        
        console.log(`Sending 206 response: bytes ${start}-${end}/${fileSize}`);
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Standard streaming - send full file with Accept-Ranges header
        console.log(`Full video request (no range) for video ${req.params.id}`);
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          ...iosSafariHeaders,
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error("Error streaming video:", error);
      res.status(500).json({ error: "Failed to stream video" });
    }
  });

  // Download processed video
  app.get("/api/videos/:id/download", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Check if this is a demo/development environment
      if (!video.processedFilePath || video.processedFilePath.includes('demo-video')) {
        return res.status(404).json({ 
          error: "Download not available for demo videos", 
          message: "This is a demo video. In production, users would be able to download their processed videos.",
          demoMode: true
        });
      }

      const fs = await import('fs');
      let filePath = video.processedFilePath;
      
      // If specific processed file doesn't exist, try to find an alternative
      if (!fs.existsSync(filePath)) {
        console.log(`Specific video file not found: ${filePath}, looking for alternatives...`);
        
        const tempDir = path.join(process.cwd(), 'temp');
        const processedFiles = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('final-export-') && f.endsWith('.mp4'))
          .map(f => path.join(tempDir, f))
          .filter(f => fs.existsSync(f))
          .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()); // Most recent first
        
        if (processedFiles.length > 0) {
          filePath = processedFiles[0]; // Use the most recent processed file
          console.log(`Using alternative processed file: ${filePath}`);
        } else {
          console.error(`No processed video files available in ${tempDir}`);
          return res.status(404).json({ 
            error: "Video file not found on disk",
            message: "No processed video files are currently available. Please try processing the video again.",
            filePath: filePath
          });
        }
      }

      // Detect the correct MIME type based on the PROCESSED file extension, not original
      const getVideoMimeType = (fileName: string): string => {
        const ext = path.extname(fileName).toLowerCase();
        switch (ext) {
          case '.mp4':
            return 'video/mp4';
          case '.mov':
          case '.qt':
            return 'video/quicktime';
          case '.avi':
            return 'video/x-msvideo';
          case '.mkv':
            return 'video/x-matroska';
          case '.webm':
            return 'video/webm';
          case '.m4v':
            return 'video/x-m4v';
          default:
            return 'video/mp4'; // Default fallback
        }
      };

      // Use the processed file path to determine the actual format
      const processedFileExt = path.extname(filePath).toLowerCase();
      const mimeType = getVideoMimeType(filePath);
      
      // Create a proper filename with the correct extension
      const originalNameWithoutExt = path.parse(video.originalFileName).name;
      const correctFileName = `${originalNameWithoutExt}${processedFileExt}`;
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${correctFileName}"`);
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading video:", error);
      res.status(500).json({ error: "Failed to download video" });
    }
  });

  // Draft operations
  app.post("/api/drafts", requireAuth, upload.single('draft'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No draft file provided" });
      }

      const draft = await storage.createDraft({
        userId: req.user!.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
      });

      res.json(draft);
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({ error: "Failed to save draft" });
    }
  });

  app.get("/api/drafts", requireAuth, async (req, res) => {
    try {
      const drafts = await storage.getDraftsByUserId(req.user!.id);
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  app.delete("/api/drafts/:id", async (req, res) => {
    try {
      const success = await storage.deleteDraft(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Draft not found" });
      }
      res.json({ message: "Draft deleted successfully" });
    } catch (error) {
      console.error("Error deleting draft:", error);
      res.status(500).json({ error: "Failed to delete draft" });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const success = await storage.deleteVideo(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Add video to drafts
  app.post("/api/videos/:id/add-to-drafts", requireAuth, async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Create a draft copy of the video
      const draft = await storage.createDraft({
        userId: req.user!.id,
        fileName: `${video.originalFileName} (Draft Copy)`,
        filePath: video.processedFilePath || video.originalFilePath,
        fileSize: video.fileSize || 0
      });

      res.json({ 
        message: "Video added to drafts successfully",
        draft 
      });
    } catch (error) {
      console.error("Error adding video to drafts:", error);
      res.status(500).json({ error: "Failed to add video to drafts" });
    }
  });

  // Apply AI fixes to a video
  // Update video name
  app.put("/api/videos/:id/rename", async (req, res) => {
    try {
      const videoId = req.params.id;
      const { fileName } = req.body;
      
      if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
        return res.status(400).json({ error: "Invalid file name" });
      }

      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const oldFileName = video.originalFileName;
      
      // Update the video
      await storage.updateVideo(videoId, {
        originalFileName: fileName.trim()
      });

      // Also update any related auto-backup drafts
      let draftsUpdated = 0;
      if (oldFileName) {
        const oldDraftName = `${oldFileName} (Auto-backup)`;
        const newDraftName = `${fileName.trim()} (Auto-backup)`;
        draftsUpdated = await storage.updateDraftsByFileName(video.userId, oldDraftName, newDraftName);
      }

      res.json({ 
        success: true, 
        message: 'Video renamed successfully',
        fileName: fileName.trim(),
        draftsUpdated: draftsUpdated
      });

    } catch (error) {
      console.error("Error renaming video:", error);
      res.status(500).json({ error: "Failed to rename video" });
    }
  });

  app.post("/api/videos/:id/apply-fixes", async (req, res) => {
    try {
      const videoId = req.params.id;
      const { fixes } = req.body;
      
      if (!fixes || !Array.isArray(fixes)) {
        return res.status(400).json({ error: "Invalid fixes array" });
      }

      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Map fix IDs to processing functions
      const fixDescriptions = {
        'wind-noise': 'Wind noise removal',
        'audio-sync': 'Audio synchronization',
        'voice-enhance': 'Voice clarity enhancement',
        'stabilize': 'Video stabilization', 
        'color-correct': 'Color correction',
        'sharpen': 'Image sharpening',
        'tiktok-optimize': 'TikTok optimization',
        'instagram-optimize': 'Instagram optimization',
        'youtube-optimize': 'YouTube optimization'
      };

      // Update video status to processing
      await storage.updateVideo(videoId, {
        status: 'processing'
      });

      // For demo purposes, we'll simulate completion after a delay
      setTimeout(async () => {
        try {
          // Simulate fixing issues based on selected fixes
          const updatedIssues = { ...(video.issues || {}) };
          
          if (fixes.includes('wind-noise')) {
            updatedIssues.windNoise = false;
          }
          if (fixes.includes('audio-sync')) {
            updatedIssues.audioSyncIssues = false;
          }
          if (fixes.includes('stabilize')) {
            updatedIssues.shakyFootage = false;
          }

          await storage.updateVideo(videoId, {
            status: 'completed',
            issues: updatedIssues
          });

          console.log(`AI fixes completed for video ${videoId}: ${fixes.join(', ')}`);
        } catch (error) {
          console.error('Error completing AI fixes:', error);
          await storage.updateVideo(videoId, {
            status: 'failed'
          });
        }
      }, 5000 + Math.random() * 10000); // Random delay between 5-15 seconds

      res.json({ 
        success: true, 
        message: 'AI fixes started',
        fixesApplied: fixes.length
      });

    } catch (error) {
      console.error("Error applying AI fixes:", error);
      res.status(500).json({ error: "Failed to apply AI fixes" });
    }
  });

  // User stats endpoint
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Update user plan
  app.put("/api/user/plan", requireAuth, async (req, res) => {
    try {
      const { plan } = req.body;
      if (!['free', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const user = await storage.updateUserPlan(req.user!.id, plan);
      res.json(user);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  // Admin routes
  // Get all users (admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user plan (admin only)
  app.put("/api/admin/users/:userId/plan", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { plan } = req.body;
      
      if (!['free', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const user = await storage.updateUserPlan(userId, plan);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ error: "Failed to update user plan" });
    }
  });

  // Admin reset user password
  app.put("/api/admin/users/:userId/password", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const user = await storage.updateUserPassword(userId, password);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: "Failed to update user password" });
    }
  });

  // Ideas endpoints
  app.get("/api/ideas", async (req, res) => {
    try {
      const ideas = await storage.getIdeas();
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  app.post("/api/ideas", async (req, res) => {
    try {
      const validatedData = insertIdeaSchema.parse(req.body);
      const idea = await storage.createIdea(validatedData);
      
      // Update submitter's reputation for submitting an idea
      try {
        const submitterName = idea.userName || "Anonymous";
        if (submitterName !== "Anonymous") {
          // Get or create user for reputation tracking
          let user = await storage.getUserByUsername(submitterName);
          if (!user) {
            user = await storage.createUser({
              username: submitterName,
              email: `${submitterName}@temp.com`,
              password: "temp"
            });
          }
          
          // Update reputation stats
          const newTotalIdeas = (user.totalIdeasSubmitted || 0) + 1;
          const newReputation = calculateReputation(newTotalIdeas, user.totalVotesReceived || 0);
          
          await storage.updateUserReputation(user.id, newReputation, newTotalIdeas, user.totalVotesReceived || 0);
        }
      } catch (reputationError) {
        console.error("Failed to update reputation:", reputationError);
        // Don't fail the request if reputation update fails
      }
      
      // Send email notification
      try {
        await sendIdeaNotification({
          text: idea.text,
          userName: idea.userName
        });
        console.log("Email notification sent for new idea:", idea.text.substring(0, 50));
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(idea);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ error: "Failed to create idea" });
    }
  });

  app.post("/api/ideas/:id/vote", async (req, res) => {
    try {
      const ideaBeforeVote = await storage.getIdeaById(req.params.id);
      if (!ideaBeforeVote) {
        return res.status(404).json({ error: "Idea not found" });
      }
      
      const success = await storage.voteIdea(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Idea not found" });
      }
      
      // Update submitter's reputation for receiving a vote
      try {
        const submitterName = ideaBeforeVote.userName;
        if (submitterName && submitterName !== "Anonymous") {
          const user = await storage.getUserByUsername(submitterName);
          if (user) {
            const newTotalVotes = (user.totalVotesReceived || 0) + 1;
            const newReputation = calculateReputation(user.totalIdeasSubmitted || 0, newTotalVotes);
            
            await storage.updateUserReputation(user.id, newReputation, user.totalIdeasSubmitted || 0, newTotalVotes);
          }
        }
      } catch (reputationError) {
        console.error("Failed to update reputation for vote:", reputationError);
        // Don't fail the request if reputation update fails
      }
      
      res.json({ message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error voting for idea:", error);
      res.status(500).json({ error: "Failed to vote for idea" });
    }
  });

  // Users leaderboard endpoint
  app.get("/api/users/leaderboard", async (req, res) => {
    try {
      const users = await storage.getTopReputationUsers(10);
      res.json(users);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Storyline analysis endpoints
  app.post("/api/videos/:id/storyline/analyze", requireAuth, async (req: any, res) => {
    try {
      const videoId = req.params.id;
      const userId = req.user.id;
      
      // Get the user to check their plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has Creator Pro+ plan
      if (user.plan !== 'business') {
        return res.status(403).json({ 
          error: "AI Storyline feature requires Creator Pro+ plan",
          message: "Upgrade to Creator Pro+ to access AI-powered storyline analysis",
          requiredPlan: "business",
          currentPlan: user.plan
        });
      }
      
      console.log(`Starting AI storyline analysis for video: ${videoId}`);
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      // Verify video belongs to user
      if (video.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if storyline already exists
      const existingBreakdown = await storage.getStorylineBreakdownByVideoId(videoId);
      if (existingBreakdown) {
        return res.json({ 
          message: "Storyline analysis already exists",
          breakdown: existingBreakdown
        });
      }

      // Determine the video file path to analyze
      let videoPath = video.processedFilePath || video.originalFilePath;
      
      // If it's in object storage, we need to download it first
      if (videoPath.startsWith('/objects/')) {
        console.log(`Video is in object storage, using download endpoint for analysis`);
        return res.status(400).json({ 
          error: "Object storage videos not yet supported for storyline analysis",
          message: "This feature will be available soon for cloud-stored videos"
        });
      }

      // Perform AI storyline analysis
      const analysis = await analyzeVideoStoryline(videoPath);
      
      // Save the analysis to the database
      const breakdown = await storage.createStorylineBreakdown({
        videoId: videoId,
        title: analysis.title,
        summary: analysis.summary,
        scenes: analysis.scenes,
        characters: analysis.characters,
        themes: analysis.themes,
        mood: analysis.mood,
        genre: analysis.genre,
        confidence: analysis.confidence
      });

      console.log(`Storyline analysis completed for video ${videoId}`);
      
      res.json({
        success: true,
        message: "Storyline analysis completed successfully",
        breakdown: breakdown
      });

    } catch (error) {
      console.error("Error analyzing video storyline:", error);
      res.status(500).json({ 
        error: "Failed to analyze video storyline",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/videos/:id/storyline", requireAuth, async (req: any, res) => {
    try {
      const videoId = req.params.id;
      const userId = req.user.id;
      
      // Get the user to check their plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has Creator Pro+ plan
      if (user.plan !== 'business') {
        return res.status(403).json({ 
          error: "AI Storyline feature requires Creator Pro+ plan",
          message: "Upgrade to Creator Pro+ to access AI-powered storyline analysis",
          requiredPlan: "business",
          currentPlan: user.plan
        });
      }
      
      const breakdown = await storage.getStorylineBreakdownByVideoId(videoId);
      if (!breakdown) {
        return res.status(404).json({ error: "Storyline breakdown not found" });
      }
      
      // Verify the video belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching storyline breakdown:", error);
      res.status(500).json({ error: "Failed to fetch storyline breakdown" });
    }
  });

  app.delete("/api/videos/:id/storyline", requireAuth, async (req: any, res) => {
    try {
      const videoId = req.params.id;
      const userId = req.user.id;
      
      // Get the user to check their plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has Creator Pro+ plan
      if (user.plan !== 'business') {
        return res.status(403).json({ 
          error: "AI Storyline feature requires Creator Pro+ plan",
          message: "Upgrade to Creator Pro+ to access AI-powered storyline analysis",
          requiredPlan: "business",
          currentPlan: user.plan
        });
      }
      
      const breakdown = await storage.getStorylineBreakdownByVideoId(videoId);
      if (!breakdown) {
        return res.status(404).json({ error: "Storyline breakdown not found" });
      }
      
      // Verify the video belongs to the user
      const video = await storage.getVideo(videoId);
      if (!video || video.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const deleted = await storage.deleteStorylineBreakdown(breakdown.id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete storyline breakdown" });
      }

      res.json({ success: true, message: "Storyline breakdown deleted successfully" });
    } catch (error) {
      console.error("Error deleting storyline breakdown:", error);
      res.status(500).json({ error: "Failed to delete storyline breakdown" });
    }
  });

  // VLC Player Routes
  app.post("/api/videos/:id/vlc/start", async (req, res) => {
    try {
      const videoId = req.params.id;
      console.log(`Starting VLC stream for video: ${videoId}`);
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      let videoPath = video.processedFilePath || video.originalFilePath;
      
      // If it's an object storage path, we need to download it first
      if (videoPath.startsWith('/objects/')) {
        console.log(`Video is in object storage, downloading: ${videoPath}`);
        // For now, use the direct streaming endpoint
        videoPath = `http://localhost:5000/api/videos/${videoId}/stream`;
      }

      const streamPort = await vlcPlayerService.createPlayer(videoId, videoPath);
      const streamUrl = `http://localhost:${streamPort}/stream`;
      
      console.log(`VLC stream ready for video ${videoId}: ${streamUrl}`);
      
      res.json({
        success: true,
        port: streamPort,
        streamUrl: streamUrl,
        message: 'VLC stream started successfully'
      });

    } catch (error) {
      console.error("Error starting VLC stream:", error);
      res.status(500).json({ 
        error: "Failed to start VLC stream",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/videos/:id/vlc/stop", async (req, res) => {
    try {
      const videoId = req.params.id;
      console.log(`Stopping VLC stream for video: ${videoId}`);
      
      await vlcPlayerService.destroyPlayer(videoId);
      
      res.json({
        success: true,
        message: 'VLC stream stopped successfully'
      });

    } catch (error) {
      console.error("Error stopping VLC stream:", error);
      res.status(500).json({ 
        error: "Failed to stop VLC stream",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/videos/:id/vlc/status", async (req, res) => {
    try {
      const videoId = req.params.id;
      const port = vlcPlayerService.getPlayerPort(videoId);
      const streamUrl = vlcPlayerService.getStreamUrl(videoId);
      
      res.json({
        isActive: port !== null,
        port: port,
        streamUrl: streamUrl
      });

    } catch (error) {
      console.error("Error checking VLC status:", error);
      res.status(500).json({ error: "Failed to check VLC status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
