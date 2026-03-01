import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Get the first company and branch
  const company = await prisma.company.findFirst();
  if (!company) throw new Error('No company found');

  const branch = await prisma.branch.findFirst({
    where: { companyId: company.id },
  });
  if (!branch) throw new Error('No branch found');

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'staff@test.com',
      passwordHash,
      name: 'Test Staff',
      role: 'STAFF',
      companyId: company.id,
      canAccessAllBranches: false,
      branches: {
        create: {
          branchId: branch.id,
        },
      },
    },
  });

  console.log('Staff user created:', user.email, '| branchId:', branch.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());