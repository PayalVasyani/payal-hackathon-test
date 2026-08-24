import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'shipper.loadflow@test.com' },
    data: { id: 'b5bdf10e-56b6-4cc6-9a2e-f5a14211b10f' }
  });
  console.log('Fixed shipper ID in Prisma.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
