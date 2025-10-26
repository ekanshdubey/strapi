import type { Core, Utils } from '@strapi/types';

/**
 * Audit logs controller for the Content API
 */
const createAuditController = (): Utils.PartialWithThis<Core.CoreAPI.Controller.Audit> => ({
  async find(ctx) {
    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const { results, pagination } = await strapi.audit.find({
      contentType: ctx.query.contentType,
      userId: ctx.query.userId ? parseInt(ctx.query.userId, 10) : undefined,
      action: ctx.query.action,
      startDate: ctx.query.startDate ? new Date(ctx.query.startDate) : undefined,
      endDate: ctx.query.endDate ? new Date(ctx.query.endDate) : undefined,
      limit: ctx.query._limit ? parseInt(ctx.query._limit, 10) : 25,
      offset: ctx.query._start ? parseInt(ctx.query._start, 10) : 0,
      sort: ctx.query._sort,
    });

    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },
});

export { createAuditController };
