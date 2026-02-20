import type { RequestWithUser } from '../common/types/request-with-user';
export declare class MeController {
    getMe(req: RequestWithUser): {
        user: Express.User & import("../common/types/request-with-user").AuthUser;
    };
}
