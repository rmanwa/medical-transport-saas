import { AuthService } from './auth.service';
type LoginBody = {
    email?: unknown;
    password?: unknown;
};
type ChangePasswordBody = {
    currentPassword?: unknown;
    newPassword?: unknown;
};
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(body: LoginBody): Promise<{
        accessToken: string;
    }>;
    changePassword(req: any, body: ChangePasswordBody): Promise<{
        ok: boolean;
    }>;
}
export {};
