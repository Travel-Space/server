import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { userId: 'user1Id' },
    update: {},
    create: {
      name: 'User One',
      age: 30,
      userId: 'user1Id',
      password: 'password123',
      createdAt: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { userId: 'user2Id' },
    update: {},
    create: {
      name: 'User Two',
      age: 25,
      userId: 'user2Id',
      password: 'password456',
      createdAt: new Date(),
    },
  });

  console.log({ user1, user2 });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
