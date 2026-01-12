import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getLogger } from '@server/utils';

const logger = getLogger('BiuAgentSqliteService');

export interface BiuAgentDatabaseConfig {
  customerDataPath: string; // Path to SQLite database files
  defaultDatabase?: string; // Optional default database name
}

export interface CustomerProfile {
  customerId: string;
  customerName: string;
  segment?: string;
  riskProfile?: string;
  cibilScore?: number;
  rmName?: string;
  rmCode?: string;
  branchName?: string;
  location?: string;
  phone?: string;
  panNumber?: string;
  customerSince?: string;
}

export interface FinancialSummary {
  totalCasaBalance: number;
  totalFdValue: number;
  totalRdValue: number;
  totalInvestmentValue: number;
  totalCreditLimit: number;
  totalCreditOutstanding: number;
  totalLoanOutstanding: number;
  accountCount: number;
}

export interface Activity {
  transactionDate: string;
  activityType: string;
  amount: number;
  status: string;
  description?: string;
}

export interface Account {
  accountType: string;
  accountNumber: string;
  balance: number;
  status: string;
}

export interface Product {
  productType: string;
  productName: string;
  status: string;
  openedDate?: string;
}

export interface CreditCardSummary {
  cardName: string;
  creditLimit: number;
  availableLimit: number;
  outstandingAmount: number;
  amountDue: number;
  rewardPoints: number;
  lastBilledAmount: number;
  utilizationPercentage: number;
}

export interface InvestmentData {
  investmentType: string;
  category: string;
  value: number;
  maturityDate?: string;
}

export class BiuAgentSqliteService {
  private customerDbPath: string;
  private defaultDatabase?: string;

  constructor(config: BiuAgentDatabaseConfig) {
    this.customerDbPath = config.customerDataPath;
    this.defaultDatabase = config.defaultDatabase;

    // Validate path exists
    if (!fs.existsSync(this.customerDbPath)) {
      logger.warn(`Database path does not exist: ${this.customerDbPath}`);
    }
  }

  /**
   * Get database connection for a specific customer
   * Supports multiple database naming conventions:
   * - {customerId}.db
   * - customer_{customerId}.db
   * - {customerId}_data.db
   */
  private getCustomerDatabase(customerId: string): Database.Database {
    const possibleNames = [
      `${customerId}.db`,
      `customer_${customerId}.db`,
      `${customerId}_data.db`,
      this.defaultDatabase || `${customerId}.db`,
    ];

    let dbPath: string | null = null;

    for (const name of possibleNames) {
      const fullPath = path.join(this.customerDbPath, name);
      if (fs.existsSync(fullPath)) {
        dbPath = fullPath;
        break;
      }
    }

    if (!dbPath) {
      throw new Error(
        `Database not found for customer: ${customerId}. ` +
          `Searched in: ${this.customerDbPath}`,
      );
    }

    try {
      const db = new Database(dbPath, { readonly: true });
      return db;
    } catch (_error) {
      logger.error(`Error opening database ${dbPath}: ${_error}`);
      throw new Error(`Failed to open database for customer ${customerId}`);
    }
  }

  /**
   * Execute a query against customer database
   */
  public async query<T = any>(
    customerId: string,
    sql: string,
    params: any[] = [],
  ): Promise<T[]> {
    const db = this.getCustomerDatabase(customerId);
    try {
      const stmt = db.prepare(sql);
      const results = stmt.all(...params) as T[];
      return results;
    } catch (error) {
      logger.error(`SQLite query error for customer ${customerId}: ${error}`);
      logger.error(`SQL: ${sql}`);
      logger.error(`Params: ${JSON.stringify(params)}`);
      throw error;
    } finally {
      db.close();
    }
  }

  /**
   * Execute a single-row query
   */
  public async queryOne<T = any>(
    customerId: string,
    sql: string,
    params: any[] = [],
  ): Promise<T | null> {
    const results = await this.query<T>(customerId, sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get customer profile data
   * Adapts to different possible table/column names
   */
  public async getCustomerProfile(
    customerId: string,
  ): Promise<CustomerProfile | null> {
    // Try different possible table/column name variations
    const queries = [
      // Standard format
      `
        SELECT 
          customer_id as customerId,
          customer_name as customerName,
          segment,
          risk_profile as riskProfile,
          cibil_score as cibilScore,
          rm_name as rmName,
          rm_code as rmCode,
          branch_name as branchName,
          location,
          phone,
          pan_number as panNumber,
          customer_since as customerSince
        FROM customers
        WHERE customer_id = ?
      `,
      // Alternative format
      `
        SELECT 
          id as customerId,
          name as customerName,
          segment,
          risk as riskProfile,
          cibil as cibilScore,
          rm as rmName,
          branch as branchName,
          city as location,
          phone_number as phone
        FROM customer
        WHERE id = ?
      `,
    ];

    for (const sql of queries) {
      try {
        const result = await this.queryOne<CustomerProfile>(customerId, sql, [
          customerId,
        ]);
        if (result) {
          return result;
        }
      } catch (_error) {
        // Try next query format
        continue;
      }
    }

    return null;
  }

  /**
   * Get financial summary
   */
  public async getFinancialSummary(
    customerId: string,
  ): Promise<FinancialSummary | null> {
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN account_type IN ('Savings', 'Current') THEN balance ELSE 0 END), 0) as totalCasaBalance,
        COALESCE(SUM(CASE WHEN account_type = 'FD' THEN balance ELSE 0 END), 0) as totalFdValue,
        COALESCE(SUM(CASE WHEN account_type = 'RD' THEN balance ELSE 0 END), 0) as totalRdValue,
        COALESCE(SUM(CASE WHEN account_type IN ('Investment', 'Demat') THEN balance ELSE 0 END), 0) as totalInvestmentValue,
        COALESCE(SUM(credit_limit), 0) as totalCreditLimit,
        COALESCE(SUM(credit_outstanding), 0) as totalCreditOutstanding,
        COALESCE(SUM(loan_outstanding), 0) as totalLoanOutstanding,
        COUNT(DISTINCT account_id) as accountCount
      FROM (
        SELECT account_id, account_type, balance, 0 as credit_limit, 0 as credit_outstanding, 0 as loan_outstanding
        FROM accounts
        WHERE customer_id = ?
        UNION ALL
        SELECT card_id as account_id, 'Credit Card' as account_type, 0 as balance, credit_limit, outstanding_amount as credit_outstanding, 0 as loan_outstanding
        FROM credit_cards
        WHERE customer_id = ?
        UNION ALL
        SELECT loan_id as account_id, loan_type as account_type, 0 as balance, 0 as credit_limit, 0 as credit_outstanding, outstanding_amount as loan_outstanding
        FROM loans
        WHERE customer_id = ?
      ) combined
    `;

    return this.queryOne<FinancialSummary>(customerId, sql, [
      customerId,
      customerId,
      customerId,
    ]);
  }

  /**
   * Get recent activity/transactions
   */
  public async getRecentActivity(
    customerId: string,
    limit: number = 10,
  ): Promise<Activity[]> {
    const sql = `
      SELECT 
        transaction_date as transactionDate,
        activity_type as activityType,
        amount,
        status,
        description
      FROM transactions
      WHERE customer_id = ?
      ORDER BY transaction_date DESC
      LIMIT ?
    `;

    return this.query<Activity>(customerId, sql, [customerId, limit]);
  }

  /**
   * Get account overview
   */
  public async getAccountOverview(customerId: string): Promise<Account[]> {
    const sql = `
      SELECT 
        account_type as accountType,
        account_number as accountNumber,
        balance,
        status
      FROM accounts
      WHERE customer_id = ?
      ORDER BY account_type, balance DESC
    `;

    return this.query<Account>(customerId, sql, [customerId]);
  }

  /**
   * Get product holdings
   */
  public async getProductHoldings(customerId: string): Promise<Product[]> {
    const sql = `
      SELECT 
        product_type as productType,
        product_name as productName,
        status,
        opened_date as openedDate
      FROM products
      WHERE customer_id = ?
      ORDER BY product_type
    `;

    return this.query<Product>(customerId, sql, [customerId]);
  }

  /**
   * Get credit card summary
   */
  public async getCreditCardSummary(
    customerId: string,
  ): Promise<CreditCardSummary | null> {
    const sql = `
      SELECT 
        card_name as cardName,
        SUM(credit_limit) as creditLimit,
        SUM(available_limit) as availableLimit,
        SUM(outstanding_amount) as outstandingAmount,
        SUM(amount_due) as amountDue,
        SUM(reward_points) as rewardPoints,
        MAX(last_billed_amount) as lastBilledAmount,
        CASE 
          WHEN SUM(credit_limit) > 0 
          THEN (SUM(outstanding_amount) / SUM(credit_limit)) * 100
          ELSE 0 
        END as utilizationPercentage
      FROM credit_cards
      WHERE customer_id = ?
      GROUP BY card_name
      LIMIT 1
    `;

    return this.queryOne<CreditCardSummary>(customerId, sql, [customerId]);
  }

  /**
   * Get investment data
   */
  public async getInvestmentData(
    customerId: string,
  ): Promise<InvestmentData[]> {
    const sql = `
      SELECT 
        investment_type as investmentType,
        category,
        value,
        maturity_date as maturityDate
      FROM investments
      WHERE customer_id = ?
      ORDER BY investment_type
    `;

    return this.query<InvestmentData>(customerId, sql, [customerId]);
  }

  /**
   * Get all customer IDs (for search/autocomplete)
   */
  public async getAllCustomerIds(): Promise<string[]> {
    // Try to find customer IDs from database files
    const files = fs.readdirSync(this.customerDbPath);
    const customerIds: string[] = [];

    for (const file of files) {
      if (file.endsWith('.db')) {
        // Extract customer ID from filename
        const match = file.match(/(\d+)\.db$/);
        if (match) {
          customerIds.push(match[1]);
        }
      }
    }

    return customerIds;
  }

  /**
   * Search customers by name or ID
   */
  public async searchCustomers(searchTerm: string): Promise<CustomerProfile[]> {
    const customerIds = await this.getAllCustomerIds();
    const results: CustomerProfile[] = [];

    for (const customerId of customerIds) {
      try {
        const profile = await this.getCustomerProfile(customerId);
        if (profile) {
          const searchLower = searchTerm.toLowerCase();
          if (
            profile.customerId?.toLowerCase().includes(searchLower) ||
            profile.customerName?.toLowerCase().includes(searchLower)
          ) {
            results.push(profile);
          }
        }
      } catch (_error) {
        // Skip customers with errors
        continue;
      }
    }

    return results.slice(0, 10); // Limit to 10 results
  }
}
