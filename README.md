# MySQL MCP Server 🚀

An intelligent MySQL MCP Server with expert data analytics capabilities and comprehensive caching. Goes beyond basic querying to provide in-depth database analysis, relationship mapping, and user behavior insights with high-performance caching system.

[![npm version](https://badge.fury.io/js/mysql-mcp-server.svg)](https://badge.fury.io/js/mysql-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Smithery Compatible](https://img.shields.io/badge/Smithery-Compatible-blue.svg)](https://smithery.ai)

## ✨ Features

- **🌐 Multi-database server support**: Connect to entire MySQL servers or specific databases
- **🧠 Intelligent discovery**: Automatic database and table classification with expert insights
- **📊 Advanced analytics**: Comprehensive schema analysis with relationships and constraints
- **👥 User behavior specialization**: Smart detection of user, time, and behavior patterns
- **🔄 Cross-database analysis**: Relationship mapping and insights across multiple databases
- **📈 Ready-to-use queries**: AI-generated analytics templates for common patterns
- **⚡ Performance optimization**: Query analysis with execution insights and recommendations
- **🔒 Enterprise security**: Read-only access with query validation and connection timeouts
- **🏗️ Architecture detection**: Automatic identification of star schemas and data warehouse patterns
- **⚡ High-performance caching**: Intelligent caching system with TTL support
- **🚀 Smithery deployment**: Easy deployment with configuration UI on Smithery.ai
- **🔧 Dual-mode support**: Works as both standalone and Smithery-deployed server
- **MySQL 5.5+ compatible**: Works with MySQL 5.5 and later versions

## Quick Start

### Option 1: Direct Install from GitHub
```bash
# Clone and install
git clone https://github.com/ttpears/mcp-mysql.git
cd mcp-mysql
npm install && npm run build

# Add to Claude Code with your MySQL credentials
# For server-wide access (recommended):
claude mcp add mysql-server npm start \
  -e MYSQL_HOST=localhost \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password

# For single database access:
claude mcp add mysql-server npm start \
  -e MYSQL_HOST=localhost \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password \
  -e MYSQL_DATABASE=your_database
```

### Option 2: Deploy on Smithery.ai (Recommended)
Visit [Smithery.ai MySQL MCP Server](https://smithery.ai/server/@ttpears/mysql-mcp-server) and click "Deploy" for easy setup with configuration UI.

Features when deployed on Smithery:
- 🎛️ **Configuration UI**: Easy setup with form-based configuration
- 🔄 **Auto-updates**: Automatic updates when new versions are released
- ⚡ **High performance**: Optimized deployment with caching enabled
- 🔒 **Secure**: Environment-based secret management

### Option 3: Manual Installation
```bash
npm install mysql-mcp-server
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_HOST` | `localhost` | MySQL server hostname |
| `MYSQL_PORT` | `3306` | MySQL server port |
| `MYSQL_USER` | `root` | MySQL username |
| `MYSQL_PASSWORD` | `` | MySQL password (required) |
| `MYSQL_DATABASE` | _(none)_ | MySQL database name (optional - if not set, provides server-wide access) |
| `MYSQL_SSL` | `false` | Enable SSL connection |

### Caching Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_MYSQL_CACHE_ENABLED` | `true` | Enable/disable intelligent caching system |
| `MCP_MYSQL_CACHE_DIR` | `~/.mcp-mysql-cache` | Custom cache directory path |
| `MCP_MYSQL_CACHE_MAX_SIZE` | `52428800` | Maximum cache file size in bytes (50MB) |
| `MCP_MYSQL_CACHE_RETENTION_DAYS` | `30` | Days to retain cached files |

### Configuration Examples

**Server-wide access (recommended for analytics):**
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=analytics_user
export MYSQL_PASSWORD=your_password
export MYSQL_SSL=true
export MCP_MYSQL_CACHE_ENABLED=true
```

**Single database access:**
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=readonly_user
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=your_database
export MYSQL_SSL=true
```

**Custom caching configuration:**
```bash
export MCP_MYSQL_CACHE_ENABLED=true
export MCP_MYSQL_CACHE_DIR=/custom/cache/path
export MCP_MYSQL_CACHE_MAX_SIZE=104857600  # 100MB
export MCP_MYSQL_CACHE_RETENTION_DAYS=7    # 1 week
```

## Usage

### Running the Server

```bash
npm start
```

### Available Tools

#### `mysql_query`
Execute read-only SQL queries against the database.

**Parameters:**
- `query` (string, required): SQL query to execute
- `params` (array, optional): Parameters for prepared statements

**Example:**
```json
{
  "query": "SELECT * FROM users WHERE status = ?",
  "params": ["active"]
}
```

#### `mysql_schema`
Get comprehensive schema information including relationships, constraints, and data patterns.

**Parameters:**
- `table` (string, optional): Specific table name to analyze
- `include_relationships` (boolean, default: true): Include foreign key relationships
- `include_sample_data` (boolean, default: false): Include sample data and statistics
- `sample_size` (number, default: 100, max: 1000): Number of sample rows to analyze

**Examples:**
```json
// Get database overview with relationships
{}

// Get detailed table analysis with sample data
{
  "table": "users",
  "include_sample_data": true,
  "sample_size": 50
}

// Get basic table schema without relationships
{
  "table": "orders",
  "include_relationships": false
}
```

#### `mysql_analyze_tables`
Analyze table relationships and suggest optimal query patterns for user behavior analysis.

**Parameters:**
- `tables` (array, required): List of table names to analyze
- `analysis_type` (string, optional): Type of analysis ('relationships', 'user_behavior', 'data_flow')

**Examples:**
```json
// Analyze table relationships
{
  "tables": ["users", "orders", "products"],
  "analysis_type": "relationships"
}

// Analyze for user behavior patterns
{
  "tables": ["users", "events", "sessions"],
  "analysis_type": "user_behavior"
}

// Trace data flow between tables
{
  "tables": ["users", "orders", "order_items"],
  "analysis_type": "data_flow"
}
```

#### `mysql_discover_analytics`
**🚀 START HERE** - Intelligently discover and analyze your entire MySQL server with expert data analytics insights and intelligent caching.

**Parameters:**
- `databases` (array, optional): List of databases to analyze (if not specified, discovers all accessible databases)  
- `focus_area` (string, optional): Analytics focus ('user_behavior', 'sales_analytics', 'engagement', 'general')
- `include_recommendations` (boolean, default: true): Include expert query recommendations
- `cross_database_analysis` (boolean, default: true): Analyze relationships across databases
- `detail_level` (string, optional): Level of analysis ('summary', 'detailed', 'full')
- `max_tables_per_db` (number, default: 20): Maximum tables to analyze per database
- `page` (number, default: 1): Page number for pagination
- `page_size` (number, default: 5): Number of databases per page

**Examples:**
```json
// Discover entire MySQL server for user behavior analysis
{
  "focus_area": "user_behavior",
  "cross_database_analysis": true
}

// Analyze specific databases only
{
  "databases": ["ecommerce", "analytics", "logs"],
  "focus_area": "sales_analytics"
}

// Quick server overview
{
  "focus_area": "general"
}
```

**What you get:**
- 🌐 Complete multi-database server analysis with all executed SQL queries shown
- 🧠 Intelligent table classification across all databases (fact tables, dimension tables, user tables, event tables)
- 🔄 Cross-database relationship mapping and pattern detection
- 📊 Expert analytics insights and performance recommendations per database
- 📈 Ready-to-use SQL queries for cross-database analytics patterns
- 🔍 Data quality assessments and optimization suggestions
- 🏗️ Architecture analysis (star schema detection, data warehouse patterns)
- ⚡ **High-performance caching**: All results cached with TTL for faster subsequent queries
- 📄 **Pagination support**: Handle large servers with configurable page sizes

## 🚀 Intelligent Caching System

The server includes a comprehensive caching system that dramatically improves performance for repeated operations:

### Cache Types & TTL
- **Query Results**: 1-hour TTL - `~/.mcp-mysql-cache/queries/[date]/`
- **Schema Analysis**: 1-2 hour TTL - `~/.mcp-mysql-cache/schema-snapshots/`
- **Discovery Reports**: 4-hour TTL - `~/.mcp-mysql-cache/reports/discovery-reports/`
- **Relationship Analysis**: Cached - `~/.mcp-mysql-cache/reports/relationship-analysis/`

### Cache Features
- **Automatic TTL management**: Expired cache automatically detected and refreshed
- **Intelligent key generation**: Complex queries cached with hash-based keys
- **Size limits**: Configurable maximum file size (default: 50MB)
- **Storage organization**: Organized by date and operation type
- **Cache info**: All responses include cache hit/miss information
- **Cross-session**: Cache persists across server restarts

### Cache Benefits
- **Faster repeated queries**: Instant responses for cached operations
- **Reduced database load**: Less strain on your MySQL server
- **Improved UX**: Near-instantaneous results for complex analytics
- **Development efficiency**: Quick iterations during data exploration

## Security Features

- **Query Validation**: Only read-only operations allowed (SELECT, SHOW, DESCRIBE, EXPLAIN)
- **Length Limits**: Queries limited to 10,000 characters
- **Prepared Statements**: Parameterized queries to prevent SQL injection
- **Connection Timeouts**: Configurable timeouts to prevent hanging connections
- **Error Handling**: Comprehensive error catching and logging

## Database User Setup

For security, create a dedicated read-only MySQL user:

```sql
-- Create read-only user
CREATE USER 'readonly_user'@'%' IDENTIFIED BY 'secure_password';

-- Grant SELECT privileges
GRANT SELECT ON your_database.* TO 'readonly_user'@'%';

-- Grant SHOW privileges for schema inspection
GRANT SHOW VIEW ON your_database.* TO 'readonly_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Compatibility

- MySQL 5.5+
- MariaDB 10.0+
- Node.js 18+

## Error Handling

The server provides detailed error messages for:
- Connection failures
- Invalid queries
- Query execution errors
- Parameter validation errors

All errors are logged to stderr while maintaining MCP protocol compliance.

## Deployment

### GitHub
```bash
git add .
git commit -m "Initial release of intelligent MySQL MCP Server"
git push origin main
```

### Smithery.ai Registry
1. Ensure `mcp.json` is properly configured
2. Push to GitHub repository
3. Submit to [Smithery.ai MCP Registry](https://smithery.ai)
4. Include the `mcp.json` file for automatic discovery

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/ttpears/mcp-mysql/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ttpears/mcp-mysql/discussions)
- 📚 **Documentation**: [Full Documentation](https://github.com/ttpears/mcp-mysql#readme)