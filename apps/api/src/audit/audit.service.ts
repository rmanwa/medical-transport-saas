import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

export interface AuditLogInput {
  action: AuditAction;
  entityId: string;
  entityType: string;
  details?: Record<string, any>;
  userId: string;
  companyId: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        entityId: input.entityId,
        entityType: input.entityType,
        details: input.details
          ? (input.details as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        userId: input.userId,
        companyId: input.companyId,
      },
    });
  }

  async findAll(
    companyId: string,
    filters: {
      action?: AuditAction;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 30;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = { companyId };

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}