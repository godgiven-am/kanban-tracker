import nodemailer from 'nodemailer';

const transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;

export async function sendVerification(user, token) {
  const link = `${process.env.APP_URL || 'http://localhost:3000'}/?verify=${token}`;
  if (!transport) return console.log(`Verification link for ${user.email}: ${link}`);
  await transport.sendMail({
    from: process.env.MAIL_FROM || 'Kanban <no-reply@localhost>',
    to: user.email,
    subject: 'Verify your email',
    text: `Hi ${user.name}, confirm your email within 24 hours: ${link}`,
  });
}
