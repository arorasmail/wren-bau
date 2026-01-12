import { getLogger } from '@server/utils';
import { IQueryService, IMDLService, IProjectService } from '@server/services';
import { IContext } from '../types';

const logger = getLogger('BiuAgentWrenQueryService');

/**
 * Service to query biu-agent data using wren's existing project database connection
 * This service leverages wren's QueryService to execute SQL queries against
 * the current wren project's database, eliminating the need for separate connections
 */
export class BiuAgentWrenQueryService {
  private queryService: IQueryService;
  private projectService: IProjectService;
  private mdlService: IMDLService;

  constructor(ctx: IContext) {
    this.queryService = ctx.queryService;
    this.projectService = ctx.projectService;
    this.mdlService = ctx.mdlService;
  }

  /**
   * Execute a SQL query against the current wren project's database
   */
  public async executeQuery<T = any>(
    sql: string,
    limit: number = 100,
  ): Promise<T[]> {
    try {
      // Get current wren project
      const project = await this.projectService.getCurrentProject();

      // Get MDL manifest for the current project
      const { manifest } = await this.mdlService.makeCurrentModelMDL();

      logger.debug(
        `Executing query against project: ${project.id}, type: ${project.type}`,
      );
      logger.debug(`SQL: ${sql}`);

      // Use wren's QueryService to execute the query
      const result = await this.queryService.preview(sql, {
        project,
        manifest,
        limit,
        dryRun: false,
        refresh: false,
        cacheEnabled: false,
      });

      // Transform result to array of objects
      if (
        result &&
        typeof result === 'object' &&
        'data' in result &&
        'columns' in result
      ) {
        const columns = result.columns.map((col: any) => col.name || col);
        const data = result.data || [];

        return data.map((row: any[]) => {
          const obj: any = {};
          columns.forEach((col: string, index: number) => {
            obj[col] = row[index];
          });
          return obj as T;
        });
      }

      return [];
    } catch (error) {
      logger.error(`Error executing query: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a query and return a single row
   */
  public async executeQueryOne<T = any>(sql: string): Promise<T | null> {
    const results = await this.executeQuery<T>(sql, 1);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get customer profile using wren's database connection
   */
  public async getCustomerProfile(customerId: string) {
    // Adjust SQL based on your actual table structure
    // This assumes you have a customers table in your wren project
    // Note: Using parameterized queries would be ideal, but wren's QueryService
    // expects raw SQL. The customerId should be validated before calling this method.
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        customer_id as "customerId",
        customer_name as "customerName",
        segment,
        risk_profile as "riskProfile",
        cibil_score as "cibilScore",
        rm_name as "rmName",
        rm_code as "rmCode",
        branch_name as "branchName",
        location,
        phone,
        pan_number as "panNumber",
        customer_since as "customerSince"
      FROM customers
      WHERE customer_id = '${escapedCustomerId}'
      LIMIT 1
    `;
    return this.executeQueryOne(sql);
  }

  /**
   * Get financial summary using wren's database connection
   */
  public async getFinancialSummary(customerId: string) {
    // Adjust SQL based on your actual table structure
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN account_type IN ('Savings', 'Current') THEN balance ELSE 0 END), 0) as "totalCasaBalance",
        COALESCE(SUM(CASE WHEN account_type = 'FD' THEN balance ELSE 0 END), 0) as "totalFdValue",
        COALESCE(SUM(CASE WHEN account_type = 'RD' THEN balance ELSE 0 END), 0) as "totalRdValue",
        COALESCE(SUM(investment_value), 0) as "totalInvestmentValue",
        COALESCE(SUM(credit_limit), 0) as "totalCreditLimit",
        COALESCE(SUM(credit_outstanding), 0) as "totalCreditOutstanding",
        COALESCE(SUM(loan_outstanding), 0) as "totalLoanOutstanding",
        COUNT(DISTINCT account_id) as "accountCount"
      FROM accounts
      WHERE customer_id = '${escapedCustomerId}'
    `;
    return this.executeQueryOne(sql);
  }

  /**
   * Get recent activity using wren's database connection
   */
  public async getRecentActivity(customerId: string, limit: number = 10) {
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const safeLimit = Math.min(Math.max(1, limit), 100); // Ensure limit is between 1 and 100
    const sql = `
      SELECT 
        transaction_date as "transactionDate",
        activity_type as "activityType",
        amount,
        status,
        description
      FROM transactions
      WHERE customer_id = '${escapedCustomerId}'
      ORDER BY transaction_date DESC
      LIMIT ${safeLimit}
    `;
    return this.executeQuery(sql, safeLimit);
  }

  /**
   * Get account overview using wren's database connection
   */
  public async getAccountOverview(customerId: string) {
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        account_type as "accountType",
        account_number as "accountNumber",
        balance,
        status
      FROM accounts
      WHERE customer_id = '${escapedCustomerId}'
      ORDER BY account_type
    `;
    return this.executeQuery(sql);
  }

  /**
   * Get product holdings using wren's database connection
   */
  public async getProductHoldings(customerId: string) {
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        product_type as "productType",
        product_name as "productName",
        status,
        opened_date as "openedDate"
      FROM products
      WHERE customer_id = '${escapedCustomerId}'
    `;
    return this.executeQuery(sql);
  }

  /**
   * Get credit card summary using wren's database connection
   */
  public async getCreditCardSummary(customerId: string) {
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        card_name as "cardName",
        credit_limit as "creditLimit",
        available_limit as "availableLimit",
        outstanding_amount as "outstandingAmount",
        amount_due as "amountDue",
        reward_points as "rewardPoints",
        last_billed_amount as "lastBilledAmount",
        utilization_percentage as "utilizationPercentage"
      FROM credit_cards
      WHERE customer_id = '${escapedCustomerId}'
    `;
    return this.executeQuery(sql);
  }

  /**
   * Get investment data using wren's database connection
   */
  public async getInvestmentData(customerId: string) {
    const escapedCustomerId = customerId.replace(/'/g, "''");
    const sql = `
      SELECT 
        investment_type as "investmentType",
        category,
        value,
        maturity_date as "maturityDate"
      FROM investments
      WHERE customer_id = '${escapedCustomerId}'
    `;
    return this.executeQuery(sql);
  }

  /**
   * Search customers using wren's database connection
   */
  public async searchCustomers(searchTerm: string) {
    const escapedSearchTerm = searchTerm
      .replace(/'/g, "''")
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    const sql = `
      SELECT 
        customer_id as "customerId",
        customer_name as "customerName",
        segment,
        location,
        phone
      FROM customers
      WHERE 
        customer_id ILIKE '%${escapedSearchTerm}%' OR
        customer_name ILIKE '%${escapedSearchTerm}%' OR
        phone ILIKE '%${escapedSearchTerm}%'
      LIMIT 50
    `;
    return this.executeQuery(sql, 50);
  }

  /**
   * Get all customer IDs using wren's database connection
   */
  public async getAllCustomerIds(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT customer_id as "customerId"
      FROM customers
      ORDER BY customer_id
    `;
    const results = await this.executeQuery<{ customerId: string }>(sql);
    return results.map((r) => r.customerId);
  }
}
