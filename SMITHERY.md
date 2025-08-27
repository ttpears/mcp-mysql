# Smithery.ai Configuration Guide

## Test Profile Setup

To enable tool scanning on Smithery.ai, you need to configure test MySQL credentials. The server requires a working MySQL connection to demonstrate its capabilities.

### Option 1: Use Demo MySQL Instance (Recommended for Smithery)

Set up these environment variables in your Smithery test profile:

```yaml
MYSQL_HOST: "demo-mysql.smithery.ai"
MYSQL_PORT: "3306"
MYSQL_USER: "demo_user"
MYSQL_PASSWORD: "demo_password" 
MYSQL_DATABASE: "sample_analytics"
MYSQL_SSL: "false"
```

### Option 2: Public MySQL Test Instance

You can use any publicly accessible MySQL instance with sample data:

```yaml
MYSQL_HOST: "your-public-mysql-host.com"
MYSQL_PORT: "3306"
MYSQL_USER: "readonly_user"
MYSQL_PASSWORD: "secure_password"
MYSQL_DATABASE: "demo_analytics"
MYSQL_SSL: "true"
```

## Required Test Database Schema

For proper tool demonstration, your test database should include:

### Required Tables:
1. **users** - User dimension table
2. **events** - User event/behavior tracking table

### Sample Schema:
```sql
-- Users table (dimension)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Events table (fact/behavior)
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  event_type VARCHAR(50),
  event_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Sample Data:
```sql
INSERT INTO users (email, name) VALUES 
('alice@example.com', 'Alice Johnson'),
('bob@example.com', 'Bob Smith'),
('charlie@example.com', 'Charlie Brown');

INSERT INTO events (user_id, event_type, event_data) VALUES
(1, 'login', '{"source": "web"}'),
(1, 'page_view', '{"page": "/dashboard"}'),
(2, 'login', '{"source": "mobile"}'),
(3, 'signup', '{"campaign": "social"}');
```

## Tool Scanning Tests

The test profile will verify these tools work correctly:

1. **mysql_discover_analytics** - Server-wide database discovery
2. **mysql_query** - Basic query execution (SHOW TABLES)
3. **mysql_schema** - Schema analysis with relationships

## Database User Permissions

Create a read-only user for testing:

```sql
CREATE USER 'demo_user'@'%' IDENTIFIED BY 'demo_password';
GRANT SELECT, SHOW VIEW ON sample_analytics.* TO 'demo_user'@'%';
FLUSH PRIVILEGES;
```

## Smithery Environment Setup

In your Smithery.ai dashboard:

1. Go to your server's settings
2. Create a "test" profile
3. Add the MySQL environment variables above
4. Save and trigger a re-scan

The server will then be able to connect and demonstrate all its intelligent analytics capabilities!

## What Gets Demonstrated

With proper test credentials, Smithery users will see:

- 🌐 **Multi-database discovery** across the test server
- 🧠 **Intelligent table classification** (users as dimension, events as fact table)
- 📊 **Analytics insights** about the schema architecture
- 👥 **User behavior analysis** capabilities
- 📈 **Ready-to-use query templates** for user analytics
- 🔄 **Cross-database relationship mapping**

This showcases the full power of the MySQL MCP server for data analytics!