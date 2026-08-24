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
    { code: 'load.read', description: 'Read loads' },
    { code: 'load.create', description: 'Create a new load' },
    { code: 'load.assign_carrier', description: 'Assign a carrier to a load' },
    { code: 'load.override_compliance_flag', description: 'Override a carrier compliance block' },
    { code: 'rate.create', description: 'Create a new rate version' },
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

  // 5. Test Application User (Payal - Broker)
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

  // Carrier Test User
  const carrierSupabaseUserId = '84d8e48a-25fa-4c0c-bba0-62fcf62ae743';
  
  // Fix for existing local user
  try {
    const oldCarrier = await prisma.user.findUnique({ where: { email: 'carrier.loadflow@test.com' } });
    if (oldCarrier && oldCarrier.id !== carrierSupabaseUserId) {
      await prisma.user.update({
        where: { id: oldCarrier.id },
        data: { id: carrierSupabaseUserId }
      });
      console.log('Updated old carrier user ID to match Supabase UUID');
    }
  } catch(e) {
    console.error('Error migrating old user ID', e);
  }

  const carrierTestUser = await prisma.user.upsert({
    where: { id: carrierSupabaseUserId },
    update: {
      email: 'carrier.loadflow@test.com',
      name: 'Carrier LoadFlow Test',
      accountType: 'CARRIER',
    },
    create: {
      id: carrierSupabaseUserId,
      email: 'carrier.loadflow@test.com',
      name: 'Carrier LoadFlow Test',
      accountType: 'CARRIER',
    },
  });

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: carrierSupabaseUserId, organizationId: carrierOrgId } },
    update: {},
    create: { userId: carrierSupabaseUserId, organizationId: carrierOrgId },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: carrierSupabaseUserId, roleId: carrierAdminRoleId } },
    update: {},
    create: { userId: carrierSupabaseUserId, roleId: carrierAdminRoleId },
  });

  console.log(`Upserted test application user: ${carrierTestUser.email} with CARRIER_ADMIN role`);

  // 8. Map Permissions to Roles
  const brokerAdminPermissions = [
    'load.read', 'load.create', 'load.assign_carrier',
    'load.override_compliance_flag', 'load.update_status',
    'rate.create', 'staff.manage'
  ];

  const carrierAdminPermissions = [
    'load.read', 'rate.confirm', 'pod.upload', 'load.update_status'
  ];

  const allPermissions = await prisma.permission.findMany();

  for (const code of brokerAdminPermissions) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: brokerAdminRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: brokerAdminRoleId, permissionId: perm.id },
      });
    }
  }

  for (const code of carrierAdminPermissions) {
    const perm = allPermissions.find(p => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: carrierAdminRoleId, permissionId: perm.id } },
        update: {},
        create: { roleId: carrierAdminRoleId, permissionId: perm.id },
      });
    }
  }

  console.log(`Mapped permissions to BROKER_ADMIN and CARRIER_ADMIN roles.`);

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
