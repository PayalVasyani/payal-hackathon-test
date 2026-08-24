import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});



async function main() {
  const permissions = [
    { code: 'load.create', description: 'Create a new load' },
    { code: 'load.assign_carrier', description: 'Assign a carrier to a load' },
    { code: 'load.override_compliance_flag', description: 'Override a carrier compliance block' },
    { code: 'rate.confirm', description: 'Confirm a rate version' },
    { code: 'load.update_status', description: 'Update the status of a load' },
    { code: 'staff.manage', description: 'Manage organization staff and roles' },
    { code: 'pod.upload', description: 'Upload a Proof of Delivery document' },
  ];
  console.log(`Start seeding ...`);
  for (const p of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
    console.log(`Upserted permission with code: ${permission.code}`);
  }

  // Seed test user to match Supabase Auth User
  const supabaseUserId = '51694d17-a79d-483e-8a7a-aadda38c39f1';
  const testUser = await prisma.user.upsert({
    where: { id: supabaseUserId },
    update: {
      email: 'payal.loadflow@test.com',
      name: 'Payal LoadFlow Test',
    },
    create: {
      id: supabaseUserId,
      email: 'payal.loadflow@test.com',
      name: 'Payal LoadFlow Test',
      accountType: 'BROKER',
    },
  });
  console.log(`Upserted test application user: ${testUser.email}`);

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
