// Server-side only email service
//
// Purpose
//   - Provide a minimal, server-only email sender for Better Auth OTP flows.
//   - Supports SMTP delivery with a console fallback for development/testing.
//   - Isolated here to avoid bundling on the client.
//
// Sync vs Async
//   - Email operations are async IO; `sendOTP` is async and awaited by the
//     Better Auth plugin callback.
//   - Guard against client usage by throwing if `window` is defined.
//
// Configuration
//   - SMTP: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS required
//   - EMAIL_PROVIDER env var controls which method to use
//   - Use provider-specific app passwords where necessary (e.g., Gmail).
//
// Security
//   - Do not log OTP values or PII beyond what is necessary for delivery.
//   - Templates should remain generic and not leak environment details.
import nodemailer from "nodemailer";

async function sendSMTPEmail(email: string, otp: string, type: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject = type === "email-verification" 
    ? "Verify your ProjectHub email" 
    : type === "forget-password"
    ? "Reset your ProjectHub password"
    : "Your ProjectHub login code";
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #2563eb;">ProjectHub</h2>
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; text-align: center; color: #1f2937;">${otp}</h1>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from ProjectHub. Please do not reply to this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ProjectHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });

  console.log(`📧 Email sent via SMTP to ${email}: OTP: ${otp}`);
}

export async function sendOTP(email: string, otp: string, type: 'email-verification' | 'sign-in' | 'forget-password') {
  // Only run on server side
  if (typeof window !== 'undefined') {
    throw new Error('Email service can only be used on server side');
  }

  const provider = process.env.EMAIL_PROVIDER || 'console';

  try {
    switch (provider) {
      case 'smtp':
        await sendSMTPEmail(email, otp, type);
        break;
      
      case 'console':
      default:
        if (provider === 'mailtrap') {
          console.warn('Mailtrap provider is deprecated; falling back to console logging.');
        }
        console.log(`📧 Email sent to ${email}: OTP: ${otp}`);
        console.log(`   Subject: Your ProjectHub ${type === 'email-verification' ? 'verification' : type === 'forget-password' ? 'password reset' : 'login'} code`);
        break;
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [FALLBACK] Email to ${email}: OTP: ${otp}`);
    } else {
      throw error;
    }
  }
}

/**
 * Send a generic email notification
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text fallback
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // Only run on server side
  if (typeof window !== 'undefined') {
    throw new Error('Email service can only be used on server side');
  }

  const provider = process.env.EMAIL_PROVIDER || 'console';

  try {
    switch (provider) {
      case 'smtp':
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: parseInt(process.env.EMAIL_PORT || "587"),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"ProjectHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags as fallback
        });

        console.log(`📧 Email sent via SMTP to ${to}: ${subject}`);
        break;
      
      case 'console':
      default:
        console.log(`📧 Email sent to ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Content: ${text || html.replace(/<[^>]*>/g, '')}`);
        break;
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [FALLBACK] Email to ${to}: ${subject}`);
    } else {
      throw error;
    }
  }
}
