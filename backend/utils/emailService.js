import nodemailer from 'nodemailer';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export const isEmailConfigured = () => Boolean(
  process.env.SMTP_HOST
  && process.env.SMTP_PORT
  && process.env.SMTP_USER
  && process.env.SMTP_PASS
  && process.env.EMAIL_FROM_ADDRESS,
);

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const shell = (content) => `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:#0b1f3a;padding:24px 32px;color:#fff;font-size:22px;font-weight:bold">SahaySetu</td></tr><tr><td style="padding:32px">${content}</td></tr><tr><td style="padding:18px 32px;background:#f8fafc;color:#64748b;font-size:13px">SahaySetu Support · support@sahaysetu.com</td></tr></table></td></tr></table></body></html>`;

const sendWithResend = async ({ to, from = process.env.EMAIL_FROM, subject, html, text }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!response.ok) throw new Error('Resend email delivery failed');
  } finally {
    clearTimeout(timeout);
  }
};

export const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  const safeName = escapeHtml(name || 'there');
  const safeUrl = escapeHtml(resetUrl);
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    await sendWithResend({
      to: email,
      subject: 'Reset your SahaySetu password',
      text: `Hello ${name || 'there'}, use this link to reset your password. The link expires in 15 minutes: ${resetUrl}`,
      html: shell(`<h1 style="font-size:24px">Reset your password</h1><p>Hello ${safeName},</p><p>Use the secure link below to choose a new password. The link expires in 15 minutes.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#1769aa;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p><p style="font-size:13px;color:#64748b">If you did not request a reset, ignore this email.</p>`),
    });
    return;
  }
  if (!isEmailConfigured()) {
    const error = new Error('Password reset email is not configured.');
    error.statusCode = 503;
    throw error;
  }
  await getTransporter().sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'SahaySetu Support'} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Reset your SahaySetu password',
    text: `Hello ${name || 'there'}, use this link to reset your password. The link expires in 15 minutes: ${resetUrl}`,
    html: shell(`<h1 style="font-size:24px">Reset your password</h1><p>Hello ${safeName},</p><p>Use the secure link below to choose a new password. The link expires in 15 minutes.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#1769aa;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p><p style="font-size:13px;color:#64748b">If you did not request a reset, ignore this email.</p>`),
  });
};

