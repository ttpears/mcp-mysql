# MySQL MCP Server 🚀

An intelligent MySQL MCP Server with expert data analytics capabilities. Goes beyond basic querying to provide comprehensive database analysis, relationship mapping, and user behavior insights.

[![npm version](https://badge.fury.io/js/mysql-mcp-server.svg)](https://badge.fury.io/js/mysql-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Read-only queries**: Execute SELECT, SHOW, DESCRIBE, and EXPLAIN statements
- **Advanced schema analysis**: Comprehensive table inspection with relationships and constraints
- **User behavior analysis**: Intelligent detection of user, time, and behavior columns
- **Relationship mapping**: Automatic discovery of table relationships and join suggestions
- **Data profiling**: Sample data analysis with value distributions and statistics
- **Query recommendations**: AI-friendly suggestions for complex user behavior queries
- **Security**: Query validation, length limits, and connection timeouts
- **Performance**: Connection reuse and query execution metadata
- **MySQL 5.5+ compatible**: Works with MySQL 5.5 and later versions

## Quick Start

### Option 1: Direct Install from GitHub
```bash
# Clone and install
git clone https://github.com/ttpears/mcp-mysql.git
cd mcp-mysql
npm install && npm run build

# Add to Claude Code with your MySQL credentials
claude mcp add mysql-server npm start \
  -e MYSQL_HOST=localhost \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password \
  -e MYSQL_DATABASE=your_database
```

### Option 2: Install from Smithery.ai
```bash
# Install via Smithery MCP registry
smithery install mysql-mcp-server
```

### Option 3: Manual Installation
```bash
npm install mysql-mcp-server
```

## Configuration

Set the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_HOST` | `localhost` | MySQL server hostname |
| `MYSQL_PORT` | `3306` | MySQL server port |
| `MYSQL_USER` | `root` | MySQL username |
| `MYSQL_PASSWORD` | `` | MySQL password |
| `MYSQL_DATABASE` | `test` | MySQL database name |
| `MYSQL_SSL` | `false` | Enable SSL connection |

Example:
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=readonly_user
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=your_database
export MYSQL_SSL=true
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
**🚀 START HERE** - Intelligently discover and analyze your entire database with expert data analytics insights.

**Parameters:**
- `focus_area` (string, optional): Analytics focus ('user_behavior', 'sales_analytics', 'engagement', 'general')
- `include_recommendations` (boolean, default: true): Include expert query recommendations

**Examples:**
```json
// Comprehensive database discovery for user behavior analysis
{
  "focus_area": "user_behavior",
  "include_recommendations": true
}

// General database analysis
{
  "focus_area": "general"
}
```

**What you get:**
- Complete database structure analysis with all executed SQL queries shown
- Intelligent table classification (fact tables, dimension tables, user tables, event tables)
- Relationship mapping and foreign key analysis  
- Expert analytics insights and performance recommendations
- Ready-to-use SQL queries for common analytics patterns
- Data quality assessments and optimization suggestions

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