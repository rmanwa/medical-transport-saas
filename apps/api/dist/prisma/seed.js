"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordPlain = 'Password123!';
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
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
    const branches = await Promise.all(branchesData.map((b) => prisma.branch.create({
        data: {
            ...b,
            companyId: company.id,
        },
    })));
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
            role: client_1.Role.SUPER_ADMIN,
            passwordHash,
        },
    });
    const staff = await prisma.user.create({
        data: {
            companyId: company.id,
            email: 'staff@acmemedtransport.com',
            name: 'Staff',
            role: client_1.Role.STAFF,
            passwordHash,
        },
    });
    const staffBranchIds = [branches.find((b) => b.name === 'Central').id, branches.find((b) => b.name === 'North').id];
    await prisma.userBranch.createMany({
        data: staffBranchIds.map((branchId) => ({
            userId: staff.id,
            branchId,
        })),
    });
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
//# sourceMappingURL=seed.js.map