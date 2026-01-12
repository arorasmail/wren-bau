import { getLogger } from '@server/utils';
import {
  IProjectRepository,
  IModelRepository,
  IModelColumnRepository,
  Model,
  ModelColumn,
} from '../repositories';
import { Project } from '../repositories';
import { BiuAgentMdlService } from './biuAgentMdlService';
import { IDeployService } from './deployService';
import { IModelService } from './modelService';
import { Manifest } from '../mdl/type';
import { DataSourceName } from '../types';
import { replaceInvalidReferenceName } from '../utils/model';

const logger = getLogger('BiuAgentProjectService');
logger.level = 'debug';

export interface BiuAgentProjectConfig {
  projectName: string;
  databasePath: string;
  customerId?: string; // Optional customer ID for customer-specific setup
}

/**
 * Service for managing biu-agent projects with MDL integration
 * Phase 2: MDL Semantic Layer Integration
 */
export class BiuAgentProjectService {
  private projectRepository: IProjectRepository;
  private modelRepository: IModelRepository;
  private modelColumnRepository: IModelColumnRepository;
  private mdlService: BiuAgentMdlService;
  private deployService: IDeployService;
  private modelService: IModelService;

  constructor({
    projectRepository,
    modelRepository,
    modelColumnRepository,
    deployService,
    modelService,
  }: {
    projectRepository: IProjectRepository;
    modelRepository: IModelRepository;
    modelColumnRepository: IModelColumnRepository;
    deployService: IDeployService;
    modelService: IModelService;
  }) {
    this.projectRepository = projectRepository;
    this.modelRepository = modelRepository;
    this.modelColumnRepository = modelColumnRepository;
    this.mdlService = new BiuAgentMdlService();
    this.deployService = deployService;
    this.modelService = modelService;
  }

  /**
   * Initialize biu-agent project with MDL models
   * This creates a wren-ui project that models biu-agent's database schema
   */
  public async initializeBiuAgentProject(
    config: BiuAgentProjectConfig,
  ): Promise<Project> {
    try {
      logger.info(
        `Initializing biu-agent project: ${config.projectName} with database: ${config.databasePath}`,
      );

      // 1. Generate MDL manifest
      const manifest = this.mdlService.generateCompleteMDL();

      // 2. Create project in database
      // Note: This assumes SQLite data source support
      // You may need to adapt based on actual wren-ui data source support
      const projectData = {
        displayName: config.projectName,
        type: DataSourceName.DUCKDB, // Using DuckDB as proxy for SQLite, or create SQLite support
        catalog: 'wrenai',
        schema: 'public',
        connectionInfo: {
          databasePath: config.databasePath,
          customerId: config.customerId,
        } as any,
      };

      // Create project using project repository
      // Using createOne method from IBasicRepository interface
      const project = await this.projectRepository.createOne(projectData);

      // 3. Create models from MDL
      // This would use ModelService to create models, columns, and relations
      // Implementation depends on wren-ui's model creation API
      await this.createModelsFromMDL(project.id, manifest);

      // 4. Deploy MDL
      await this.deployService.deploy(manifest, project.id);

      logger.info(`Successfully initialized biu-agent project: ${project.id}`);

      return project;
    } catch (error) {
      logger.error(`Error initializing biu-agent project: ${error}`);
      throw error;
    }
  }

  /**
   * Create models from MDL manifest
   * This converts MDL models into wren-ui's model structure
   */
  private async createModelsFromMDL(
    projectId: number,
    manifest: Manifest,
  ): Promise<void> {
    if (!manifest.models) {
      return;
    }

    for (const modelMDL of manifest.models) {
      try {
        // Create model using repository
        const modelValue = {
          projectId,
          displayName: modelMDL.properties?.displayName || modelMDL.name,
          referenceName: replaceInvalidReferenceName(modelMDL.name),
          sourceTableName:
            modelMDL.tableReference?.table || modelMDL.name.toLowerCase(),
          refSql: modelMDL.refSql || null,
          cached: modelMDL.cached || false,
          refreshTime: modelMDL.refreshTime || null,
          properties: modelMDL.properties
            ? JSON.stringify(modelMDL.properties)
            : null,
        } as Partial<Model>;
        const model = await this.modelRepository.createOne(modelValue);

        // Create columns
        if (modelMDL.columns) {
          const columnValues: Partial<ModelColumn>[] = [];
          for (const columnMDL of modelMDL.columns) {
            if (!columnMDL.isCalculated) {
              // Regular column
              columnValues.push({
                modelId: model.id,
                isCalculated: false,
                displayName:
                  columnMDL.properties?.displayName || columnMDL.name,
                referenceName: columnMDL.name,
                sourceColumnName: columnMDL.name,
                type: columnMDL.type || 'VARCHAR',
                notNull: columnMDL.notNull || false,
                isPk: modelMDL.primaryKey === columnMDL.name,
                properties: columnMDL.properties
                  ? JSON.stringify(columnMDL.properties)
                  : null,
              });
            }
            // Note: Calculated fields with SQL expressions are not supported here
            // as createCalculatedField requires ExpressionName enum, not SQL strings
            // These would need to be handled separately or converted to ExpressionName format
          }
          if (columnValues.length > 0) {
            await this.modelColumnRepository.createMany(columnValues);
          }
        }

        // Create relations
        if (manifest.relationships) {
          for (const relationMDL of manifest.relationships) {
            if (relationMDL.models?.includes(modelMDL.name)) {
              // This model is part of this relation
              // Create relation using ModelService
              // Implementation depends on wren-ui's relation creation API
            }
          }
        }
      } catch (error) {
        logger.error(`Error creating model ${modelMDL.name}: ${error}`);
        // Continue with other models
      }
    }
  }

  /**
   * Get MDL manifest for biu-agent schema
   */
  public getMDLManifest(): Manifest {
    return this.mdlService.generateCompleteMDL();
  }

  /**
   * Update MDL models (when schema changes)
   */
  public async updateBiuAgentModels(
    projectId: number,
    updatedManifest: Manifest,
  ): Promise<void> {
    // Recreate models with updated MDL
    await this.createModelsFromMDL(projectId, updatedManifest);

    // Redeploy
    await this.deployService.deploy(updatedManifest, projectId);
  }
}
