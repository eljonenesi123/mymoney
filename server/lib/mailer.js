import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER/EMAIL_PASS not set — verification emails cannot be sent');
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      // Google displays app passwords with spaces for readability; strip
      // them defensively in case they got copied verbatim.
      pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
    },
    // Fail fast instead of hanging for minutes if the host can't reach
    // Gmail's SMTP servers at all (e.g. outbound port blocked).
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
  return transporter;
}

function verificationEmailHtml(code) {
  return `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#12141c;padding:28px 24px;text-align:center;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:#34d399;margin-right:8px;"></span>
          <span style="color:#ffffff;font-size:18px;font-weight:800;">MyMoney</span>
        </div>
        <div style="padding:28px 24px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Confirm your email</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#4b5563;">
            Enter this code in the app to finish creating your account.
          </p>
          <div style="display:inline-block;background:#f3f4f6;border-radius:12px;padding:16px 28px;letter-spacing:8px;font-size:28px;font-weight:800;color:#111827;font-family:ui-monospace,monospace;">
            ${code}
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
            This code expires in 10 minutes. If you didn't request this, you can ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Throws on failure (unlike a fire-and-forget notification) — the whole
// point of this flow is that an account only gets created once the code
// is confirmed delivered and entered correctly, so the caller needs to
// know if sending genuinely failed.
export async function sendVerificationCode(to, code) {
  const t = getTransporter();
  if (!t) {
    throw new Error('Email sending is not configured on the server');
  }

  await t.sendMail({
    from: `"MyMoney" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${code} is your MyMoney verification code`,
    html: verificationEmailHtml(code),
    text: `Your MyMoney verification code is ${code}. It expires in 10 minutes.`,
  });
}
