# Strapi Automated Audit Logging Feature

## Overview

This feature adds comprehensive automated audit logging to Strapi's Content API, tracking all content changes (create, update, delete operations) performed via the Content API. It provides a complete audit trail for content management activities.

## Features

- **Automatic Logging**: All Content API operations (create, update, delete) are automatically logged
- **Rich Metadata**: Each log entry includes content type, record ID, action type, user, timestamp, and operation data
- **RESTful Endpoint**: Query audit logs with filtering, pagination, and sorting capabilities
- **Access Control**: Role-based permissions for accessing audit logs
- **Configuration**: Configurable logging behavior (enable/disable, content type exclusions)

## Installation

This feature is integrated into Strapi core. No additional installation required.

## Configuration

Add the following to your Strapi configuration file (`config/database.js` or environment-specific config):

```javascript
module.exports = {
  // ... other config
  auditLog: {
    enabled: true,
    excludeContentTypes: ['api::admin.admin', 'api::user.user']
  }
}
```

### Configuration Options

- `auditLog.enabled` (boolean): Enable or disable audit logging globally (default: true)
- `auditLog.excludeContentTypes` (array): Array of content type UIDs to exclude from logging

## API Usage

### Query Audit Logs

```
GET /api/audit-logs
```

#### Query Parameters

- `contentType` (string): Filter by content type UID
- `userId` (integer): Filter by user ID
- `action` (string): Filter by action ('create', 'update', 'delete')
- `startDate` (ISO date): Filter by start date
- `endDate` (ISO date): Filter by end date
- `pagination[page]` (integer): Page number (default: 1)
- `pagination[pageSize]` (integer): Records per page (default: 25, max: 100)
- `sort` (string): Sort field and direction (e.g., 'timestamp:desc')

#### Authentication

Requires authentication and the `read_audit_logs` permission.

#### Response Example

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
      "data": {
        "title": "New Article",
        "content": "Article content...",
        "createdAt": "2023-01-01T12:00:00Z"
      }
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

## Permissions

The audit logs endpoint requires the `read_audit_logs` permission. By default, only super administrators have access to this permission. You can assign it to other roles through the Strapi admin panel under Settings > Users & Permissions > Roles.

## Data Structure

Each audit log entry contains:

- `id`: Unique identifier (auto-generated)
- `content_type`: UID of the content type (e.g., 'api::article.article')
- `record_id`: Document ID of the affected record
- `action`: Operation type ('create', 'update', 'delete')
- `timestamp`: ISO timestamp of the operation
- `user_id`: ID of the user who performed the operation (null for unauthenticated requests)
- `data`: JSON object containing operation-specific data

### Data Field Content

- **Create operations**: Full payload of the newly created record
- **Update operations**: Updated data of the modified record
- **Delete operations**: Complete record data before deletion

## Usage Examples

### Get all audit logs for a specific content type
```
GET /api/audit-logs?contentType=api::article.article
```

### Get audit logs for a specific user
```
GET /api/audit-logs?userId=5
```

### Get create operations from the last week
```
GET /api/audit-logs?action=create&startDate=2023-01-01
```

### Paginated results with sorting
```
GET /api/audit-logs?pagination[page]=2&pagination[pageSize]=50&sort=timestamp:desc
```

## Database

Audit logs are stored in the `audit_logs` table, which includes appropriate indexes for efficient querying:

- Primary key on `id`
- Composite index on `(content_type, timestamp, action)`
- Single indexes on `user_id` and `record_id`

## Security Considerations

- Audit logs may contain sensitive data depending on your content types
- Access to audit logs should be tightly controlled
- Consider implementing retention policies for audit logs
- Regular backup and archival strategies are recommended

## Performance Notes

- Audit logging adds minimal overhead to Content API operations
- Logging failures won't block API operations
- Consider the storage implications of long-term audit log retention
- Database queries support efficient filtering and pagination

## Architecture

### Components

1. **Audit Service**: Handles log creation and querying
2. **Database Migration**: Creates the `audit_logs` table
3. **Controller Hooks**: Integrated into Content API controllers for automatic logging
4. **Audit Controller**: Handles the `/api/audit-logs` endpoint
5. **Permission System**: Manages access to audit log viewing

### Integration Points

- Content API controllers automatically log operations
- Permissions system controls endpoint access
- Configuration system allows customization
- Database layer stores log entries persistently

## Troubleshooting

### Logs Not Appearing

1. Check that `auditLog.enabled` is set to `true` in configuration
2. Verify the content type is not in `excludeContentTypes`
3. Ensure database migrations have run successfully
4. Check Strapi logs for audit service errors

### Permission Denied

1. Verify user authentication
2. Check if user has `read_audit_logs` permission
3. Ensure role is properly assigned in admin panel

### Performance Issues

1. Consider excluding high-traffic content types
2. Implement audit log retention policies
3. Monitor database performance and add indexes as needed

## Migration and Deployment

When deploying this feature:

1. The database migration will automatically create the `audit_logs` table
2. Configure the feature in your Strapi config files
3. Assign appropriate permissions in the admin panel
4. Test the functionality with your content types

## Future Enhancements

Potential future improvements include:
- Admin panel UI for viewing audit logs
- Configurable retention policies
- Export functionality (CSV/JSON)
- Webhook notifications for audit events
- Advanced search and filtering options
