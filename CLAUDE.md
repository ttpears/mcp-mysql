# MySQL MCP Server

An intelligent MySQL MCP (Model Context Protocol) server with expert analytics capabilities and comprehensive caching system.

## Features

- **Read-only MySQL Operations**: Execute SELECT, SHOW, DESCRIBE, and EXPLAIN queries safely
- **Intelligent Database Discovery**: Automatically analyze database structures with expert insights
- **Table Relationship Analysis**: Detect and analyze foreign key relationships and data flow patterns
- **User Behavior Analytics**: Specialized analysis for user engagement and behavioral data
- **Comprehensive Caching**: High-performance caching system with TTL support for all operations
- **Cross-Database Analysis**: Analyze relationships and patterns across multiple databases
- **Expert Query Recommendations**: AI-powered query suggestions based on schema analysis

## Caching System

The server includes a robust caching system that stores all query results, schema analysis, and discovery reports:

- **Query Results**: Cached in `~/.mcp-mysql-cache/queries/[date]/` with 1-hour TTL
- **Schema Analysis**: Cached in `~/.mcp-mysql-cache/schema-snapshots/` with 1-2 hour TTL  
- **Discovery Reports**: Cached in `~/.mcp-mysql-cache/reports/discovery-reports/` with 4-hour TTL
- **Relationship Analysis**: Cached in `~/.mcp-mysql-cache/reports/relationship-analysis/`

### Cache Configuration

Control caching behavior with environment variables:

```bash
MCP_MYSQL_CACHE_ENABLED=true          # Enable/disable caching (default: true)
MCP_MYSQL_CACHE_DIR=/custom/path       # Custom cache directory (default: ~/.mcp-mysql-cache)
MCP_MYSQL_CACHE_MAX_SIZE=52428800      # Max file size in bytes (default: 50MB)
MCP_MYSQL_CACHE_RETENTION_DAYS=30      # Days to retain cached files (default: 30)
```

## Environment Variables

Required:
- `MYSQL_HOST`: MySQL server hostname (default: localhost)
- `MYSQL_PORT`: MySQL server port (default: 3306)
- `MYSQL_USER`: MySQL username (default: root)
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_DATABASE`: Default database (optional - server-wide access if omitted)

Optional:
- `MYSQL_SSL`: Enable SSL connection (default: false)

## Available Tools

### `mysql_query`
Execute read-only SQL queries with comprehensive result analysis and automatic caching.

### `mysql_schema`
Get detailed schema information including tables, relationships, constraints, and optional sample data with intelligent caching.

### `mysql_analyze_tables`
Analyze table relationships and suggest optimal query patterns for specific use cases (relationships, user behavior, data flow).

### `mysql_discover_analytics`
Comprehensive database discovery with expert analytics insights, intelligent table classification, and cross-database analysis. Supports pagination for large database servers.

## Quick Start

1. Set environment variables:
```bash
export MYSQL_HOST=your-host
export MYSQL_USER=your-username
export MYSQL_PASSWORD=your-password
export MCP_MYSQL_CACHE_ENABLED=true
```

2. Build and run:
```bash
npm install
npm run build
npm start
```

## Usage Examples

### Basic Query Execution
```json
{
  "tool": "mysql_query",
  "parameters": {
    "query": "SELECT COUNT(*) as total_users FROM users WHERE created_at >= '2024-01-01'",
    "database": "myapp"
  }
}
```

### Database Discovery
```json
{
  "tool": "mysql_discover_analytics",
  "parameters": {
    "focus_area": "user_behavior",
    "detail_level": "detailed",
    "include_recommendations": true,
    "cross_database_analysis": true
  }
}
```

### Table Relationship Analysis
```json
{
  "tool": "mysql_analyze_tables",
  "parameters": {
    "tables": ["users", "orders", "order_items"],
    "analysis_type": "user_behavior"
  }
}
```

All operations automatically benefit from the caching system, improving performance for repeated queries and analysis.

## Development

### Testing Cache Functionality

Cache functionality has been thoroughly tested including:
- Cache creation and reading
- TTL (Time-To-Live) expiration handling
- Cache miss scenarios
- Disabled cache mode
- File system error handling

### Build Commands

```bash
npm run build    # Build TypeScript to JavaScript
npm run dev      # Development mode with auto-reload
npm run lint     # Run ESLint
npm run test     # Run tests (if available)
```