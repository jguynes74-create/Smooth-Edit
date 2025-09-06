import { users, videos, drafts, processingJobs, ideas, storylineBreakdowns, type User, type InsertUser, type Video, type InsertVideo, type Draft, type InsertDraft, type ProcessingJob, type InsertProcessingJob, type Idea, type InsertIdea, type StorylineBreakdown, type InsertStorylineBreakdown } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithHashedPassword(user: Omit<InsertUser, 'password'> & { password: string }): Promise<User>;
  validateUserPassword(user: User, password: string): Promise<boolean>;
  updateUserPlan(userId: string, plan: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Email verification operations
  setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<User | undefined>;

  // Password reset operations
  updateUserPassword(userId: string, password: string): Promise<User | undefined>;
  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<User | undefined>;

  // Video operations
  createVideo(video: InsertVideo & { userId: string }): Promise<Video>;
  getVideo(id: string): Promise<Video | undefined>;
  getVideosByUserId(userId: string): Promise<Video[]>;
  updateVideoStatus(id: string, status: string): Promise<Video | undefined>;
  updateVideoProcessing(id: string, updates: Partial<Video>): Promise<Video | undefined>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;

  // Draft operations
  createDraft(draft: InsertDraft & { userId: string }): Promise<Draft>;
  getDraft(id: string): Promise<Draft | undefined>;
  getDraftsByUserId(userId: string): Promise<Draft[]>;
  updateDraftLastModified(id: string): Promise<Draft | undefined>;
  updateDraftsByFileName(userId: string, oldFileName: string, newFileName: string): Promise<number>;
  deleteDraft(id: string): Promise<boolean>;

  // Processing job operations
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  getProcessingJobByVideoId(videoId: string): Promise<ProcessingJob | undefined>;
  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined>;

  // Analytics
  getUserStats(userId: string): Promise<{
    videosProcessed: number;
    draftsSaved: number;
    issuesFixed: number;
    timeSaved: string;
  }>;

  // Ideas operations
  createIdea(ideaData: InsertIdea): Promise<Idea>;
  getIdeas(): Promise<Idea[]>;
  voteIdea(id: string): Promise<boolean>;

  // Storyline breakdown operations
  createStorylineBreakdown(breakdown: InsertStorylineBreakdown): Promise<StorylineBreakdown>;
  getStorylineBreakdown(id: string): Promise<StorylineBreakdown | undefined>;
  getStorylineBreakdownByVideoId(videoId: string): Promise<StorylineBreakdown | undefined>;
  updateStorylineBreakdown(id: string, updates: Partial<StorylineBreakdown>): Promise<StorylineBreakdown | undefined>;
  deleteStorylineBreakdown(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createUserWithHashedPassword(user: Omit<InsertUser, 'password'> & { password: string }): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();
    return newUser;
  }

  async validateUserPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async updateUserPlan(userId: string, plan: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ plan })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        emailVerificationToken: token, 
        emailVerificationExpires: expiresAt 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null, 
        emailVerificationExpires: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(userId: string, password: string): Promise<User | undefined> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpires: expiresAt 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async clearPasswordResetToken(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        passwordResetToken: null, 
        passwordResetExpires: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async createVideo(video: InsertVideo & { userId: string }): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values(video)
      .returning();
    return newVideo;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideosByUserId(userId: string): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }

  async updateVideoStatus(id: string, status: string): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set({ status })
      .where(eq(videos.id, id))
      .returning();
    return video || undefined;
  }

  async updateVideoProcessing(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return video || undefined;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return video || undefined;
  }

  async createDraft(draft: InsertDraft & { userId: string }): Promise<Draft> {
    const [newDraft] = await db
      .insert(drafts)
      .values(draft)
      .returning();
    return newDraft;
  }

  async getDraft(id: string): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft || undefined;
  }

  async getDraftsByUserId(userId: string): Promise<Draft[]> {
    return await db
      .select()
      .from(drafts)
      .where(eq(drafts.userId, userId))
      .orderBy(desc(drafts.lastModified));
  }

  async updateDraftLastModified(id: string): Promise<Draft | undefined> {
    const [draft] = await db
      .update(drafts)
      .set({ lastModified: new Date() })
      .where(eq(drafts.id, id))
      .returning();
    return draft || undefined;
  }

  async deleteDraft(id: string): Promise<boolean> {
    const result = await db.delete(drafts).where(eq(drafts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateDraftsByFileName(userId: string, oldFileName: string, newFileName: string): Promise<number> {
    const result = await db
      .update(drafts)
      .set({ 
        fileName: newFileName,
        lastModified: new Date() 
      })
      .where(and(
        eq(drafts.userId, userId),
        eq(drafts.fileName, oldFileName)
      ))
      .returning();
    return result.length;
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      // First delete any associated processing jobs
      await db.delete(processingJobs).where(eq(processingJobs.videoId, id));
      
      // Then delete the video
      const result = await db.delete(videos).where(eq(videos.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const [newJob] = await db
      .insert(processingJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, id));
    return job || undefined;
  }

  async getProcessingJobByVideoId(videoId: string): Promise<ProcessingJob | undefined> {
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.videoId, videoId));
    return job || undefined;
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined> {
    const [job] = await db
      .update(processingJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(processingJobs.id, id))
      .returning();
    return job || undefined;
  }

  async getUserStats(userId: string): Promise<{
    videosProcessed: number;
    draftsSaved: number;
    issuesFixed: number;
    timeSaved: string;
  }> {
    const userVideos = await this.getVideosByUserId(userId);
    const userDrafts = await this.getDraftsByUserId(userId);
    
    const videosProcessed = userVideos.filter(v => v.status === "completed").length;
    const draftsSaved = userDrafts.length;
    
    let issuesFixed = 0;
    userVideos.forEach(video => {
      if (video.fixesApplied) {
        issuesFixed += (video.fixesApplied.stutteredCutsFixed || 0) +
                      (video.fixesApplied.audioSyncFixed ? 1 : 0) +
                      (video.fixesApplied.framesRecovered || 0) +
                      (video.fixesApplied.sectionsRepaired || 0);
      }
    });

    // Estimate 15 minutes saved per processed video
    const timeSavedMinutes = videosProcessed * 15;
    const hours = Math.floor(timeSavedMinutes / 60);
    const minutes = timeSavedMinutes % 60;
    
    let timeSaved = '';
    if (hours > 0) {
      timeSaved = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      timeSaved = `${minutes}m`;
    }

    return {
      videosProcessed,
      draftsSaved,
      issuesFixed,
      timeSaved
    };
  }

  async createIdea(ideaData: InsertIdea): Promise<Idea> {
    const [newIdea] = await db
      .insert(ideas)
      .values(ideaData)
      .returning();
    return newIdea;
  }

  async getIdeas(): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .orderBy(desc(ideas.votes), desc(ideas.createdAt));
  }

  async voteIdea(id: string): Promise<boolean> {
    try {
      const result = await db
        .update(ideas)
        .set({ votes: sql`votes + 1` })
        .where(eq(ideas.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error voting for idea:', error);
      return false;
    }
  }

  async updateUserReputation(userId: string, reputation: number, totalIdeasSubmitted: number, totalVotesReceived: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ reputation, totalIdeasSubmitted, totalVotesReceived })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }

  async getTopReputationUsers(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.reputation))
      .limit(limit);
  }

  async getIdeaById(id: string): Promise<Idea | undefined> {
    const [idea] = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, id))
      .limit(1);
    return idea || undefined;
  }

  // Storyline breakdown operations
  async createStorylineBreakdown(breakdown: InsertStorylineBreakdown): Promise<StorylineBreakdown> {
    const [createdBreakdown] = await db
      .insert(storylineBreakdowns)
      .values([breakdown])
      .returning();
    return createdBreakdown;
  }

  async getStorylineBreakdown(id: string): Promise<StorylineBreakdown | undefined> {
    const [breakdown] = await db
      .select()
      .from(storylineBreakdowns)
      .where(eq(storylineBreakdowns.id, id));
    return breakdown || undefined;
  }

  async getStorylineBreakdownByVideoId(videoId: string): Promise<StorylineBreakdown | undefined> {
    const [breakdown] = await db
      .select()
      .from(storylineBreakdowns)
      .where(eq(storylineBreakdowns.videoId, videoId));
    return breakdown || undefined;
  }

  async updateStorylineBreakdown(id: string, updates: Partial<StorylineBreakdown>): Promise<StorylineBreakdown | undefined> {
    const [breakdown] = await db
      .update(storylineBreakdowns)
      .set(updates)
      .where(eq(storylineBreakdowns.id, id))
      .returning();
    return breakdown || undefined;
  }

  async deleteStorylineBreakdown(id: string): Promise<boolean> {
    const result = await db
      .delete(storylineBreakdowns)
      .where(eq(storylineBreakdowns.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
