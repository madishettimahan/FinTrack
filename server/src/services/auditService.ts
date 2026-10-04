import { Request } from 'express';
import { prisma } from '../config/db.js';

interface LogAuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  req?: Request;
}

export const logAudit = async ({
  userId,
  action,
  entity,
  entityId,
  req,
}: LogAuditParams): Promise<void> => {
  try {
    const ipAddress = req ? (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress) : undefined;
    const userAgent = req ? req.headers['user-agent'] : undefined;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 100) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
      },
    });
  } catch (error) {
    // We do not want audit logging failures to crash user requests, but log warning
    console.warn('[AuditLog Warning]: Failed to record audit log:', error);
  }
};
