import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is required');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
  const verificationUrl = `${process.env.REPLIT_DEV_DOMAIN || 'https://localhost:5000'}/verify-email?token=${token}`;
  
  // Use environment variable for sender email, fallback to a more generic one
  const senderEmail = process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
  
  const msg = {
    to: email,
    from: senderEmail,
    subject: 'Verify Your SmoothEDIT Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin-bottom: 10px;">Welcome to SmoothEDIT!</h1>
          <p style="color: #64748b; font-size: 16px;">AI-powered video repair and cloud backup for creators</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin-bottom: 15px;">Hi ${username},</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thanks for signing up! To get started with SmoothEDIT, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with SmoothEDIT, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    
    // Provide more specific error messages
    if (error.code === 403) {
      throw new Error('Email service not configured. Please verify your sender email address in SendGrid.');
    } else if (error.code === 401) {
      throw new Error('Invalid SendGrid API key. Please check your configuration.');
    } else if (error.response?.body?.errors) {
      const errorMsg = error.response.body.errors[0]?.message || 'SendGrid configuration error';
      throw new Error(`Email service error: ${errorMsg}`);
    } else {
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'https://localhost:5000'}/reset-password?token=${token}`;
  
  const senderEmail = process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
  
  const msg = {
    to: email,
    from: senderEmail,
    subject: 'Reset Your SmoothEDIT Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin-bottom: 10px;">Reset Your Password</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            You requested to reset your password. Click the button below to set a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}