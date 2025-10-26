# Audit Logging Feature Design Note

## Overview
This document outlines the design and implementation of the Automated Audit Logging feature for Strapi's Content API. The feature captures and logs all content changes (create, update, delete operations) performed via the Content API, providing a comprehensive audit trail for content management.

## Architecture

### Key Components
1. **Audit Service**: Core service responsible for creating audit log entries
2. **Database Collection**: `audit_logs` table to store audit entries
3. **Controllers Integration**: Modification of core-api controllers to invoke auditing
4. **REST API Endpoint**: `/audit-logs` for querying audit logs with filtering and pagination
5. **Access Control**: Role-based permissions for audit log access
6. **Configuration**: Global settings for enabling/disabling and content type exclusions

### Architecture Diagram
```
Content API Request
        ↓
Core-API Controller (create/update/delete)
        ↓
Strapi Service (entity creation/update/deletion)
        ↓
Audit Service logs the operation
        ↓
Database (audit_logs table)
```

## Database Schema

### audit_logs Table
- `id` (Primary Key, AutoIncrement)
- `content_type` (String) - UID of the content type (e.g., 'api::article.article')
- `record_id` (String) - Document ID of the affected record
- `action` (String) - Operation type: 'create', 'update', 'delete'
- `timestamp` (DateTime) - When the operation occurred
- `user_id` (Integer, Nullable) - ID of the user who performed the operation
- `data` (JSON) - Operation-specific data

### Indexes
- Primary: `id`
- Composite: `(content_type, timestamp, action)`
- Single: `user_id`
- Single: `record_id`

## Data Capture Logic

### Create Operation
- **Data Captured**: Full payload of the newly created record
- **Trigger**: After successful `strapi.service(uid).create()`

### Update Operation
- **Data Captured**: Changed fields (diff between old and new)
- **Trigger**: After successful `strapi.service(uid).update()` - requires fetching old data for comparison

### Delete Operation
- **Data Captured**: Full record data before deletion
- **Trigger**: Before `strapi.service(uid).delete()` - data fetched first, then audit logged, then delete

## Integration Points

### Content API Controllers
- `packages/core/core/src/core-api/controller/collection-type.ts`
- `packages/core/core/src/core-api/controller/single-type.ts`

Each CRUD operation method will be enhanced with audit logging calls post-operation.

### Database Migration
- New internal migration to create `audit_logs` table
- File: `packages/core/database/src/migrations/internal-migrations/audit-logs-migration.ts`

### Services
- New audit service: `packages/core/audit/src/services/audit.ts`
- Integrated into core via dependency injection

## API Design

### Audit Logs Endpoint
```
GET /api/audit-logs
```

#### Query Parameters
- `contentType` (string) - Filter by content type UID
- `userId` (integer) - Filter by user ID
- `action` (string) - Filter by action type ('create', 'update', 'delete')
- `startDate` (date) - Filter by date range start
- `endDate` (date) - Filter by date range end
- `pagination[page]` (integer) - Page number
- `pagination[pageSize]` (integer) - Records per page
- `sort` (string) - Sort field and direction (e.g., 'timestamp:desc')

#### Response
```json
{
  "data": [
    {
      "id": 1,
      "content_type": "api::article.article",
      "record_id": "abc123",
      "action": "create",
      "timestamp": "2023-01-01T12:00:00Z",
      "user_id": 5,
      "data": { "title": "New Article", "content": "..." }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

## Access Control

### Permission
- `read_audit_logs`: Required to access the `/audit-logs` endpoint
- By default, only super admin has this permission
- Can be assigned to other roles via admin panel

## Configuration

Located in Strapi configuration file:

```javascript
module.exports = {
  auditLog: {
    enabled: true,
    excludeContentTypes: ['api::admin.admin', 'api::user.user']
  }
}
```

### Configuration Options
- `auditLog.enabled` (boolean): Globally enable/disable audit logging
- `auditLog.excludeContentTypes` (array of strings): Content types to exclude from auditing

## Security Considerations

1. **Sensitive Data**: Audit logs may contain sensitive information - access should be tightly controlled
2. **Performance**: Logging operations add overhead - consider performance impact on high-traffic systems
3. **Storage**: Audit logs can grow large - implement retention policies
4. **Rate Limiting**: Potential for abuse via frequent API calls - implement appropriate limits

## Performance Optimizations

1. **Asynchronous Logging**: Offload audit logging to background queue for minimal API response impact
2. **Batch Inserts**: Group multiple audit entries for bulk insertion
3. **Selective Logging**: Skip logging for excluded content types early in the process
4. **Compression**: Compress JSON data field for storage efficiency

## Error Handling

- Audit logging failures should not block main Content API operations
- Log audit errors separately without affecting user operations
- Implement retry mechanisms for failed audit log insertions

## Migration Strategy

- Introduce feature as opt-in initially
- Provide migration tools for existing Strapi instances
- Backward compatibility with existing Strapi features

## Future Enhancements

1. **Audit Log UI**: Admin panel interface for viewing and filtering audit logs
2. **Export Functionality**: CSV/JSON export of audit logs
3. **Retention Policies**: Automatic cleanup of old audit logs
4. **Real-time Notifications**: Webhooks for audit events
5. **Advanced Filtering**: More granular query options
