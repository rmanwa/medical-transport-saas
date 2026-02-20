"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const me_module_1 = require("./me/me.module");
const branches_module_1 = require("./branches/branches.module");
const hospitals_module_1 = require("./hospitals/hospitals.module");
const patients_module_1 = require("./patients/patients.module");
const shifts_module_1 = require("./shifts/shifts.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const auth_module_1 = require("./auth/auth.module");
let AppModule = class AppModule {
    configure(consumer) {
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            me_module_1.MeModule,
            branches_module_1.BranchesModule,
            hospitals_module_1.HospitalsModule,
            patients_module_1.PatientsModule,
            shifts_module_1.ShiftsModule,
            dashboard_module_1.DashboardModule,
            auth_module_1.AuthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map