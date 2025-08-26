#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import mysql from 'mysql2/promise';
import { z } from 'zod';

const QueryParamsSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  params: z.array(z.any()).optional().default([])
});

interface ConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string; // Optional - if not provided, connects to server with access to all databases
  ssl?: mysql.SslOptions | string;
}

class MySQLMCPServer {
  private server: Server;
  private connection: mysql.Connection | null = null;
  private config: ConnectionConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'mysql-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE, // Optional - undefined means server-wide access
      ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined
    };

    this.setupHandlers();
  }

  private async createConnection(database?: string): Promise<mysql.Connection> {
    // Create new connection if we need a different database or don't have one
    const targetDb = database || this.config.database;
    
    if (!this.connection || (targetDb && this.connection.config.database !== targetDb)) {
      try {
        const connectionConfig = {
          ...this.config,
          timezone: 'Z',
          dateStrings: true,
          supportBigNumbers: true,
          bigNumberStrings: true,
          connectTimeout: 10000
        };
        
        // Only set database if specified
        if (targetDb) {
          connectionConfig.database = targetDb;
        }
        
        this.connection = await mysql.createConnection(connectionConfig);
        await this.connection.ping();
        
        console.error(`Connected to MySQL server${targetDb ? ` (database: ${targetDb})` : ' (server-wide access)'}`);
      } catch (error) {
        console.error('Database connection failed:', error);
        throw new Error(`Cannot connect to MySQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return this.connection;
  }

  private isReadOnlyQuery(query: string): boolean {
    const trimmed = query.trim().toLowerCase();
    const readOnlyPrefixes = ['select', 'show', 'describe', 'explain', 'desc'];
    return readOnlyPrefixes.some(prefix => trimmed.startsWith(prefix));
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'mysql_query',
          description: 'Execute a read-only SQL query against MySQL databases. Supports SELECT, SHOW, DESCRIBE, and EXPLAIN statements.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The SQL query to execute (read-only operations only). Use database.table syntax for cross-database queries.'
              },
              params: {
                type: 'array',
                description: 'Optional array of parameters for prepared statement',
                items: { type: 'string' }
              },
              database: {
                type: 'string',
                description: 'Optional database name to connect to for this query'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'mysql_schema',
          description: 'Get comprehensive schema information including tables, relationships, constraints, and data patterns.',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                description: 'Database name to analyze (if not specified, analyzes current/default database)'
              },
              table: {
                type: 'string',
                description: 'Optional table name to get specific table analysis (use database.table for cross-database)'
              },
              include_relationships: {
                type: 'boolean',
                description: 'Include foreign key relationships and table connections',
                default: true
              },
              include_sample_data: {
                type: 'boolean', 
                description: 'Include sample data and value distributions',
                default: false
              },
              sample_size: {
                type: 'number',
                description: 'Number of sample rows to analyze (max 1000)',
                default: 100
              }
            }
          }
        },
        {
          name: 'mysql_analyze_tables',
          description: 'Analyze table relationships and suggest optimal query patterns for user behavior analysis.',
          inputSchema: {
            type: 'object',
            properties: {
              tables: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of table names to analyze for relationships'
              },
              analysis_type: {
                type: 'string',
                enum: ['relationships', 'user_behavior', 'data_flow'],
                description: 'Type of analysis to perform',
                default: 'relationships'
              }
            },
            required: ['tables']
          }
        },
        {
          name: 'mysql_discover_analytics',
          description: 'Intelligently discover and analyze database structure with expert data analytics insights. Always start with this for new servers.',
          inputSchema: {
            type: 'object',
            properties: {
              databases: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional list of databases to analyze (if not specified, discovers all accessible databases)'
              },
              focus_area: {
                type: 'string',
                enum: ['user_behavior', 'sales_analytics', 'engagement', 'general'],
                description: 'Analytics focus area to guide discovery',
                default: 'general'
              },
              include_recommendations: {
                type: 'boolean',
                description: 'Include expert analytics recommendations and queries',
                default: true
              },
              cross_database_analysis: {
                type: 'boolean',
                description: 'Analyze relationships across databases',
                default: true
              }
            }
          }
        }
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'mysql_query':
            return await this.handleQuery(args);
          case 'mysql_schema':
            return await this.handleSchema(args);
          case 'mysql_analyze_tables':
            return await this.handleAnalyzeTables(args);
          case 'mysql_discover_analytics':
            return await this.handleDiscoverAnalytics(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`
            }
          ]
        };
      }
    });
  }

  private async handleQuery(args: any) {
    const parsed = QueryParamsSchema.parse(args);
    
    if (!this.isReadOnlyQuery(parsed.query)) {
      throw new Error('Only read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN) are allowed');
    }

    if (parsed.query.length > 10000) {
      throw new Error('Query too long (max 10,000 characters)');
    }

    const connection = await this.createConnection(args.database);
    
    try {
      const startTime = Date.now();
      const [rows] = await connection.execute(parsed.query, parsed.params);
      const endTime = Date.now();
      
      const rowCount = Array.isArray(rows) ? rows.length : 0;
      const executionTime = endTime - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: {
                sql: parsed.query,
                parameters: parsed.params,
                executionTime: `${executionTime}ms`,
                rowCount
              },
              data: rows,
              analytics: {
                summary: `Executed ${parsed.query.trim().split(' ')[0].toUpperCase()} query returning ${rowCount} rows in ${executionTime}ms`,
                performance: executionTime > 1000 ? 'Consider adding indexes if this query runs frequently' : 'Good performance'
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Query execution error:', error);
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSchema(args: any) {
    const connection = await this.createConnection(args?.database);
    const includeRelationships = args?.include_relationships !== false;
    const includeSampleData = args?.include_sample_data === true;
    const sampleSize = Math.min(args?.sample_size || 100, 1000);
    const targetDatabase = args?.database || this.config.database;
    
    if (args?.table) {
      // Handle database.table format
      let tableName = args.table;
      let dbName = targetDatabase;
      if (tableName.includes('.')) {
        [dbName, tableName] = tableName.split('.', 2);
      }
      return await this.getDetailedTableSchema(connection, tableName, dbName, includeRelationships, includeSampleData, sampleSize);
    } else {
      return await this.getDatabaseOverview(connection, targetDatabase, includeRelationships);
    }
  }

  private async getDetailedTableSchema(connection: mysql.Connection, tableName: string, databaseName: string | undefined, includeRelationships: boolean, includeSampleData: boolean, sampleSize: number) {
    const [columns] = await connection.execute('DESCRIBE ??', [tableName]);
    const [indexes] = await connection.execute('SHOW INDEX FROM ??', [tableName]);
    
    let foreignKeys: any[] = [];
    let referencedBy: any[] = [];
    let constraints: any[] = [];
    let sampleData: any = null;
    let dataProfile: any = null;

    if (includeRelationships) {
      const [foreignKeysResult] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [this.config.database, tableName]);
      foreignKeys = foreignKeysResult as any[];

      const [referencedByResult] = await connection.execute(`
        SELECT 
          TABLE_NAME as referencing_table,
          COLUMN_NAME as referencing_column,
          CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = ?
      `, [this.config.database, tableName]);
      referencedBy = referencedByResult as any[];

      const [constraintsResult] = await connection.execute(`
        SELECT 
          CONSTRAINT_NAME,
          CONSTRAINT_TYPE,
          COLUMN_NAME
        FROM information_schema.TABLE_CONSTRAINTS tc
        LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ?
      `, [this.config.database, tableName]);
      constraints = constraintsResult as any[];
    }

    if (includeSampleData) {
      const [rows] = await connection.execute(`SELECT * FROM ?? LIMIT ?`, [tableName, sampleSize]);
      sampleData = rows;

      const [rowCount] = await connection.execute(`SELECT COUNT(*) as total FROM ??`, [tableName]) as any;
      
      dataProfile = {
        totalRows: rowCount[0]?.total || 0,
        sampleSize: Array.isArray(rows) ? rows.length : 0
      };

      if (Array.isArray(columns) && Array.isArray(rows) && rows.length > 0) {
        dataProfile.columnAnalysis = {};
        
        for (const col of columns as any[]) {
          const colName = col.Field;
          const values = rows.map((row: any) => row[colName]).filter(v => v !== null);
          
          dataProfile.columnAnalysis[colName] = {
            dataType: col.Type,
            nullable: col.Null === 'YES',
            nonNullValues: values.length,
            uniqueValues: new Set(values).size,
            sampleValues: [...new Set(values)].slice(0, 10)
          };
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            table: tableName,
            columns,
            indexes,
            relationships: {
              foreignKeys,
              referencedBy
            },
            constraints,
            ...(dataProfile && { dataProfile }),
            ...(sampleData && { sampleData })
          }, null, 2)
        }
      ]
    };
  }

  private async getDatabaseOverview(connection: mysql.Connection, databaseName: string | undefined, includeRelationships: boolean) {
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (!includeRelationships) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ tables }, null, 2)
          }
        ]
      };
    }

    const [relationships] = await connection.execute(`
      SELECT 
        TABLE_NAME as from_table,
        COLUMN_NAME as from_column,
        REFERENCED_TABLE_NAME as to_table,
        REFERENCED_COLUMN_NAME as to_column,
        CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [this.config.database]);

    const [tableSizes] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.TABLES 
      WHERE table_schema = ?
      ORDER BY (data_length + index_length) DESC
    `, [this.config.database]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            database: this.config.database,
            tables,
            tableSizes,
            relationships,
            relationshipGraph: this.buildRelationshipGraph(relationships as any[])
          }, null, 2)
        }
      ]
    };
  }

  private buildRelationshipGraph(relationships: any[]) {
    const graph: { [key: string]: any } = {};
    
    for (const rel of relationships) {
      if (!graph[rel.from_table]) {
        graph[rel.from_table] = { references: [], referencedBy: [] };
      }
      if (!graph[rel.to_table]) {
        graph[rel.to_table] = { references: [], referencedBy: [] };
      }
      
      graph[rel.from_table].references.push({
        table: rel.to_table,
        column: rel.to_column,
        through: rel.from_column
      });
      
      graph[rel.to_table].referencedBy.push({
        table: rel.from_table,
        column: rel.from_column,
        through: rel.to_column
      });
    }
    
    return graph;
  }

  private async handleAnalyzeTables(args: any) {
    const connection = await this.createConnection();
    const { tables, analysis_type = 'relationships' } = args;
    
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('Tables array is required and cannot be empty');
    }

    switch (analysis_type) {
      case 'relationships':
        return await this.analyzeTableRelationships(connection, tables);
      case 'user_behavior':
        return await this.analyzeUserBehaviorPatterns(connection, tables);
      case 'data_flow':
        return await this.analyzeDataFlow(connection, tables);
      default:
        throw new Error(`Unknown analysis type: ${analysis_type}`);
    }
  }

  private async analyzeTableRelationships(connection: mysql.Connection, tables: string[]) {
    const relationships: any[] = [];
    const tableInfo: any = {};
    
    for (const table of tables) {
      const [columns] = await connection.execute('DESCRIBE ??', [table]);
      const [foreignKeys] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [this.config.database, table]);

      const [rowCount] = await connection.execute(`SELECT COUNT(*) as total FROM ??`, [table]) as any;
      
      tableInfo[table] = {
        columns: columns,
        foreignKeys: foreignKeys,
        rowCount: rowCount[0]?.total || 0
      };
    }

    // Analyze join patterns
    const joinSuggestions = this.suggestOptimalJoins(tableInfo, tables);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            analysisType: 'relationships',
            tables: tableInfo,
            joinSuggestions,
            queryRecommendations: this.generateQueryRecommendations(tableInfo, 'relationships')
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeUserBehaviorPatterns(connection: mysql.Connection, tables: string[]) {
    const analysis: any = { tables: {}, patterns: [], recommendations: [] };
    
    for (const table of tables) {
      const [columns] = await connection.execute('DESCRIBE ??', [table]);
      const [sample] = await connection.execute(`SELECT * FROM ?? LIMIT 50`, [table]);
      
      // Identify potential user-related columns
      const userColumns = this.identifyUserColumns(columns as any[]);
      const timeColumns = this.identifyTimeColumns(columns as any[]);
      const behaviorColumns = this.identifyBehaviorColumns(columns as any[], sample as any[]);
      
      analysis.tables[table] = {
        columns: columns,
        userColumns,
        timeColumns,
        behaviorColumns,
        sampleData: sample
      };
    }
    
    // Generate user behavior analysis patterns
    analysis.patterns = this.identifyBehaviorPatterns(analysis.tables);
    analysis.recommendations = this.generateQueryRecommendations(analysis.tables, 'user_behavior');
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            analysisType: 'user_behavior',
            ...analysis
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeDataFlow(connection: mysql.Connection, tables: string[]) {
    const flow: any = { tables: {}, dataFlow: [], recommendations: [] };
    
    for (const table of tables) {
      const [columns] = await connection.execute('DESCRIBE ??', [table]);
      const [foreignKeys] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [this.config.database, table]);
      
      const [referencedBy] = await connection.execute(`
        SELECT 
          TABLE_NAME as referencing_table,
          COLUMN_NAME as referencing_column
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = ?
      `, [this.config.database, table]);

      flow.tables[table] = {
        columns,
        foreignKeys,
        referencedBy
      };
    }
    
    flow.dataFlow = this.traceDataFlow(flow.tables);
    flow.recommendations = this.generateQueryRecommendations(flow.tables, 'data_flow');
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            analysisType: 'data_flow',
            ...flow
          }, null, 2)
        }
      ]
    };
  }

  private identifyUserColumns(columns: any[]): string[] {
    const userKeywords = ['user', 'customer', 'account', 'person', 'member', 'client'];
    return columns
      .filter(col => userKeywords.some(keyword => 
        col.Field.toLowerCase().includes(keyword)))
      .map(col => col.Field);
  }

  private identifyTimeColumns(columns: any[]): string[] {
    const timeKeywords = ['time', 'date', 'created', 'updated', 'timestamp', 'at'];
    return columns
      .filter(col => 
        col.Type.toLowerCase().includes('timestamp') ||
        col.Type.toLowerCase().includes('datetime') ||
        col.Type.toLowerCase().includes('date') ||
        timeKeywords.some(keyword => col.Field.toLowerCase().includes(keyword)))
      .map(col => col.Field);
  }

  private identifyBehaviorColumns(columns: any[], sampleData: any[]): any[] {
    const behaviorKeywords = ['action', 'event', 'activity', 'status', 'type', 'category'];
    const behaviorCols = columns.filter(col => 
      behaviorKeywords.some(keyword => col.Field.toLowerCase().includes(keyword)));
    
    return behaviorCols.map(col => {
      const values = sampleData.map(row => row[col.Field]).filter(v => v !== null);
      return {
        column: col.Field,
        dataType: col.Type,
        sampleValues: [...new Set(values)].slice(0, 10),
        uniqueCount: new Set(values).size
      };
    });
  }

  private suggestOptimalJoins(tableInfo: any, tables: string[]): any[] {
    const suggestions: any[] = [];
    
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = tables[i];
        const table2 = tables[j];
        
        // Check for direct foreign key relationships
        const fk1 = tableInfo[table1].foreignKeys.find((fk: any) => 
          fk.REFERENCED_TABLE_NAME === table2);
        const fk2 = tableInfo[table2].foreignKeys.find((fk: any) => 
          fk.REFERENCED_TABLE_NAME === table1);
        
        if (fk1) {
          suggestions.push({
            from: table1,
            to: table2,
            joinType: 'INNER JOIN',
            condition: `${table1}.${fk1.COLUMN_NAME} = ${table2}.${fk1.REFERENCED_COLUMN_NAME}`,
            relationship: 'foreign_key'
          });
        } else if (fk2) {
          suggestions.push({
            from: table2,
            to: table1,
            joinType: 'INNER JOIN',
            condition: `${table2}.${fk2.COLUMN_NAME} = ${table1}.${fk2.REFERENCED_COLUMN_NAME}`,
            relationship: 'foreign_key'
          });
        } else {
          // Check for common column names that might indicate relationships
          const commonCols = this.findCommonColumns(
            tableInfo[table1].columns,
            tableInfo[table2].columns
          );
          if (commonCols.length > 0) {
            suggestions.push({
              from: table1,
              to: table2,
              joinType: 'INNER JOIN',
              condition: commonCols.map(col => `${table1}.${col} = ${table2}.${col}`).join(' AND '),
              relationship: 'inferred',
              commonColumns: commonCols
            });
          }
        }
      }
    }
    
    return suggestions;
  }

  private findCommonColumns(cols1: any[], cols2: any[]): string[] {
    const names1 = cols1.map(c => c.Field.toLowerCase());
    const names2 = cols2.map(c => c.Field.toLowerCase());
    return names1.filter(name => names2.includes(name));
  }

  private identifyBehaviorPatterns(tables: any): any[] {
    const patterns = [];
    
    for (const [tableName, tableData] of Object.entries(tables) as any[]) {
      if (tableData.userColumns.length > 0 && tableData.timeColumns.length > 0) {
        patterns.push({
          pattern: 'user_timeline',
          table: tableName,
          description: 'Track user actions over time',
          suggestedQuery: `SELECT ${tableData.userColumns[0]}, ${tableData.timeColumns[0]}, COUNT(*) as action_count 
                          FROM ${tableName} 
                          GROUP BY ${tableData.userColumns[0]}, DATE(${tableData.timeColumns[0]})
                          ORDER BY ${tableData.timeColumns[0]} DESC`
        });
      }
      
      if (tableData.behaviorColumns.length > 0) {
        patterns.push({
          pattern: 'behavior_analysis',
          table: tableName,
          description: 'Analyze user behavior patterns',
          suggestedQuery: `SELECT ${tableData.behaviorColumns[0].column}, COUNT(*) as frequency
                          FROM ${tableName}
                          GROUP BY ${tableData.behaviorColumns[0].column}
                          ORDER BY frequency DESC`
        });
      }
    }
    
    return patterns;
  }

  private traceDataFlow(tables: any): any[] {
    const flows = [];
    
    for (const [tableName, tableData] of Object.entries(tables) as any[]) {
      if (tableData.foreignKeys && tableData.foreignKeys.length > 0) {
        for (const fk of tableData.foreignKeys) {
          flows.push({
            from: fk.REFERENCED_TABLE_NAME,
            to: tableName,
            relationship: 'parent_to_child',
            column: fk.COLUMN_NAME
          });
        }
      }
    }
    
    return flows;
  }

  private generateQueryRecommendations(tableInfo: any, analysisType: string): any[] {
    const recommendations = [];
    
    if (analysisType === 'user_behavior') {
      recommendations.push({
        title: 'User Activity Over Time',
        description: 'Track how user engagement changes over time periods',
        example: 'SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users FROM events GROUP BY DATE(created_at)'
      });
      
      recommendations.push({
        title: 'User Funnel Analysis',
        description: 'Analyze user progression through different stages',
        example: 'WITH funnel AS (SELECT user_id, MIN(created_at) as first_action, MAX(created_at) as last_action FROM events GROUP BY user_id) SELECT COUNT(*) FROM funnel'
      });
    } else if (analysisType === 'relationships') {
      recommendations.push({
        title: 'Cross-Table User Analysis',
        description: 'Join related tables to get comprehensive user insights',
        example: 'SELECT u.*, COUNT(e.id) as event_count FROM users u LEFT JOIN events e ON u.id = e.user_id GROUP BY u.id'
      });
    }
    
    return recommendations;
  }

  private async handleDiscoverAnalytics(args: any) {
    const connection = await this.createConnection();
    const { 
      databases, 
      focus_area = 'general', 
      include_recommendations = true,
      cross_database_analysis = true 
    } = args;
    
    // First, discover available databases if not specified
    let targetDatabases = databases;
    if (!targetDatabases) {
      const dbQuery = `SHOW DATABASES`;
      const [dbResult] = await connection.execute(dbQuery);
      targetDatabases = (dbResult as any[])
        .map(row => row.Database)
        .filter(db => !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(db));
    }

    const discovery = {
      executedQueries: [] as string[],
      server: { host: this.config.host, port: this.config.port },
      analyzedDatabases: targetDatabases,
      focusArea: focus_area,
      discoveryTimestamp: new Date().toISOString(),
      databases: {} as any,
      crossDatabaseInsights: [] as any[],
      analyticsInsights: [] as any[],
      recommendedQueries: [] as any[]
    };

    discovery.executedQueries.push(`SHOW DATABASES`);

    // Analyze each database
    for (const dbName of targetDatabases) {
      const dbAnalysis = await this.analyzeSingleDatabase(connection, dbName, focus_area);
      discovery.databases[dbName] = dbAnalysis.database;
      discovery.executedQueries.push(...dbAnalysis.executedQueries);
    }

    // Cross-database analysis
    if (cross_database_analysis && targetDatabases.length > 1) {
      discovery.crossDatabaseInsights = this.analyzeCrossDatabasePatterns(discovery.databases);
    }

    // Generate insights and recommendations
    if (include_recommendations) {
      discovery.analyticsInsights = this.generateMultiDatabaseInsights(discovery.databases, focus_area);
      discovery.recommendedQueries = this.generateMultiDatabaseQueries(discovery.databases, focus_area);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(discovery, null, 2)
        }
      ]
    };
  }

  private classifyTableIntelligently(tableName: string, columns: any[], sampleData: any[], focusArea: string) {
    const analysis = {
      tableType: 'unknown',
      confidence: 0,
      userColumns: [] as string[],
      timeColumns: [] as string[],
      behaviorColumns: [] as string[],
      dimensionColumns: [] as string[],
      metricColumns: [] as string[],
      identifierColumns: [] as string[],
      relationships: {
        isFactTable: false,
        isDimensionTable: false,
        isUserTable: false,
        isEventTable: false,
        isLookupTable: false
      }
    };

    for (const col of columns) {
      const colName = col.COLUMN_NAME.toLowerCase();
      const dataType = col.DATA_TYPE.toLowerCase();
      
      // Identify column types intelligently
      if (colName.includes('id') && (col.COLUMN_KEY === 'PRI' || col.EXTRA.includes('auto_increment'))) {
        analysis.identifierColumns.push(col.COLUMN_NAME);
      }
      
      if (['user', 'customer', 'account', 'person', 'member', 'client'].some(k => colName.includes(k))) {
        analysis.userColumns.push(col.COLUMN_NAME);
      }
      
      if (dataType.includes('timestamp') || dataType.includes('datetime') || dataType.includes('date') ||
          ['created', 'updated', 'modified', 'deleted', 'time', 'date'].some(k => colName.includes(k))) {
        analysis.timeColumns.push(col.COLUMN_NAME);
      }
      
      if (['action', 'event', 'activity', 'status', 'type', 'category', 'state'].some(k => colName.includes(k))) {
        analysis.behaviorColumns.push(col.COLUMN_NAME);
      }
      
      if (['count', 'amount', 'total', 'sum', 'avg', 'price', 'cost', 'revenue', 'quantity'].some(k => colName.includes(k))) {
        analysis.metricColumns.push(col.COLUMN_NAME);
      }
      
      if (['name', 'title', 'description', 'label', 'category'].some(k => colName.includes(k))) {
        analysis.dimensionColumns.push(col.COLUMN_NAME);
      }
    }

    // Determine table type based on analysis
    if (analysis.userColumns.length > 0 && analysis.timeColumns.length === 0) {
      analysis.tableType = 'user_dimension';
      analysis.relationships.isUserTable = true;
      analysis.relationships.isDimensionTable = true;
      analysis.confidence = 0.9;
    } else if (analysis.userColumns.length > 0 && analysis.timeColumns.length > 0 && analysis.behaviorColumns.length > 0) {
      analysis.tableType = 'user_events';
      analysis.relationships.isEventTable = true;
      analysis.relationships.isFactTable = true;
      analysis.confidence = 0.95;
    } else if (analysis.metricColumns.length > analysis.dimensionColumns.length) {
      analysis.tableType = 'fact_table';
      analysis.relationships.isFactTable = true;
      analysis.confidence = 0.8;
    } else if (analysis.dimensionColumns.length > 0 && columns.length < 10) {
      analysis.tableType = 'dimension_table';
      analysis.relationships.isDimensionTable = true;
      analysis.confidence = 0.7;
    } else if (columns.length < 5 && sampleData.length < 100) {
      analysis.tableType = 'lookup_table';
      analysis.relationships.isLookupTable = true;
      analysis.confidence = 0.6;
    }

    return analysis;
  }

  private generateTableInsights(tableName: string, tableInfo: any, columns: any[], sampleData: any[], relationships: any[]) {
    const insights = [];
    
    // Size insights
    if (tableInfo.TABLE_ROWS > 1000000) {
      insights.push(`Large table with ${tableInfo.TABLE_ROWS?.toLocaleString()} rows - consider partitioning strategies`);
    }
    
    // Relationship insights
    const incomingRefs = relationships.filter(r => r.target_table === tableName);
    const outgoingRefs = relationships.filter(r => r.source_table === tableName);
    
    if (incomingRefs.length > 3) {
      insights.push(`Central table with ${incomingRefs.length} incoming relationships - likely a core dimension`);
    }
    
    if (outgoingRefs.length > 5) {
      insights.push(`Highly connected table with ${outgoingRefs.length} foreign keys - potential fact table`);
    }

    // Data quality insights
    const nullableCols = columns.filter(c => c.IS_NULLABLE === 'YES').length;
    if (nullableCols > columns.length * 0.7) {
      insights.push(`High nullable column ratio (${Math.round(nullableCols/columns.length*100)}%) - check data completeness`);
    }

    return insights;
  }

  private generateExpertInsights(tables: any, relationships: any[], focusArea: string) {
    const insights = [];
    
    const tableNames = Object.keys(tables);
    const factTables = tableNames.filter(t => tables[t].analysis.relationships.isFactTable);
    const dimTables = tableNames.filter(t => tables[t].analysis.relationships.isDimensionTable);
    const userTables = tableNames.filter(t => tables[t].analysis.relationships.isUserTable);
    const eventTables = tableNames.filter(t => tables[t].analysis.relationships.isEventTable);

    insights.push({
      category: 'Schema Architecture',
      insight: `Detected ${factTables.length} fact tables, ${dimTables.length} dimension tables`,
      recommendation: factTables.length > 0 ? 'Star schema detected - optimize for analytical queries' : 'Consider creating fact tables for better analytics'
    });

    if (focusArea === 'user_behavior' && userTables.length > 0 && eventTables.length > 0) {
      insights.push({
        category: 'User Analytics Ready',
        insight: `Found user tables (${userTables.join(', ')}) and event tables (${eventTables.join(', ')})`,
        recommendation: 'Perfect setup for user journey analysis, cohort studies, and behavioral segmentation'
      });
    }

    if (relationships.length > 10) {
      insights.push({
        category: 'Complex Schema',
        insight: `${relationships.length} relationships detected`,
        recommendation: 'Use CTEs and proper indexing for multi-table analytical queries'
      });
    }

    return insights;
  }

  private generateExpertQueries(tables: any, relationships: any[], focusArea: string) {
    const queries = [];
    
    const userTables = Object.keys(tables).filter(t => tables[t].analysis.relationships.isUserTable);
    const eventTables = Object.keys(tables).filter(t => tables[t].analysis.relationships.isEventTable);

    if (focusArea === 'user_behavior' && userTables.length > 0 && eventTables.length > 0) {
      const userTable = userTables[0];
      const eventTable = eventTables[0];
      const userIdCol = tables[userTable].analysis.userColumns[0] || 'user_id';
      const timeCol = tables[eventTable].analysis.timeColumns[0] || 'created_at';
      
      queries.push({
        title: 'User Activity Timeline',
        description: 'Track user engagement over time',
        sql: `SELECT 
  DATE(${timeCol}) as activity_date,
  COUNT(DISTINCT ${userIdCol}) as active_users,
  COUNT(*) as total_events
FROM ${eventTable} 
WHERE ${timeCol} >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(${timeCol})
ORDER BY activity_date DESC`,
        useCase: 'Daily active user tracking and engagement trends'
      });

      queries.push({
        title: 'User Behavior Cohort Analysis',
        description: 'Analyze user retention by signup cohort',
        sql: `WITH user_cohorts AS (
  SELECT 
    ${userIdCol},
    DATE_FORMAT(MIN(${timeCol}), '%Y-%m') as signup_month
  FROM ${eventTable}
  GROUP BY ${userIdCol}
),
cohort_activity AS (
  SELECT 
    uc.signup_month,
    DATE_FORMAT(e.${timeCol}, '%Y-%m') as activity_month,
    COUNT(DISTINCT e.${userIdCol}) as active_users
  FROM user_cohorts uc
  JOIN ${eventTable} e ON uc.${userIdCol} = e.${userIdCol}
  GROUP BY uc.signup_month, DATE_FORMAT(e.${timeCol}, '%Y-%m')
)
SELECT 
  signup_month,
  activity_month,
  active_users,
  DATEDIFF(STR_TO_DATE(activity_month, '%Y-%m'), STR_TO_DATE(signup_month, '%Y-%m'))/30 as months_since_signup
FROM cohort_activity
ORDER BY signup_month, activity_month`,
        useCase: 'Understanding user retention patterns over time'
      });
    }

    // Add general analytical queries
    const factTables = Object.keys(tables).filter(t => tables[t].analysis.relationships.isFactTable);
    if (factTables.length > 0) {
      const factTable = factTables[0];
      const timeCol = tables[factTable].analysis.timeColumns[0];
      const metricCol = tables[factTable].analysis.metricColumns[0];
      
      if (timeCol && metricCol) {
        queries.push({
          title: 'Time Series Analysis',
          description: `Analyze ${metricCol} trends over time`,
          sql: `SELECT 
  DATE_FORMAT(${timeCol}, '%Y-%m') as period,
  COUNT(*) as record_count,
  SUM(${metricCol}) as total_${metricCol},
  AVG(${metricCol}) as avg_${metricCol}
FROM ${factTable}
WHERE ${timeCol} >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(${timeCol}, '%Y-%m')
ORDER BY period`,
          useCase: 'Monthly performance tracking and trend analysis'
        });
      }
    }

    return queries;
  }

  private async analyzeSingleDatabase(connection: mysql.Connection, databaseName: string, focusArea: string) {
    const analysis = {
      database: {
        name: databaseName,
        tables: {} as any,
        relationships: [] as any[],
        summary: {} as any
      },
      executedQueries: [] as string[]
    };

    // Get all tables for this database
    const tablesQuery = `
      SELECT 
        t.TABLE_NAME,
        t.ENGINE,
        t.TABLE_ROWS,
        t.DATA_LENGTH,
        t.INDEX_LENGTH,
        t.AUTO_INCREMENT,
        t.CREATE_TIME,
        t.UPDATE_TIME,
        t.TABLE_COMMENT
      FROM information_schema.TABLES t 
      WHERE t.TABLE_SCHEMA = ?
      ORDER BY t.DATA_LENGTH DESC`;
    
    analysis.executedQueries.push(tablesQuery);
    const [tablesResult] = await connection.execute(tablesQuery, [databaseName]);
    const tables = tablesResult as any[];

    // Get relationships for this database
    const relationshipsQuery = `
      SELECT 
        kcu.TABLE_NAME as source_table,
        kcu.COLUMN_NAME as source_column,
        kcu.REFERENCED_TABLE_NAME as target_table,
        kcu.REFERENCED_COLUMN_NAME as target_column,
        kcu.CONSTRAINT_NAME,
        rc.UPDATE_RULE,
        rc.DELETE_RULE
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      WHERE kcu.TABLE_SCHEMA = ? 
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`;
    
    analysis.executedQueries.push(relationshipsQuery);
    const [relationshipsResult] = await connection.execute(relationshipsQuery, [databaseName]);
    analysis.database.relationships = relationshipsResult as any[];

    // Analyze each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Get columns
      const columnsQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA,
          COLUMN_COMMENT,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`;
      
      analysis.executedQueries.push(columnsQuery);
      const [columnsResult] = await connection.execute(columnsQuery, [databaseName, tableName]);
      const columns = columnsResult as any[];

      // Get sample data
      const sampleQuery = `SELECT * FROM \`${databaseName}\`.\`${tableName}\` LIMIT 10`;
      analysis.executedQueries.push(sampleQuery);
      const [sampleResult] = await connection.execute(sampleQuery);
      const sampleData = sampleResult as any[];

      // Classify table
      const tableAnalysis = this.classifyTableIntelligently(tableName, columns, sampleData, focusArea);
      
      analysis.database.tables[tableName] = {
        ...table,
        database: databaseName,
        columns,
        sampleData: sampleData.slice(0, 5),
        analysis: tableAnalysis,
        insights: this.generateTableInsights(tableName, table, columns, sampleData, analysis.database.relationships)
      };
    }

    // Generate database summary
    analysis.database.summary = this.generateDatabaseSummary(analysis.database.tables, analysis.database.relationships);

    return analysis;
  }

  private generateDatabaseSummary(tables: any, relationships: any[]) {
    const tableNames = Object.keys(tables);
    const factTables = tableNames.filter(t => tables[t].analysis.relationships.isFactTable);
    const dimTables = tableNames.filter(t => tables[t].analysis.relationships.isDimensionTable);
    const userTables = tableNames.filter(t => tables[t].analysis.relationships.isUserTable);
    const eventTables = tableNames.filter(t => tables[t].analysis.relationships.isEventTable);

    return {
      totalTables: tableNames.length,
      factTables: factTables.length,
      dimensionTables: dimTables.length,
      userTables: userTables.length,
      eventTables: eventTables.length,
      relationships: relationships.length,
      largestTables: tableNames
        .sort((a, b) => (tables[b].TABLE_ROWS || 0) - (tables[a].TABLE_ROWS || 0))
        .slice(0, 5),
      architecture: factTables.length > 0 ? 'star_schema' : 'normalized'
    };
  }

  private analyzeCrossDatabasePatterns(databases: any): any[] {
    const insights = [];
    const dbNames = Object.keys(databases);
    
    // Look for similar table structures across databases
    const tablePatterns: any = {};
    for (const dbName of dbNames) {
      const tables = Object.keys(databases[dbName].tables);
      for (const tableName of tables) {
        if (!tablePatterns[tableName]) tablePatterns[tableName] = [];
        tablePatterns[tableName].push({
          database: dbName,
          analysis: databases[dbName].tables[tableName].analysis
        });
      }
    }

    // Find tables that exist in multiple databases
    for (const [tableName, instances] of Object.entries(tablePatterns) as [string, any[]][]) {
      if (instances.length > 1) {
        insights.push({
          pattern: 'duplicate_table_structure',
          table: tableName,
          databases: instances.map(i => i.database),
          recommendation: `Table '${tableName}' exists in ${instances.length} databases - consider data partitioning strategy`
        });
      }
    }

    // Look for user data spread across databases
    const userDatabases = dbNames.filter(db => 
      databases[db].summary.userTables > 0 || databases[db].summary.eventTables > 0
    );
    
    if (userDatabases.length > 1) {
      insights.push({
        pattern: 'distributed_user_data',
        databases: userDatabases,
        recommendation: 'User data is distributed across multiple databases - consider cross-database user journey analysis'
      });
    }

    return insights;
  }

  private generateMultiDatabaseInsights(databases: any, focusArea: string): any[] {
    const insights = [];
    const dbNames = Object.keys(databases);
    
    insights.push({
      category: 'Server Overview',
      insight: `Analyzed ${dbNames.length} databases with ${Object.values(databases).reduce((sum: number, db: any) => sum + db.summary.totalTables, 0)} total tables`,
      recommendation: `Server contains ${dbNames.join(', ')} - use database.table syntax for cross-database queries`
    });

    // Architecture insights
    const starSchemas = dbNames.filter(db => databases[db].summary.architecture === 'star_schema');
    if (starSchemas.length > 0) {
      insights.push({
        category: 'Analytics Architecture',
        insight: `Star schema detected in: ${starSchemas.join(', ')}`,
        recommendation: 'These databases are optimized for analytical queries and reporting'
      });
    }

    if (focusArea === 'user_behavior') {
      const userDatabases = dbNames.filter(db => databases[db].summary.userTables > 0);
      if (userDatabases.length > 0) {
        insights.push({
          category: 'User Analytics Ready',
          insight: `User data found in: ${userDatabases.join(', ')}`,
          recommendation: 'Perfect setup for cross-database user behavior analysis and journey mapping'
        });
      }
    }

    return insights;
  }

  private generateMultiDatabaseQueries(databases: any, focusArea: string): any[] {
    const queries = [];
    const dbNames = Object.keys(databases);

    // Cross-database user analysis
    if (focusArea === 'user_behavior') {
      const userDatabases = dbNames.filter(db => databases[db].summary.userTables > 0);
      const eventDatabases = dbNames.filter(db => databases[db].summary.eventTables > 0);

      if (userDatabases.length > 0 && eventDatabases.length > 0) {
        queries.push({
          title: 'Cross-Database User Activity',
          description: 'Analyze user activity across multiple databases',
          sql: `-- Example: Cross-database user activity analysis
-- Adjust database and table names according to your schema
SELECT 
  u.user_id,
  u.email,
  COUNT(DISTINCT e1.id) as events_db1,
  COUNT(DISTINCT e2.id) as events_db2
FROM ${userDatabases[0]}.users u
LEFT JOIN ${eventDatabases[0]}.events e1 ON u.user_id = e1.user_id
LEFT JOIN ${eventDatabases.length > 1 ? eventDatabases[1] : eventDatabases[0]}.events e2 ON u.user_id = e2.user_id
GROUP BY u.user_id, u.email
ORDER BY (COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id)) DESC`,
          useCase: 'Understanding user engagement across different application components'
        });
      }
    }

    // Database comparison queries
    queries.push({
      title: 'Database Size Comparison',
      description: 'Compare table sizes across databases',
      sql: `SELECT 
  TABLE_SCHEMA as database_name,
  TABLE_NAME,
  TABLE_ROWS,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN (${dbNames.map(db => `'${db}'`).join(', ')})
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
LIMIT 20`,
      useCase: 'Identifying largest tables for optimization and resource planning'
    });

    return queries;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MySQL MCP Server running on stdio');
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

const server = new MySQLMCPServer();

process.on('SIGINT', async () => {
  await server.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.cleanup();
  process.exit(0);
});

server.start().catch(console.error);