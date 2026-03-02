import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SetupDto } from './dto/setup.dto';
export declare class SetupService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    needsSetup(): Promise<boolean>;
    performSetup(dto: SetupDto): Promise<{
        accessToken: string;
    }>;
}
