import { AuthService } from './auth.service';
type LoginBody = {
    email?: unknown;
    password?: unknown;
};
type Verify2FABody = {
    tempToken?: unknown;
    code?: unknown;
};
type ChangePasswordBody = {
    currentPassword?: unknown;
    newPassword?: unknown;
};
type Confirm2FABody = {
    code?: unknown;
};
type Disable2FABody = {
    password?: unknown;
};
type ForgotPasswordBody = {
    email?: unknown;
};
type ResetPasswordBody = {
    email?: unknown;
    code?: unknown;
    newPassword?: unknown;
};
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(body: LoginBody): Promise<{
        accessToken: string;
    } | {
        requires2FA: true;
        tempToken: string;
    }>;
    verify2FA(body: Verify2FABody): Promise<{
        accessToken: string;
    }>;
    setup2FA(req: any): Promise<{
        qrCodeDataUrl: string;
        secret: string;
    }>;
    confirm2FA(req: any, body: Confirm2FABody): Promise<{
        ok: boolean;
        message: string;
    }>;
    disable2FA(req: any, body: Disable2FABody): Promise<{
        ok: boolean;
        message: string;
    }>;
    get2FAStatus(req: any): Promise<{
        enabled: boolean;
    }>;
    changePassword(req: any, body: ChangePasswordBody): Promise<{
        ok: boolean;
    }>;
    forgotPassword(body: ForgotPasswordBody): Promise<{
        ok: boolean;
        message: string;
    }>;
    resetPassword(body: ResetPasswordBody): Promise<{
        ok: boolean;
        message: string;
    }>;
}
export {};
