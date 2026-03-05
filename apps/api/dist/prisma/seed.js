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
    console.log('🌱 Seeding database...\n');
    await prisma.auditLog.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.userBranch.deleteMany();
    await prisma.hospital.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.company.deleteMany();
    console.log('🧹 Cleaned existing data\n');
    const company = await prisma.company.create({
        data: { name: 'Arizona Medical Transport' },
    });
    console.log('✅ Company created:', company.name);
    const adminPassword = await bcrypt.hash('Admin@2026', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'robertmanwa@icloud.com',
            passwordHash: adminPassword,
            name: 'Robert Admin',
            role: client_1.Role.SUPER_ADMIN,
            companyId: company.id,
            canAccessAllBranches: true,
            mustChangePassword: false,
        },
    });
    console.log('✅ Admin created:', admin.email, '/ password: Admin@2026');
    const phoenixBranch = await prisma.branch.create({
        data: { name: 'Phoenix Main', address: '4502 N Central Ave, Phoenix, AZ 85012', companyId: company.id },
    });
    const tucsonBranch = await prisma.branch.create({
        data: { name: 'Tucson South', address: '1920 E Speedway Blvd, Tucson, AZ 85719', companyId: company.id },
    });
    const mesaBranch = await prisma.branch.create({
        data: { name: 'Mesa East', address: '655 E Southern Ave, Mesa, AZ 85204', companyId: company.id },
    });
    console.log('✅ Branches created: Phoenix Main, Tucson South, Mesa East');
    await prisma.userBranch.createMany({
        data: [
            { userId: admin.id, branchId: phoenixBranch.id },
            { userId: admin.id, branchId: tucsonBranch.id },
            { userId: admin.id, branchId: mesaBranch.id },
        ],
    });
    const staffPassword = await bcrypt.hash('Staff@2026', 10);
    const sarah = await prisma.user.create({ data: { email: 'robamanwa@gmail.com', passwordHash: staffPassword, name: 'Sarah Johnson', role: client_1.Role.STAFF, companyId: company.id, canAccessAllBranches: false, mustChangePassword: true } });
    const james = await prisma.user.create({ data: { email: 'james@arizonamedtransport.com', passwordHash: staffPassword, name: 'James Williams', role: client_1.Role.STAFF, companyId: company.id, canAccessAllBranches: false, mustChangePassword: true } });
    const maria = await prisma.user.create({ data: { email: 'maria@arizonamedtransport.com', passwordHash: staffPassword, name: 'Maria Garcia', role: client_1.Role.STAFF, companyId: company.id, canAccessAllBranches: false, mustChangePassword: true } });
    console.log('✅ Staff created: Sarah, James, Maria / password: Staff@2026');
    await prisma.userBranch.createMany({
        data: [
            { userId: sarah.id, branchId: phoenixBranch.id },
            { userId: james.id, branchId: tucsonBranch.id },
            { userId: maria.id, branchId: phoenixBranch.id },
            { userId: maria.id, branchId: mesaBranch.id },
        ],
    });
    console.log('✅ Staff assigned to branches');
    const [stJosephs, bannerUMC, mercyGilbert] = await Promise.all([
        prisma.hospital.create({ data: { name: "St. Joseph's Hospital", address: '350 W Thomas Rd, Phoenix, AZ 85013', companyId: company.id } }),
        prisma.hospital.create({ data: { name: 'Banner UMC Tucson', address: '1501 N Campbell Ave, Tucson, AZ 85724', companyId: company.id } }),
        prisma.hospital.create({ data: { name: 'Mercy Gilbert Medical Center', address: '3555 S Val Vista Dr, Gilbert, AZ 85297', companyId: company.id } }),
    ]);
    console.log("✅ Hospitals created: St. Joseph's, Banner UMC, Mercy Gilbert");
    const helen = await prisma.patient.create({ data: { firstName: 'Helen', lastName: 'Martinez', gender: 'Female', dateOfBirth: new Date('1948-03-15'), email: 'ezraoburuu@gmail.com', branchId: phoenixBranch.id } });
    const william = await prisma.patient.create({ data: { firstName: 'William', lastName: 'Thompson', gender: 'Male', dateOfBirth: new Date('1955-07-22'), email: 'william.t@email.com', branchId: phoenixBranch.id } });
    const dorothy = await prisma.patient.create({ data: { firstName: 'Dorothy', lastName: 'Chen', gender: 'Female', dateOfBirth: new Date('1940-11-08'), branchId: tucsonBranch.id } });
    const richard = await prisma.patient.create({ data: { firstName: 'Richard', lastName: 'Okafor', gender: 'Male', dateOfBirth: new Date('1962-01-30'), email: 'r.okafor@email.com', branchId: mesaBranch.id } });
    const margaret = await prisma.patient.create({ data: { firstName: 'Margaret', lastName: 'Wilson', gender: 'Female', dateOfBirth: new Date('1951-09-12'), branchId: phoenixBranch.id } });
    console.log('✅ Patients created: Helen, William, Dorothy, Richard, Margaret');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    function makeTime(base, hour, minute = 0) { const d = new Date(base); d.setHours(hour, minute, 0, 0); return d; }
    await prisma.shift.createMany({
        data: [
            { patientId: helen.id, branchId: phoenixBranch.id, hospitalId: stJosephs.id, startTime: makeTime(tomorrow, 9, 0), endTime: makeTime(tomorrow, 10, 30), type: client_1.MeetingType.PHYSICAL, priority: client_1.Priority.NORMAL, notes: 'Routine cardiology checkup' },
            { patientId: william.id, branchId: phoenixBranch.id, hospitalId: stJosephs.id, startTime: makeTime(tomorrow, 11, 0), endTime: makeTime(tomorrow, 12, 0), type: client_1.MeetingType.PHYSICAL, priority: client_1.Priority.URGENT, notes: 'Post-surgery follow-up — needs wheelchair transport' },
            { patientId: dorothy.id, branchId: tucsonBranch.id, hospitalId: bannerUMC.id, startTime: makeTime(tomorrow, 14, 0), endTime: makeTime(tomorrow, 15, 30), type: client_1.MeetingType.PHYSICAL, priority: client_1.Priority.NORMAL, notes: 'Dialysis session' },
            { patientId: richard.id, branchId: mesaBranch.id, hospitalId: mercyGilbert.id, startTime: makeTime(nextWeek, 10, 0), endTime: makeTime(nextWeek, 11, 0), type: client_1.MeetingType.PHYSICAL, priority: client_1.Priority.NORMAL, notes: 'Orthopedic consultation' },
            { patientId: margaret.id, branchId: phoenixBranch.id, startTime: makeTime(nextWeek, 13, 0), endTime: makeTime(nextWeek, 13, 30), type: client_1.MeetingType.VIRTUAL, priority: client_1.Priority.NORMAL, notes: 'Telehealth follow-up with primary care' },
        ],
    });
    console.log('✅ Sample appointments created\n');
    console.log('═══════════════════════════════════════════');
    console.log('  🏥 Seed Complete!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('  Admin Login:');
    console.log('    Email:    robertmanwa@icloud.com');
    console.log('    Password: Admin@2026');
    console.log('');
    console.log('  Staff Login (any):');
    console.log('    robamanwa@gmail.com');
    console.log('    james@arizonamedtransport.com');
    console.log('    maria@arizonamedtransport.com');
    console.log('    Password: Staff@2026');
    console.log('');
    console.log('  3 Branches · 3 Hospitals · 5 Patients · 5 Appointments');
    console.log('═══════════════════════════════════════════\n');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map