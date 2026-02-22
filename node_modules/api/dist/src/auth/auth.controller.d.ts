import { AuthService } from './auth.service';
type LoginBody = {
    email?: unknown;
    password?: unknown;
};
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(body: LoginBody): Promise<{
        accessToken: string;
    }>;
}
export {};
