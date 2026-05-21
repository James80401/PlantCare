/**
 * Local dev helpers when email sign-in or reset is blocked.
 * Usage:
 *   node scripts/dev-auth-help.mjs verify <email>
 *   node scripts/dev-auth-help.mjs password <email> <newPassword>
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const [cmd, email, newPassword] = process.argv.slice(2);
if (!cmd || !email) {
  console.log(`Usage:
  node scripts/dev-auth-help.mjs verify <email>
  node scripts/dev-auth-help.mjs password <email> <newPassword>`);
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
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
} finally {
  await prisma.$disconnect();
}
