"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const fs_1 = require("fs");
const candidates = [
    (0, path_1.join)(process.cwd(), 'apps', 'api', '.env'),
    (0, path_1.join)(process.cwd(), '.env'),
];
for (const p of candidates) {
    if ((0, fs_1.existsSync)(p)) {
        (0, dotenv_1.config)({ path: p });
        break;
    }
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: false,
        transform: true,
    }));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map