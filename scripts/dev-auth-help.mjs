/**
 * Local dev helpers when email sign-in or reset is blocked.
 * Usage:
 *   node scripts/dev-auth-help.mjs verify <email>
 *   node scripts/dev-auth-help.mjs password <email> <newPassword>
 *   node scripts/dev-auth-help.mjs reset-link <email>
 */
import { readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function frontendBase() {
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8');
    const m = raw.match(/^\s*FRONTEND_URL\s*=\s*["']?([^"'\s#]+)/m);
    if (m) return m[1].replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return 'http://localhost:5173';
}

const [cmd, email, newPassword] = process.argv.slice(2);
if (!cmd || !email) {
  console.log(`Usage:
  npm run dev:auth-help -- verify <email>
  npm run dev:auth-help -- password <email> <newPassword>
  npm run dev:auth-help -- reset-link <email>`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  if (cmd === 'verify') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
    console.log(`Verified ${email} — you can sign in now (if the API uses this database).`);
  } else if (cmd === 'password') {
    if (!newPassword || newPassword.length < 8) {
      console.error('Password must be at least 8 characters.');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true,
      },
    });
    console.log(`Password updated for ${email}.`);
  } else if (cmd === 'reset-link') {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    const url = `${frontendBase()}/reset-password/${token}`;
    console.log(`Reset link for ${email} (expires in 1 hour):\n${url}`);
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
} finally {
  await prisma.$disconnect();
}
