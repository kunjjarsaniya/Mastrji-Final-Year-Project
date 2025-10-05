import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    // console.log(`✅ User ${email} is now an admin`);
    return user;
  } catch (error) {
    // console.error('❌ Error making user admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function with your email
makeAdmin('kunjjarsaniya07@gmail.com')
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
