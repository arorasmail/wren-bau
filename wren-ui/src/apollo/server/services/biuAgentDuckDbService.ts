import path from 'path';
import fs from 'fs';
import { getLogger } from '@server/utils';

const logger = getLogger('BiuAgentDuckDbService');

export interface BiuAgentDuckDbConfig {
  dataPath: string; // Path to CSV data files
}

/**
 * Service to generate DuckDB initSql for biu-agent CSV files
 * This allows biu-agent to use wren's existing DuckDB connection infrastructure
 * instead of separate CSV/SQL connections
 */
export class BiuAgentDuckDbService {
  private dataPath: string;

  constructor(config: BiuAgentDuckDbConfig) {
    this.dataPath = config.dataPath;
  }

  /**
   * Generate DuckDB initSql statements to load all biu-agent CSV files
   * This creates tables from CSV files that can be queried through wren's standard connection
   */
  public generateInitSql(): string {
    const csvFiles = this.getCsvFiles();
    const initSqlStatements: string[] = [];

    csvFiles.forEach((file) => {
      const tableName = this.getTableNameFromFile(file);
      const filePath = path.join(this.dataPath, file);
      const absolutePath = path.resolve(filePath);

      // Generate CREATE TABLE statement using DuckDB's read_csv function
      // DuckDB can read CSV files directly without needing to import them first
      const statement = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv('${absolutePath}', header=true, auto_detect=true);`;
      initSqlStatements.push(statement);
    });

    return initSqlStatements.join('\n');
  }

  /**
   * Generate initSql with explicit schema definitions for better type safety
   * This is useful if you want to ensure consistent data types
   */
  public generateInitSqlWithSchema(): string {
    const csvFiles = this.getCsvFiles();
    const initSqlStatements: string[] = [];

    csvFiles.forEach((file) => {
      const tableName = this.getTableNameFromFile(file);
      const filePath = path.join(this.dataPath, file);
      const absolutePath = path.resolve(filePath);

      // Use auto_detect for schema inference, but you can also specify explicit schema
      // Example with explicit schema:
      // const statement = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv('${absolutePath}', header=true, columns={'column1': 'VARCHAR', 'column2': 'INTEGER'});`;

      const statement = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv('${absolutePath}', header=true, auto_detect=true);`;
      initSqlStatements.push(statement);
    });

    return initSqlStatements.join('\n');
  }

  /**
   * Get all CSV files in the data directory
   */
  private getCsvFiles(): string[] {
    try {
      const files = fs.readdirSync(this.dataPath);
      return files.filter((file) => file.toLowerCase().endsWith('.csv'));
    } catch (error) {
      logger.error(`Error reading data directory: ${error}`);
      return [];
    }
  }

  /**
   * Convert CSV filename to table name
   * Example: RL_ACCT_BASE_AI.csv -> rl_acct_base_ai
   */
  private getTableNameFromFile(filename: string): string {
    return filename
      .replace(/\.csv$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Get DuckDB connection configuration for biu-agent
   * This can be used to create a wren project with DuckDB data source
   */
  public getDuckDbConnectionConfig() {
    return {
      type: 'DUCKDB' as const,
      displayName: 'BIU Agent Data',
      initSql: this.generateInitSql(),
      extensions: [], // Add any required DuckDB extensions here
      configurations: {}, // Add any DuckDB configuration options here
    };
  }
}
