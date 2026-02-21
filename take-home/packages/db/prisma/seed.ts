import { prisma } from '../src/index.js';

async function main() {
  console.log('Starting seed...');

  const user = await prisma.user.create({
    data: {
      email: 'test@test.com',
      name: 'Test User',
    },
  });

  console.log('Created or updated user:', user.id);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
