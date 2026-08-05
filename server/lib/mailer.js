import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER/EMAIL_PASS not set — welcome emails will be skipped');
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

function welcomeEmailHtml(name) {
  return `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#12141c;padding:28px 24px;text-align:center;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:#34d399;margin-right:8px;"></span>
          <span style="color:#ffffff;font-size:18px;font-weight:800;">MyMoney</span>
        </div>
        <div style="padding:28px 24px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Welcome, ${name}.</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#4b5563;">
            Your account is ready. A few things you can do right away:
          </p>
          <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.7;color:#4b5563;">
            <li>Scan a receipt and let the app pull out the amount and merchant for you</li>
            <li>Set your monthly income to get real "can I afford this?" answers</li>
            <li>Check Insights for a breakdown of where your money's actually going</li>
          </ul>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            If you didn't create this account, you can ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail(to, name) {
  const t = getTransporter();
  if (!t) return;

  try {
    await t.sendMail({
      from: `"MyMoney" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to MyMoney',
      html: welcomeEmailHtml(name),
      text: `Welcome, ${name}. Your MyMoney account is ready — scan a receipt, set your monthly income, and check Insights to see where your money's going.`,
    });
  } catch (err) {
    // A failed welcome email should never block account creation.
    console.error('Failed to send welcome email:', err.message);
  }
}
