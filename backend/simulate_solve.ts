import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
  const problem = user ? await prisma.problem.findFirst({ where: { slug: 'two-sum', userId: user.id } }) : null;

  if (user && problem) {
    await prisma.submission.create({
      data: {
        code: '// solved via simulation',
        language: 'javascript',
        status: 'ACCEPTED',
        output: '[]',
        problemId: problem.id,
        userId: user.id,
      },
    });
    console.log('Inserted submission');
  } else {
    console.log('User or Problem not found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
