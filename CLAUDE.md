# MySQL MCP Server

An intelligent MySQL MCP (Model Context Protocol) server with **enterprise data federation** capabilities, enabling LLMs to query and analyze data across multiple disparate MySQL data sources with expert analytics and comprehensive caching.

## Features

### **🏢 Enterprise Data Federation**
- **Multi-Source MySQL Access**: Connect to and query across completely different MySQL data sources (CRM, ERP, Analytics, E-commerce, etc.)
- **Intelligent Data Source Discovery**: Automatically catalog and classify databases across all connected sources
- **Cross-Source Query Engine**: Execute federated queries combining data from multiple business systems
- **Data Source Relationship Detection**: Find connections between disparate systems (shared customer IDs, product codes, etc.)

### **🔍 Advanced Analytics**
- **Read-only MySQL Operations**: Execute SELECT, SHOW, DESCRIBE, and EXPLAIN queries safely across all sources
- **Cross-Source Business Intelligence**: Combine CRM customers with e-commerce orders, inventory with sales, etc.
- **User Journey Analytics**: Track users across multiple business systems and touchpoints
- **Data Consistency Validation**: Compare data integrity across different business systems
- **Performance Benchmarking**: Compare query performance across different data sources

### **💾 Enterprise Caching & Performance**
- **Source-Specific Caching**: High-performance caching system with TTL support isolated per data source
- **Connection Pooling**: Efficient connection management across multiple business systems
- **Query Optimization**: Expert query suggestions based on federated schema analysis

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

### Default Host Configuration
Required:
- `MYSQL_HOST`: MySQL server hostname (default: localhost)
- `MYSQL_PORT`: MySQL server port (default: 3306)
- `MYSQL_USER`: MySQL username (default: root)
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_DATABASE`: Default database (optional - server-wide access if omitted)

Optional:
- `MYSQL_SSL`: Enable SSL connection (default: false)

### Multi-Source Data Federation Configuration
Connect to multiple disparate business systems using the pattern `MYSQL_HOST_<SOURCE>_*`:

```bash
# CRM System (Salesforce MySQL backend)
export MYSQL_HOST_CRM_HOST=crm-db.company.com
export MYSQL_HOST_CRM_PORT=3306
export MYSQL_HOST_CRM_USER=crm_readonly
export MYSQL_HOST_CRM_PASSWORD=crm_secret
export MYSQL_HOST_CRM_DATABASE=salesforce_sync
export MYSQL_HOST_CRM_SSL=true

# E-commerce Platform (Shopify/WooCommerce)
export MYSQL_HOST_ECOMMERCE_HOST=shop-db.company.com
export MYSQL_HOST_ECOMMERCE_USER=ecommerce_analytics
export MYSQL_HOST_ECOMMERCE_PASSWORD=shop_secret
export MYSQL_HOST_ECOMMERCE_DATABASE=store_analytics

# ERP System (SAP/Oracle MySQL interface)
export MYSQL_HOST_ERP_HOST=erp-mysql.company.com
export MYSQL_HOST_ERP_USER=erp_reporting
export MYSQL_HOST_ERP_PASSWORD=erp_secret
export MYSQL_HOST_ERP_DATABASE=enterprise_data

# Marketing Analytics (HubSpot/Marketo sync)
export MYSQL_HOST_MARKETING_HOST=marketing-db.company.com
export MYSQL_HOST_MARKETING_USER=marketing_readonly
export MYSQL_HOST_MARKETING_PASSWORD=marketing_secret
export MYSQL_HOST_MARKETING_DATABASE=campaign_data

# Support System (Zendesk/Freshdesk)
export MYSQL_HOST_SUPPORT_HOST=support-db.company.com
export MYSQL_HOST_SUPPORT_USER=support_analytics
export MYSQL_HOST_SUPPORT_PASSWORD=support_secret
export MYSQL_HOST_SUPPORT_DATABASE=ticket_analytics
```

**Note**: Each additional data source requires at least `MYSQL_HOST_<SOURCE>_HOST` and `MYSQL_HOST_<SOURCE>_PASSWORD` to be configured. The system automatically:
- **Discovers** available databases in each source
- **Classifies** business system type (CRM, E-commerce, ERP, etc.)
- **Identifies** shared data identifiers for federation
- **Recommends** optimal cross-source analysis strategies

## Available Tools

### `mysql_query`
Execute read-only SQL queries with comprehensive result analysis and automatic caching.
- **New**: `host` parameter to specify which MySQL host to query

### `mysql_schema`
Get detailed schema information including tables, relationships, constraints, and optional sample data with intelligent caching.
- **New**: `host` parameter to specify which MySQL host to analyze

### `mysql_analyze_tables`
Analyze table relationships and suggest optimal query patterns for specific use cases (relationships, user behavior, data flow).
- **New**: `host` parameter to specify which MySQL host to analyze

### `mysql_inventory`
Get comprehensive inventory of all configured MySQL hosts and their accessible databases.
- **New**: Automatically scans and caches database lists for all hosts
- **New**: Shows connection status and performance metrics for each host
- **New**: Provides cross-host analysis recommendations

### `mysql_cross_host_query`
Execute queries across multiple MySQL hosts and combine results for comprehensive analysis.
- **New**: Execute multiple queries across different hosts simultaneously
- **New**: Multiple combination strategies: separate, union, comparison, correlation
- **New**: Built-in analysis for performance, data consistency, and business metrics

### `mysql_discover_analytics`
Comprehensive database discovery with expert analytics insights, intelligent table classification, and cross-database analysis. Supports pagination for large database servers.
- **New**: `host` parameter to specify which MySQL host to discover

## Quick Start

1. Set environment variables for default data source:
```bash
export MYSQL_HOST=your-primary-db-host
export MYSQL_USER=your-username
export MYSQL_PASSWORD=your-password
export MCP_MYSQL_CACHE_ENABLED=true
```

2. Configure additional business system data sources:
```bash
# CRM Data Source
export MYSQL_HOST_CRM_HOST=crm-db.company.com
export MYSQL_HOST_CRM_USER=crm_readonly
export MYSQL_HOST_CRM_PASSWORD=crm_secret

# E-commerce Data Source
export MYSQL_HOST_ECOMMERCE_HOST=shop-db.company.com
export MYSQL_HOST_ECOMMERCE_USER=shop_analytics
export MYSQL_HOST_ECOMMERCE_PASSWORD=shop_secret

# ERP Data Source
export MYSQL_HOST_ERP_HOST=erp-db.company.com
export MYSQL_HOST_ERP_USER=erp_reporting
export MYSQL_HOST_ERP_PASSWORD=erp_secret
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

### Multi-Host Query Execution
```json
{
  "tool": "mysql_query",
  "parameters": {
    "query": "SELECT COUNT(*) as total_orders FROM orders WHERE status = 'completed'",
    "host": "prod",
    "database": "sales"
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

### Enterprise Data Source Discovery
```json
{
  "tool": "mysql_discover_analytics",
  "parameters": {
    "host": "crm",
    "focus_area": "user_behavior",
    "detail_level": "detailed"
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

### Cross-Source Data Relationship Analysis
```json
{
  "tool": "mysql_analyze_tables",
  "parameters": {
    "host": "ecommerce",
    "tables": ["customers", "orders", "products", "inventory"],
    "analysis_type": "user_behavior"
  }
}
```

### Host Inventory Management
```json
{
  "tool": "mysql_inventory",
  "parameters": {
    "refresh": true
  }
}
```

### Cross-Source Business Intelligence
```json
{
  "tool": "mysql_cross_host_query",
  "parameters": {
    "queries": [
      {
        "host": "crm",
        "database": "salesforce_sync",
        "query": "SELECT customer_id, email, lead_source, created_date FROM leads WHERE status = 'converted' AND created_date >= '2024-01-01'",
        "alias": "crm_leads"
      },
      {
        "host": "ecommerce",
        "database": "store_analytics",
        "query": "SELECT customer_email as email, COUNT(*) as order_count, SUM(total) as lifetime_value FROM orders WHERE created_at >= '2024-01-01' GROUP BY customer_email",
        "alias": "ecommerce_orders"
      },
      {
        "host": "support",
        "database": "ticket_analytics",
        "query": "SELECT requester_email as email, COUNT(*) as ticket_count, AVG(resolution_hours) as avg_resolution FROM tickets WHERE created_at >= '2024-01-01' GROUP BY requester_email",
        "alias": "support_tickets"
      }
    ],
    "combine_strategy": "correlation",
    "analysis_focus": "user_behavior"
  }
}
```

All operations automatically benefit from the caching system, improving performance for repeated queries and analysis.

## 🏢 Enterprise Data Federation Use Cases

### **360° Customer Intelligence**
Combine customer data across all business touchpoints for comprehensive customer analytics:

```json
{
  "tool": "mysql_cross_host_query",
  "parameters": {
    "queries": [
      {
        "host": "crm",
        "database": "salesforce_sync",
        "query": "SELECT customer_id, email, lead_source, created_date, annual_revenue FROM customers WHERE status = 'active'",
        "alias": "crm_customers"
      },
      {
        "host": "ecommerce",
        "database": "store_data",
        "query": "SELECT customer_email as email, COUNT(*) as total_orders, SUM(order_total) as lifetime_value, MAX(order_date) as last_purchase FROM orders GROUP BY customer_email",
        "alias": "purchase_history"
      },
      {
        "host": "support",
        "database": "helpdesk",
        "query": "SELECT requester_email as email, COUNT(*) as ticket_count, AVG(satisfaction_score) as avg_satisfaction FROM tickets GROUP BY requester_email",
        "alias": "support_interactions"
      }
    ],
    "combine_strategy": "correlation",
    "analysis_focus": "user_behavior"
  }
}
```

### **Revenue Attribution Analysis**
Track complete customer journey from marketing campaign to revenue:

```json
{
  "tool": "mysql_cross_host_query",
  "parameters": {
    "queries": [
      {
        "host": "marketing",
        "database": "campaign_data",
        "query": "SELECT email, campaign_name, campaign_type, first_touch_date, lead_score FROM leads WHERE created_date >= '2024-01-01'",
        "alias": "marketing_leads"
      },
      {
        "host": "crm",
        "database": "sales_pipeline",
        "query": "SELECT email, opportunity_value, close_date, sales_stage FROM opportunities WHERE close_date >= '2024-01-01'",
        "alias": "sales_pipeline"
      },
      {
        "host": "ecommerce",
        "database": "transactions",
        "query": "SELECT customer_email as email, SUM(order_total) as revenue, COUNT(*) as orders FROM orders WHERE order_date >= '2024-01-01' GROUP BY customer_email",
        "alias": "actual_revenue"
      }
    ],
    "combine_strategy": "correlation",
    "analysis_focus": "business_metrics"
  }
}
```

### **Operational Efficiency Analysis**
Identify bottlenecks across business processes:

```json
{
  "tool": "mysql_cross_host_query",
  "parameters": {
    "queries": [
      {
        "host": "erp",
        "database": "procurement",
        "query": "SELECT vendor_id, AVG(DATEDIFF(delivery_date, order_date)) as avg_delivery_days, COUNT(*) as orders FROM purchase_orders WHERE order_date >= '2024-01-01' GROUP BY vendor_id",
        "alias": "supplier_performance"
      },
      {
        "host": "ecommerce",
        "database": "inventory",
        "query": "SELECT product_sku, current_stock, reorder_point, AVG(days_out_of_stock) as stockout_days FROM inventory_levels GROUP BY product_sku",
        "alias": "inventory_health"
      },
      {
        "host": "support",
        "database": "tickets",
        "query": "SELECT product_category, COUNT(*) as issue_count, AVG(resolution_hours) as avg_resolution FROM product_issues WHERE created_date >= '2024-01-01' GROUP BY product_category",
        "alias": "product_issues"
      }
    ],
    "combine_strategy": "comparison",
    "analysis_focus": "performance"
  }
}
```

### **Data Consistency Auditing**
Validate data integrity across business systems:

```json
{
  "tool": "mysql_cross_host_query",
  "parameters": {
    "queries": [
      {
        "host": "crm",
        "database": "customer_master",
        "query": "SELECT email, customer_status, last_updated FROM customers WHERE last_updated >= CURDATE() - INTERVAL 7 DAY",
        "alias": "crm_customer_status"
      },
      {
        "host": "ecommerce",
        "database": "user_accounts",
        "query": "SELECT email, account_status, last_login, updated_at FROM user_accounts WHERE updated_at >= CURDATE() - INTERVAL 7 DAY",
        "alias": "ecommerce_account_status"
      },
      {
        "host": "marketing",
        "database": "subscriber_lists",
        "query": "SELECT email, subscription_status, last_email_sent, updated_date FROM subscribers WHERE updated_date >= CURDATE() - INTERVAL 7 DAY",
        "alias": "marketing_subscription_status"
      }
    ],
    "combine_strategy": "comparison",
    "analysis_focus": "data_consistency"
  }
}
```

## 🎯 Advanced Federation Scenarios

### **Multi-Region Business Consolidation**
```bash
# Configure regional data sources
export MYSQL_HOST_US_EAST_HOST=us-east-db.company.com
export MYSQL_HOST_US_WEST_HOST=us-west-db.company.com  
export MYSQL_HOST_EUROPE_HOST=eu-db.company.com
export MYSQL_HOST_ASIA_HOST=asia-db.company.com
```

### **Merger & Acquisition Data Integration**
```bash
# Legacy and acquired company systems
export MYSQL_HOST_LEGACY_HOST=legacy-erp.oldcompany.com
export MYSQL_HOST_ACQUIRED_HOST=acquired-systems.newcompany.com
export MYSQL_HOST_UNIFIED_HOST=unified-platform.company.com
```

### **Multi-Tenant SaaS Analytics**
```bash
# Customer-specific data sources
export MYSQL_HOST_TENANT_A_HOST=client-a-db.saas.com
export MYSQL_HOST_TENANT_B_HOST=client-b-db.saas.com
export MYSQL_HOST_ANALYTICS_HOST=saas-analytics.company.com
```

## 🛠️ LLM Integration Examples

### **Directing AI for Business Intelligence**

**Prompt**: "Analyze our Q1 performance by combining CRM leads, e-commerce sales, and support ticket data. Focus on customer satisfaction impact on revenue."

**LLM Response**: Uses `mysql_cross_host_query` with correlation strategy across CRM, e-commerce, and support systems, automatically generating insights about:
- Lead conversion rates by source
- Revenue correlation with support satisfaction scores  
- Customer lifetime value impact of support quality

### **AI-Driven Data Discovery**

**Prompt**: "What business systems do we have and what kind of analysis is possible?"

**LLM Response**: Uses `mysql_inventory` to show:
- Classified business systems (CRM, E-commerce, ERP, etc.)
- Available databases and estimated record counts
- Federation capabilities and shared identifiers
- Recommended cross-system analysis opportunities

### **Automated Report Generation**

**Prompt**: "Create an executive dashboard combining our financial, sales, and operational data."

**LLM Response**: Generates federated queries across ERP (financials), e-commerce (sales), and operational systems, providing:
- Revenue trends with cost analysis
- Operational efficiency metrics
- Cross-functional KPIs and recommendations

## 🏗️ Development

### **Enterprise Deployment**

```bash
# Production deployment with multiple business systems
docker run -d \
  -e MYSQL_HOST_CRM_HOST=crm-prod.company.com \
  -e MYSQL_HOST_CRM_PASSWORD=secure_crm_password \
  -e MYSQL_HOST_ECOMMERCE_HOST=shop-prod.company.com \
  -e MYSQL_HOST_ECOMMERCE_PASSWORD=secure_shop_password \
  -e MYSQL_HOST_ERP_HOST=erp-prod.company.com \
  -e MYSQL_HOST_ERP_PASSWORD=secure_erp_password \
  mysql-mcp-server:3.0.0
```

### **Data Federation Testing**

The system automatically:
- Discovers and classifies business systems
- Tests cross-system connectivity
- Identifies shared customer/user identifiers
- Caches federation capabilities
- Provides intelligent query recommendations

### **Build Commands**

```bash
npm run build    # Build TypeScript to JavaScript
npm run dev      # Development mode with auto-reload  
npm run lint     # Run ESLint
npm run test     # Run tests (if available)
```