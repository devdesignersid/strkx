"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
    const problem = await prisma.problem.findUnique({ where: { slug: 'two-sum' } });
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
    }
    else {
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
//# sourceMappingURL=simulate_solve.js.map