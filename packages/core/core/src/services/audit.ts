import type { UID } from '@strapi/types';

interface AuditLogData {
  contentType: UID.ContentType;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  userId?: number;
  data?: Record<string, any>;
}

interface AuditService {
  log(data: AuditLogData): Promise<void>;
  find(params?: {
    contentType?: string;
    userId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sort?: string;
  }): Promise<{
    results: any[];
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  }>;
}

interface ConstructorParameters {
  strapi: any; // Strapi instance
}

const defaultConfiguration = {
  enabled: true,
  excludeContentTypes: [] as string[],
};

class AuditServiceImpl implements AuditService {
  private strapi: any;
  private config: typeof defaultConfiguration;

  constructor({ strapi }: ConstructorParameters) {
    this.strapi = strapi;
    this.config = { ...defaultConfiguration, ...strapi.config.get('auditLog', {}) };
  }

  async log({ contentType, recordId, action, userId, data }: AuditLogData): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    if (this.config.excludeContentTypes.includes(contentType)) {
      return;
    }

    try {
      // Insert into audit_logs table using raw query since it's not a model
      await this.strapi.db.connection('audit_logs').insert({
        content_type: contentType,
        record_id: recordId,
        action,
        user_id: userId,
        data: data ? JSON.stringify(data) : null,
        timestamp: new Date(),
      });
    } catch (error) {
      // Log error but don't fail the main operation
      this.strapi.log.error('Failed to create audit log:', error);
    }
  }

  async find(params: Parameters<AuditService['find']>[0] = {}): Promise<ReturnType<AuditService['find']>> {
    const {
      contentType,
      userId,
      action,
      startDate,
      endDate,
      limit = 25,
      offset = 0,
      sort = 'timestamp:desc',
    } = params;

    const query = this.strapi.db.connection('audit_logs')
      .select('*')
      .limit(limit)
      .offset(offset);

    // Apply filters
    if (contentType) {
      query.where('content_type', contentType);
    }
    if (userId !== undefined) {
      query.where('user_id', userId);
    }
    if (action) {
      query.where('action', action);
    }
    if (startDate) {
      query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query.where('timestamp', '<=', endDate);
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split(':');
    query.orderBy(sortField || 'timestamp', sortOrder || 'desc');

    const results = await query;
    const totalQuery = this.strapi.db.connection('audit_logs')
      .count('* as total')
      .first();

    // Apply same filters for total count
    if (contentType) totalQuery.where('content_type', contentType);
    if (userId !== undefined) totalQuery.where('user_id', userId);
    if (action) totalQuery.where('action', action);
    if (startDate) totalQuery.where('timestamp', '>=', startDate);
    if (endDate) totalQuery.where('timestamp', '<=', endDate);

    const { total } = await totalQuery;
    const totalCount = parseInt(total as string, 10);

    // Parse JSON data
    const parsedResults = results.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : null,
    }));

    return {
      results: parsedResults,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        pageCount: Math.ceil(totalCount / limit),
        total: totalCount,
      },
    };
  }
}

/**
 * Expose a factory function
 */
export default function createAuditService(opts: ConstructorParameters): AuditServiceImpl {
  return new AuditServiceImpl(opts);
}

export type { AuditService, AuditLogData };
