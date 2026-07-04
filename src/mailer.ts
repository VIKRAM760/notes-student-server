import nodemailer from 'nodemailer';

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  const configured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!configured) {
    // No SMTP configured yet — fall back to logging so the flow is still testable.
    console.log('\n[mailer] SMTP not configured. Reset link for', to, ':\n', resetUrl, '\n');
    return;
  }

  const transport = getTransport();
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your student notes password',
    text: `We received a request to reset your password.\n\nReset it here (valid for a limited time): ${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a> (link expires soon).</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
