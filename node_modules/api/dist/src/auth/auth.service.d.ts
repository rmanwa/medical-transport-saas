import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, emailService: EmailService);
    login(email: string, password: string): Promise<{
        accessToken: string;
    } | {
        requires2FA: true;
        tempToken: string;
    } | null>;
    verify2FA(tempToken: string, code: string): Promise<{
        accessToken: string;
    } | null>;
    setup2FA(userId: string): Promise<{
        qrCodeDataUrl: string;
        secret: string;
    } | null>;
    confirm2FA(userId: string, code: string): Promise<boolean>;
    disable2FA(userId: string, password: string): Promise<boolean>;
    get2FAStatus(userId: string): Promise<{
        enabled: boolean;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
    forgotPassword(email: string): Promise<boolean>;
    resetPassword(email: string, code: string, newPassword: string): Promise<boolean>;
}
