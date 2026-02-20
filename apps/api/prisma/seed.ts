import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordPlain = 'Password123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Idempotent-ish approach: wipe in dependency order
  await prisma.shift.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.userBranch.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: { name: 'Acme Medical Transport' },
  });

  const branchesData = [
    { name: 'North', address: '100 North Ave, Chicago, IL 60601' },
    { name: 'South', address: '200 South Ave, Chicago, IL 60602' },
    { name: 'East', address: '300 East Ave, Chicago, IL 60603' },
    { name: 'West', address: '400 West Ave, Chicago, IL 60604' },
    { name: 'Central', address: '500 Central Ave, Chicago, IL 60605' },
  ];

  const branches = await Promise.all(
    branchesData.map((b) =>
      prisma.branch.create({
        data: {
          ...b,
          companyId: company.id,
        },
      }),
    ),
  );

  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        companyId: company.id,
        name: 'Downtown Imaging & Specialty',
        address: '77 W Monroe St, Chicago, IL 60603',
      },
    }),
    prisma.hospital.create({
      data: {
        companyId: company.id,
        name: 'Lakeside Clinic',
        address: '2100 N Lake Shore Dr, Chicago, IL 60614',
      },
    }),
    prisma.hospital.create({
      data: {
        companyId: company.id,
        name: 'Southside Rehabilitation Center',
        address: '6100 S Cottage Grove Ave, Chicago, IL 60637',
      },
    }),
  ]);

  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager@acmemedtransport.com',
      name: 'Manager',
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
  });

  const staff = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'staff@acmemedtransport.com',
      name: 'Staff',
      role: Role.STAFF,
      passwordHash,
    },
  });

  // Staff authorized for exactly 2 branches (example: Central + North)
  const staffBranchIds = [branches.find((b) => b.name === 'Central')!.id, branches.find((b) => b.name === 'North')!.id];

  await prisma.userBranch.createMany({
    data: staffBranchIds.map((branchId) => ({
      userId: staff.id,
      branchId,
    })),
  });

  // Super admin can be linked to all branches (optional; access is role-based anyway)
  await prisma.userBranch.createMany({
    data: branches.map((b) => ({
      userId: manager.id,
      branchId: b.id,
    })),
  });

  console.log('Seed complete.');
  console.log('Login credentials:');
  console.log('  manager@acmemedtransport.com / Password123!');
  console.log('  staff@acmemedtransport.com / Password123!');
  console.log('Company:', company.id);
  console.log('Branches:', branches.map((b) => ({ id: b.id, name: b.name })));
  console.log('Hospitals:', hospitals.map((h) => ({ id: h.id, name: h.name })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
