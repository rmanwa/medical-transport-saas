import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

const candidates = [
  join(process.cwd(), 'apps', 'api', '.env'),
  join(process.cwd(), '.env'),
  join(process.cwd(), 'apps/api/.env'),
];

for (const p of candidates) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

async function main() {
  const email = 'manager@acmemedtransport.com';
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  // Find any existing company OR create one
  const company =
    (await prisma.company.findFirst()) ??
    (await prisma.company.create({ data: { name: 'Acme Med Transport' } }));

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: 'Manager',
      role: 'SUPER_ADMIN',
      companyId: company.id,
      canAccessAllBranches: true,
    },
    create: {
      email,
      passwordHash,
      name: 'Manager',
      role: 'SUPER_ADMIN',
      companyId: company.id,
      canAccessAllBranches: true,
    },
  });

  // Ensure branches exist
  const branchNames = ['North', 'South', 'East', 'West', 'Central'];
  for (const name of branchNames) {
    const exists = await prisma.branch.findFirst({ where: { companyId: company.id, name } });
    if (!exists) {
      await prisma.branch.create({
        data: { companyId: company.id, name, address: `${name} Branch Address` },
      });
    }
  }

  const branches = await prisma.branch.findMany({ where: { companyId: company.id } });

  // Link manager to branches (so /me returns branchIds)
  await prisma.userBranch.createMany({
    data: branches.map((b) => ({ userId: user.id, branchId: b.id })),
    skipDuplicates: true,
  });

  console.log('✅ Manager ready');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Company:', company.id);
  console.log('Branches linked:', branches.length);
}

main()
  .catch((e) => {
    console.error('❌ failed', e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());