import type { Knex } from 'knex';
import type { Migration } from '../common';

export const createAuditLogsTable: Migration = {
  name: 'audit-logs-create-table',
  async up(knex) {
    const hasTable = await knex.schema.hasTable('audit_logs');

    if (!hasTable) {
      await knex.schema.createTable('audit_logs', (table) => {
        table.increments('id').primary();
        table.string('content_type').notNullable();
        table.string('record_id').notNullable();
        table.enum('action', ['create', 'update', 'delete']).notNullable();
        table.dateTime('timestamp').notNullable().defaultTo(knex.fn.now());
        table.integer('user_id').nullable();
        table.json('data').nullable();

        // Indexes for efficient querying
        table.index(['content_type', 'timestamp', 'action']);
        table.index('user_id');
        table.index('record_id');
      });
    }
  },
  async down(knex) {
    await knex.schema.dropTableIfExists('audit_logs');
  },
};
