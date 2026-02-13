import nodemailer from "nodemailer";

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  // If SMTP is not configured, log and return (useful for development)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not sent (SMTP not configured):", { to, subject });
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Email templates
export function applicationSubmittedEmail(
  applicantName: string,
  trackingToken: string,
  baseUrl: string
): { subject: string; html: string } {
  const trackingUrl = `${baseUrl}/application-status/${trackingToken}`;
  
  return {
    subject: "Application Received - Veterinary Syndicate",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Veterinary Syndicate</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">سەندیکای پزیشکانی ڤێتێرنەری</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #059669; margin-top: 0;">Application Received!</h2>
          
          <p>Dear ${applicantName},</p>
          
          <p>Thank you for submitting your membership application to the Veterinary Syndicate. Your application has been received and is now pending review by the branch office.</p>
          
          <p>You can track your application status using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Check Application Status
            </a>
          </div>
          
          <p style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
            <strong>Your Tracking Token:</strong><br>
            <code style="font-size: 14px; color: #059669;">${trackingToken}</code>
          </p>
          
          <p>If you have any questions, please contact your local branch office.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function applicationApprovedEmail(
  applicantName: string,
  memberId: string,
  trackingToken: string,
  baseUrl: string
): { subject: string; html: string } {
  const statusUrl = `${baseUrl}/application-status/${trackingToken}`;
  
  return {
    subject: "Application Approved - Welcome to the Veterinary Syndicate!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Congratulations!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">پیرۆزە!</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #059669; margin-top: 0;">Your Application Has Been Approved!</h2>
          
          <p>Dear ${applicantName},</p>
          
          <p>We are pleased to inform you that your membership application has been approved. Welcome to the Veterinary Syndicate!</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Member ID</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #059669;">${memberId}</p>
          </div>
          
          <p>You can now view and download your digital membership ID card:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${statusUrl}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Membership ID
            </a>
          </div>
          
          <p>Your membership is valid for one year from the date of approval. You will receive a reminder before it expires.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function applicationRejectedEmail(
  applicantName: string,
  rejectionReason: string,
  trackingToken: string,
  baseUrl: string
): { subject: string; html: string } {
  const statusUrl = `${baseUrl}/application-status/${trackingToken}`;
  
  return {
    subject: "Application Update - Veterinary Syndicate",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Application Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">نوێکردنەوەی داواکاری</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #dc2626; margin-top: 0;">Application Not Approved</h2>
          
          <p>Dear ${applicantName},</p>
          
          <p>We regret to inform you that your membership application has not been approved at this time.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Reason:</strong></p>
            <p style="margin: 10px 0 0; color: #991b1b;">${rejectionReason}</p>
          </div>
          
          <p>You may view the full details of your application status here:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${statusUrl}" style="background: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Application Status
            </a>
          </div>
          
          <p>If you believe this decision was made in error or have questions, please contact your local branch office.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function renewalReminderEmail(
  memberName: string,
  memberId: string,
  expiryDate: string,
  trackingToken: string,
  baseUrl: string
): { subject: string; html: string } {
  const statusUrl = `${baseUrl}/application-status/${trackingToken}`;
  
  return {
    subject: "Membership Renewal Reminder - Veterinary Syndicate",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Renewal Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">بیرهێنانەوەی نوێکردنەوە</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #f59e0b; margin-top: 0;">Your Membership is Expiring Soon</h2>
          
          <p>Dear ${memberName},</p>
          
          <p>This is a friendly reminder that your Veterinary Syndicate membership will expire on <strong>${expiryDate}</strong>.</p>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Member ID</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${memberId}</p>
            <p style="margin: 10px 0 0; color: #92400e;">Expires: ${expiryDate}</p>
          </div>
          
          <p>To renew your membership, please click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${statusUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Request Renewal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}
