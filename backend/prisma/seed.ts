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
    console.log(`Upserted permission: ${permission.code}`);
  }

  // Define bootstrap UUIDs
  const brokerOrgId = 'f1b3b3a0-3b1e-4b7e-8c3e-5b1b4c3f5a1b';
  const carrierOrgId = 'c1b3b3a0-3b1e-4b7e-8c3e-5b1b4c3f5a1c';
  const brokerAdminRoleId = 'a1b3b3a0-3b1e-4b7e-8c3e-5b1b4c3f5a1a';
  const carrierAdminRoleId = 'd1b3b3a0-3b1e-4b7e-8c3e-5b1b4c3f5a1d';
  const supabaseUserId = '51694d17-a79d-483e-8a7a-aadda38c39f1';

  // 1. Broker Organization
  await prisma.organization.upsert({
    where: { id: brokerOrgId },
    update: { name: 'Main Brokerage Org' },
    create: { id: brokerOrgId, name: 'Main Brokerage Org', type: 'BROKER' },
  });

  // 2. Carrier Organization
  await prisma.organization.upsert({
    where: { id: carrierOrgId },
    update: { name: 'Primary Carrier Org' },
    create: { id: carrierOrgId, name: 'Primary Carrier Org', type: 'CARRIER' },
  });

  // 3. BROKER_ADMIN Role
  await prisma.role.upsert({
    where: { organizationId_name: { organizationId: brokerOrgId, name: 'BROKER_ADMIN' } },
    update: {},
    create: { id: brokerAdminRoleId, organizationId: brokerOrgId, name: 'BROKER_ADMIN' },
  });

  // 4. CARRIER_ADMIN Role
  await prisma.role.upsert({
    where: { organizationId_name: { organizationId: carrierOrgId, name: 'CARRIER_ADMIN' } },
    update: {},
    create: { id: carrierAdminRoleId, organizationId: carrierOrgId, name: 'CARRIER_ADMIN' },
  });

  // 5. Test Application User (Payal)
  const testUser = await prisma.user.upsert({
    where: { id: supabaseUserId },
    update: {
      email: 'payal.loadflow@test.com',
      name: 'Payal LoadFlow Test',
      accountType: 'BROKER',
    },
    create: {
      id: supabaseUserId,
      email: 'payal.loadflow@test.com',
      name: 'Payal LoadFlow Test',
      accountType: 'BROKER',
    },
  });

  // 6. Organization Membership for Payal -> Broker
  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: supabaseUserId, organizationId: brokerOrgId } },
    update: {},
    create: { userId: supabaseUserId, organizationId: brokerOrgId },
  });

  // 7. UserRole for Payal -> BROKER_ADMIN
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: supabaseUserId, roleId: brokerAdminRoleId } },
    update: {},
    create: { userId: supabaseUserId, roleId: brokerAdminRoleId },
  });

  console.log(`Upserted test application user: ${testUser.email} with BROKER_ADMIN role`);

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
