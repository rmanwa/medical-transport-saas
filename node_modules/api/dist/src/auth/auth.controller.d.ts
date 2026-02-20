import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
    }>;
}
