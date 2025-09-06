import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendIdeaNotification(idea: { text: string; userName: string | null }): Promise<boolean> {
  const subject = `New Feature Idea Submitted`;
  const text = `
New feature idea submitted to SmoothEDIT:

Idea: ${idea.text}
Submitted by: ${idea.userName || 'Anonymous'}

You can view and manage all ideas in the Nice2Have section of your app.
  `;

  const html = `
    <h2>New Feature Idea Submitted</h2>
    <p>A new feature idea has been submitted to SmoothEDIT:</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Idea:</strong> ${idea.text}</p>
      <p><strong>Submitted by:</strong> ${idea.userName || 'Anonymous'}</p>
    </div>
    
    <p>You can view and manage all ideas in the Nice2Have section of your app.</p>
  `;

  return await sendEmail({
    to: 'jguynes74@gmail.com',
    from: 'noreply@smoothedit.com',
    subject,
    text,
    html
  });
}