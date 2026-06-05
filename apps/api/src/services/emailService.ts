import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function buildTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = buildTransporter();
  return cachedTransporter;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || "no-reply@construction-erp.local";

  if (!transporter) {
    // Dev fallback: no SMTP configured. Log to console so tokens are testable.
    console.log("\n[emailService] SMTP not configured — email not sent.");
    console.log(`  to:      ${input.to}`);
    console.log(`  subject: ${input.subject}`);
    console.log(`  body:\n${input.text}\n`);
    return;
  }
  console.log(`  body:\n${input.text}\n`);
  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export function buildInvitationEmail(params: {
  email: string;
  role: string;
  inviteUrl: string;
}): SendEmailInput {
  const { email, role, inviteUrl } = params;
  const subject = "You're invited to Construction ERP";
  const text = `You've been invited to join Construction ERP as ${role}.\n\nAccept the invitation and create your account:\n${inviteUrl}\n\nIf you did not expect this email, you can ignore it.`;
  const html = `
    <div style="font-family:Inter,Roboto,Arial,sans-serif;color:#0F172A;">
      <h2 style="margin:0 0 12px 0;">You're invited to Construction ERP</h2>
      <p>You've been invited to join as <strong>${role}</strong>.</p>
      <p>
        <a href="${inviteUrl}"
           style="display:inline-block;padding:10px 18px;background:#1976D2;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Accept invitation
        </a>
      </p>
      <p style="color:#64748B;font-size:12px;">
        Or paste this link into your browser:<br/>${inviteUrl}
      </p>
      <p style="color:#64748B;font-size:12px;">If you did not expect this email for ${email}, you can ignore it.</p>
    </div>
  `;
  return { to: email, subject, html, text };
}

export function buildSubcontractorInvitationEmail(params: {
  email: string;
  ownerCompanyName: string;
  subcontractorCompanyName: string;
  acceptUrl: string;
}): SendEmailInput {
  const { email, ownerCompanyName, subcontractorCompanyName, acceptUrl } = params;
  const subject = `${ownerCompanyName} invited your company to BuildPulse workpoints`;
  const text = `${ownerCompanyName} invited ${subcontractorCompanyName} to collaborate on BuildPulse workpoints.\n\nAccept the subcontractor invitation:\n${acceptUrl}\n\nAfter acceptance, your worker users can scan attendance QR codes for ${ownerCompanyName}'s workpoints. If you did not expect this email, you can ignore it.`;
  const html = `
    <div style="font-family:Inter,Roboto,Arial,sans-serif;color:#0F172A;">
      <h2 style="margin:0 0 12px 0;">Subcontractor invitation</h2>
      <p><strong>${ownerCompanyName}</strong> invited <strong>${subcontractorCompanyName}</strong> to collaborate on BuildPulse workpoints.</p>
      <p>
        <a href="${acceptUrl}"
           style="display:inline-block;padding:10px 18px;background:#1976D2;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Accept invitation
        </a>
      </p>
      <p style="color:#64748B;font-size:12px;">
        Or paste this link into your browser:<br/>${acceptUrl}
      </p>
      <p style="color:#64748B;font-size:12px;">If you did not expect this email for ${email}, you can ignore it.</p>
    </div>
  `;
  return { to: email, subject, html, text };
}

export function buildPasswordResetEmail(params: {
  email: string;
  username: string;
  resetUrl: string;
}): SendEmailInput {
  const { email, username, resetUrl } = params;
  const subject = "Reset your BuildPulse password";
  const text = `Hi ${username},\n\nUse this link to reset your BuildPulse password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, you can ignore this email.`;
  const html = `
    <div style="font-family:Inter,Roboto,Arial,sans-serif;color:#0F172A;">
      <h2 style="margin:0 0 12px 0;">Reset your BuildPulse password</h2>
      <p>Hi ${username},</p>
      <p>Use the button below to choose a new password.</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:10px 18px;background:#1976D2;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset password
        </a>
      </p>
      <p style="color:#64748B;font-size:12px;">
        Or paste this link into your browser:<br/>${resetUrl}
      </p>
      <p style="color:#64748B;font-size:12px;">This link expires in 1 hour. If you did not request this email for ${email}, you can ignore it.</p>
    </div>
  `;
  return { to: email, subject, html, text };
}
