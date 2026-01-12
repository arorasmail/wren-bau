import { getLogger } from '@server/utils';
import { BiuAgentDuckDbService } from './biuAgentDuckDbService';
import { ProjectService } from './projectService';
import { IProjectRepository } from '../repositories';
import { DataSourceName } from '../types';
import { encryptConnectionInfo } from '../dataSource';

const logger = getLogger('BiuAgentWrenIntegrationService');

/**
 * Service to integrate biu-agent with wren's standard connection infrastructure
 * This replaces the need for separate CSV/SQL connections by using wren's DuckDB support
 */
export class BiuAgentWrenIntegrationService {
  private duckDbService: BiuAgentDuckDbService;
  private projectService: ProjectService;

  constructor(
    dataPath: string,
    projectService: ProjectService,
  ) {
    this.duckDbService = new BiuAgentDuckDbService({ dataPath });
    this.projectService = projectService;
  }

  /**
   * Initialize biu-agent as a wren project using DuckDB
   * This creates a standard wren project that can leverage all wren features:
   * - Text-to-SQL queries
   * - MDL modeling
   * - Standard GraphQL queries
   * - Dashboard creation
   */
  public async initializeBiuAgentProject(displayName: string = 'BIU Agent') {
    try {
      logger.info('Initializing biu-agent project with DuckDB connection');

      // Generate DuckDB initSql from CSV files
      const initSql = this.duckDbService.generateInitSql();
      logger.debug(`Generated initSql with ${initSql.split('\n').length} statements`);

      // Create wren project with DuckDB data source
      const project = await this.projectService.createProject({
        displayName,
        type: DataSourceName.DUCKDB,
        connectionInfo: {
          initSql,
          extensions: [],
          configurations: {},
        },
      });

      logger.info(`Successfully created biu-agent project: ${project.id}`);
      return project;
    } catch (error) {
      logger.error(`Error initializing biu-agent project: ${error}`);
      throw error;
    }
  }

  /**
   * Get the initSql for manual project creation
   * Useful if you want to create the project through the UI
   */
  public getInitSql(): string {
    return this.duckDbService.generateInitSql();
  }

  /**
   * Get DuckDB connection configuration
   * This can be used with wren's standard data source setup
   */
  public getConnectionConfig() {
    return this.duckDbService.getDuckDbConnectionConfig();
  }
}

