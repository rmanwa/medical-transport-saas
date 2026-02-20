"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertBranchAccess = assertBranchAccess;
const common_1 = require("@nestjs/common");
async function assertBranchAccess(prisma, user, branchId) {
    const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId: user.companyId },
        select: { id: true },
    });
    if (!branch) {
        throw new common_1.NotFoundException('Branch not found.');
    }
    if (user.role === 'SUPER_ADMIN')
        return;
    if (user.canAccessAllBranches)
        return;
    if (!user.branchIds.includes(branchId)) {
        throw new common_1.ForbiddenException('Not authorized for this branch.');
    }
}
//# sourceMappingURL=branch-access.js.map