import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const carrierAdminRoleId = 'd1b3b3a0-3b1e-4b7e-8c3e-5b1b4c3f5a11'; // ID from seed.ts
  const permission = await prisma.permission.findUnique({ where: { code: 'staff.manage' } });
  
  if (permission) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: carrierAdminRoleId, permissionId: permission.id } },
      update: {},
      create: { roleId: carrierAdminRoleId, permissionId: permission.id },
    });
    console.log('Successfully granted staff.manage permission to Carrier Admin.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
