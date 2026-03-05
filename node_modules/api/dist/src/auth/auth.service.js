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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const otplib_1 = require("otplib");
const QRCode = __importStar(require("qrcode"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, emailService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.emailService = emailService;
    }
    async login(email, password) {
        const normalizedEmail = (email ?? '').trim().toLowerCase();
        const rawPassword = password ?? '';
        if (!normalizedEmail || !rawPassword)
            return null;
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { branches: true },
        });
        if (!user)
            return null;
        const ok = await bcrypt.compare(rawPassword, user.passwordHash);
        if (!ok)
            return null;
        if (user.twoFactorEnabled) {
            const tempToken = await this.jwt.signAsync({ sub: user.id, purpose: '2fa-pending' }, { expiresIn: '5m' });
            return { requires2FA: true, tempToken };
        }
        const accessToken = await this.jwt.signAsync({
            sub: user.id,
            companyId: user.companyId,
            role: user.role,
        });
        return { accessToken };
    }
    async verify2FA(tempToken, code) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(tempToken);
        }
        catch {
            return null;
        }
        if (payload.purpose !== '2fa-pending')
            return null;
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret)
            return null;
        const isValid = otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!isValid)
            return null;
        const accessToken = await this.jwt.signAsync({
            sub: user.id,
            companyId: user.companyId,
            role: user.role,
        });
        return { accessToken };
    }
    async setup2FA(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return null;
        if (user.twoFactorEnabled)
            return null;
        const secret = otplib_1.authenticator.generateSecret();
        const otpauth = otplib_1.authenticator.keyuri(user.email, 'ClinicDashboard', secret);
        const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });
        return { qrCodeDataUrl, secret };
    }
    async confirm2FA(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret)
            return false;
        const isValid = otplib_1.authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });
        if (!isValid)
            return false;
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
        return true;
    }
    async disable2FA(userId, password) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return false;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return false;
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null },
        });
        return true;
    }
    async get2FAStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true },
        });
        return { enabled: user?.twoFactorEnabled ?? false };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            return false;
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok)
            return false;
        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                mustChangePassword: false,
            },
        });
        return true;
    }
    async forgotPassword(email) {
        const normalizedEmail = (email ?? '').trim().toLowerCase();
        if (!normalizedEmail)
            return false;
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user)
            return true;
        const code = crypto.randomInt(100000, 999999).toString();
        const codeHash = await bcrypt.hash(code, 10);
        await this.prisma.passwordReset.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });
        await this.prisma.passwordReset.create({
            data: {
                codeHash,
                userId: user.id,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        });
        try {
            await this.emailService.sendMail({
                to: user.email,
                subject: 'Password Reset Code',
                html: `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1e293b; margin-bottom: 8px;">Password Reset</h2>
            <p style="color: #475569;">Hello ${user.name},</p>
            <p style="color: #475569;">You requested a password reset. Use the code below to reset your password:</p>
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 16px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
            });
        }
        catch (err) {
            this.logger.error('Failed to send password reset email', err);
        }
        return true;
    }
    async resetPassword(email, code, newPassword) {
        const normalizedEmail = (email ?? '').trim().toLowerCase();
        if (!normalizedEmail || !code || !newPassword)
            return false;
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user)
            return false;
        const reset = await this.prisma.passwordReset.findFirst({
            where: {
                userId: user.id,
                used: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!reset)
            return false;
        const codeOk = await bcrypt.compare(code, reset.codeHash);
        if (!codeOk)
            return false;
        await this.prisma.passwordReset.update({
            where: { id: reset.id },
            data: { used: true },
        });
        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                mustChangePassword: false,
            },
        });
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map