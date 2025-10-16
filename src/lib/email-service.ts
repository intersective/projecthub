// Server-side only email service
//
// Purpose
//   - Provide a minimal, server-only email sender for Better Auth OTP flows.
//   - Supports both Mailtrap API (development) and SMTP (production).
//   - Isolated here to avoid bundling on the client.
//
// Sync vs Async
//   - Email operations are async IO; `sendOTP` is async and awaited by the
//     Better Auth plugin callback.
//   - Guard against client usage by throwing if `window` is defined.
//
// Configuration
//   - Mailtrap: MAILTRAP_API_TOKEN, MAILTRAP_SEND_ENDPOINT required
//   - SMTP: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS required
//   - EMAIL_PROVIDER env var controls which method to use
//   - Use provider-specific app passwords where necessary (e.g., Gmail).
//
// Security
//   - Do not log OTP values or PII beyond what is necessary for delivery.
//   - Templates should remain generic and not leak environment details.
import nodemailer from "nodemailer";

async function sendMailtrapEmail(email: string, otp: string, type: string) {
  const token = process.env.MAILTRAP_API_TOKEN;
  const endpoint = process.env.MAILTRAP_SEND_ENDPOINT;
  const senderEmail = process.env.MAILTRAP_SENDER_EMAIL || "hello@example.com";
  const senderName = process.env.MAILTRAP_SENDER_NAME || "ProjectHub Dev";

  if (!token || !endpoint) {
    throw new Error('Mailtrap configuration missing: MAILTRAP_API_TOKEN and MAILTRAP_SEND_ENDPOINT required');
  }

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
        This email was sent from ProjectHub Dev. Please do not reply to this email.
      </p>
    </div>
  `;

  const payload = {
    from: {
      email: senderEmail,
      name: senderName
    },
    to: [{ email }],
    subject,
    html,
    category: "ProjectHub OTP"
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailtrap API error: ${response.status} ${error}`);
  }

  console.log(`📧 Email sent via Mailtrap to ${email}: OTP: ${otp}`);
  return await response.json();
}

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
      case 'mailtrap':
        await sendMailtrapEmail(email, otp, type);
        break;
      
      case 'smtp':
        await sendSMTPEmail(email, otp, type);
        break;
      
      case 'console':
      default:
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
