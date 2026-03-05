"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async login(body) {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!email || !email.includes('@') || !password) {
            throw new common_1.BadRequestException('email and password are required');
        }
        const result = await this.auth.login(email, password);
        if (!result)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return result;
    }
    async verify2FA(body) {
        const tempToken = typeof body.tempToken === 'string' ? body.tempToken : '';
        const code = typeof body.code === 'string' ? body.code.trim() : '';
        if (!tempToken || !code) {
            throw new common_1.BadRequestException('tempToken and code are required');
        }
        if (!/^\d{6}$/.test(code)) {
            throw new common_1.BadRequestException('code must be a 6-digit number');
        }
        const result = await this.auth.verify2FA(tempToken, code);
        if (!result)
            throw new common_1.UnauthorizedException('Invalid or expired 2FA code');
        return result;
    }
    async setup2FA(req) {
        const userId = req.user.id;
        const result = await this.auth.setup2FA(userId);
        if (!result)
            throw new common_1.BadRequestException('2FA is already enabled or user not found');
        return result;
    }
    async confirm2FA(req, body) {
        const userId = req.user.id;
        const code = typeof body.code === 'string' ? body.code.trim() : '';
        if (!code || !/^\d{6}$/.test(code)) {
            throw new common_1.BadRequestException('A valid 6-digit code is required');
        }
        const ok = await this.auth.confirm2FA(userId, code);
        if (!ok)
            throw new common_1.BadRequestException('Invalid code. Please try again.');
        return { ok: true, message: '2FA has been enabled successfully' };
    }
    async disable2FA(req, body) {
        const userId = req.user.id;
        const password = typeof body.password === 'string' ? body.password : '';
        if (!password) {
            throw new common_1.BadRequestException('Password is required to disable 2FA');
        }
        const ok = await this.auth.disable2FA(userId, password);
        if (!ok)
            throw new common_1.UnauthorizedException('Incorrect password');
        return { ok: true, message: '2FA has been disabled' };
    }
    async get2FAStatus(req) {
        const userId = req.user.id;
        return this.auth.get2FAStatus(userId);
    }
    async changePassword(req, body) {
        const userId = req.user.id;
        const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
        const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
        if (!currentPassword) {
            throw new common_1.BadRequestException('currentPassword is required');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.BadRequestException('newPassword is required and must be at least 6 characters');
        }
        const ok = await this.auth.changePassword(userId, currentPassword, newPassword);
        if (!ok)
            throw new common_1.UnauthorizedException('Current password is incorrect');
        return { ok: true };
    }
    async forgotPassword(body) {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!email || !email.includes('@')) {
            throw new common_1.BadRequestException('A valid email is required');
        }
        await this.auth.forgotPassword(email);
        return { ok: true, message: 'If an account exists with that email, a reset code has been sent.' };
    }
    async resetPassword(body) {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const code = typeof body.code === 'string' ? body.code.trim() : '';
        const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
        if (!email || !email.includes('@')) {
            throw new common_1.BadRequestException('A valid email is required');
        }
        if (!code || !/^\d{6}$/.test(code)) {
            throw new common_1.BadRequestException('A valid 6-digit code is required');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new common_1.BadRequestException('New password must be at least 6 characters');
        }
        const ok = await this.auth.resetPassword(email, code, newPassword);
        if (!ok)
            throw new common_1.BadRequestException('Invalid or expired reset code');
        return { ok: true, message: 'Password has been reset successfully' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('2fa/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/setup'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setup2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirm2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('2fa'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('2fa/status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "get2FAStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map