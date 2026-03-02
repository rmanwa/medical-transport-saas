import { SetupService } from './setup.service';
import { SetupDto } from './dto/setup.dto';
export declare class SetupController {
    private readonly setup;
    constructor(setup: SetupService);
    status(): Promise<{
        needsSetup: boolean;
    }>;
    performSetup(dto: SetupDto): Promise<{
        accessToken: string;
    }>;
}
