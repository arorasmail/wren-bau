import fs from 'fs';
import path from 'path';
import { getLogger } from '@server/utils';

const logger = getLogger('BiuAgentCsvService');

export interface BiuAgentCsvConfig {
  dataPath: string; // Path to CSV data files
}

export interface CustomerProfile {
  customerId: string;
  customerName: string;
  segment?: string | null;
  riskProfile?: string | null;
  cibilScore?: number | null;
  rmName?: string | null;
  rmCode?: string | null;
  branchName?: string | null;
  location?: string | null;
  phone?: string | null;
  panNumber?: string | null;
  customerSince?: string | null;
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
  description?: string | null;
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
  openedDate?: string | null;
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
  maturityDate?: string | null;
}

interface CsvRow {
  [key: string]: string | number | null;
}

export class BiuAgentCsvService {
  private dataPath: string;
  private csvCache: Map<string, CsvRow[]> = new Map();

  constructor(config: BiuAgentCsvConfig) {
    this.dataPath = config.dataPath;

    if (!fs.existsSync(this.dataPath)) {
      logger.warn(`Data path does not exist: ${this.dataPath}`);
    }
  }

  /**
   * Simple CSV parser (no external dependencies)
   */
  private parseCsv(content: string): CsvRow[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const records: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length !== headers.length) continue;

      const record: CsvRow = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        // Try to convert to number if possible
        const numValue = Number(value);
        record[header] = value === '' || isNaN(numValue) ? value : numValue;
      });
      records.push(record);
    }

    return records;
  }

  /**
   * Parse CSV line handling quoted values and NULL
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Convert NULL to empty string
        values.push(current.trim() === 'NULL' ? '' : current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // Add last value
    values.push(current.trim() === 'NULL' ? '' : current.trim());
    return values;
  }

  /**
   * Load and cache CSV file
   */
  private loadCsv(fileName: string): CsvRow[] {
    if (this.csvCache.has(fileName)) {
      return this.csvCache.get(fileName)!;
    }

    const filePath = path.join(this.dataPath, fileName);
    logger.debug(`Attempting to load CSV file: ${filePath}`);

    if (!fs.existsSync(this.dataPath)) {
      logger.error(`Data path does not exist: ${this.dataPath}`);
      logger.error(`Current working directory: ${process.cwd()}`);
      return [];
    }

    if (!fs.existsSync(filePath)) {
      logger.warn(`CSV file not found: ${filePath}`);
      logger.warn(
        `Available files in ${this.dataPath}: ${fs.readdirSync(this.dataPath).join(', ')}`,
      );
      return [];
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = this.parseCsv(fileContent);

      this.csvCache.set(fileName, records);
      logger.info(`Loaded ${records.length} records from ${fileName}`);
      return records;
    } catch (error) {
      logger.error(`Error loading CSV file ${fileName}: ${error}`);
      logger.error(
        `Error stack: ${error instanceof Error ? error.stack : 'No stack'}`,
      );
      return [];
    }
  }

  /**
   * Get customer profile from account base CSV
   */
  public async getCustomerProfile(
    customerId: string,
  ): Promise<CustomerProfile | null> {
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const customerAccount = accounts.find(
      (row) => String(row.COD_CUST) === String(customerId),
    );

    if (!customerAccount) {
      return null;
    }

    // Get unique customer info (first account record)
    return {
      customerId: String(customerAccount.COD_CUST || customerId),
      customerName: String(customerAccount.NAM_CUST_FULL || ''),
      segment: customerAccount.HNW_CATEGORY
        ? String(customerAccount.HNW_CATEGORY)
        : null,
      riskProfile: customerAccount.RISK_PROFILE
        ? String(customerAccount.RISK_PROFILE)
        : null,
      cibilScore: customerAccount.CIBIL_SCORE
        ? Number(customerAccount.CIBIL_SCORE)
        : null,
      rmName: customerAccount.RM_NAME ? String(customerAccount.RM_NAME) : null,
      rmCode: customerAccount.RM_EMP_CODE
        ? String(customerAccount.RM_EMP_CODE)
        : null,
      branchName: customerAccount.BRANCH_NAME
        ? String(customerAccount.BRANCH_NAME)
        : null,
      location: customerAccount.GEOGRAPHICAL_STATE
        ? String(customerAccount.GEOGRAPHICAL_STATE)
        : null,
      panNumber: customerAccount.PAN_NUMBER
        ? String(customerAccount.PAN_NUMBER)
        : null,
    };
  }

  /**
   * Get financial summary
   */
  public async getFinancialSummary(
    customerId: string,
  ): Promise<FinancialSummary | null> {
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const creditCards = this.loadCsv('RL_CC_BASE_AI.csv');
    const productHoldings = this.loadCsv('RL_PRODUCT_HOLDING_AI.csv');

    const customerAccounts = accounts.filter(
      (row) => String(row.COD_CUST) === String(customerId),
    );
    const customerCards = creditCards.filter(
      (row) => String(row.CUST) === String(customerId),
    );
    const customerProducts = productHoldings.filter(
      (row) => String(row.cod_cust) === String(customerId),
    );

    let totalCasaBalance = 0;
    let totalFdValue = 0;
    let totalRdValue = 0;
    let totalInvestmentValue = 0;
    let totalCreditLimit = 0;
    let totalCreditOutstanding = 0;
    let accountCount = 0;

    // Calculate from accounts
    for (const account of customerAccounts) {
      const balance = Number(account.EOP || 0);
      const productType = String(account.PRODUCT_TYPE || '').toUpperCase();

      if (
        productType === 'SAVINGS' ||
        productType === 'CURRENT' ||
        productType === 'SALARY'
      ) {
        totalCasaBalance += balance;
        accountCount++;
      } else if (productType === 'FD' || productType === 'TD') {
        totalFdValue += balance;
        accountCount++;
      } else if (productType === 'RD') {
        totalRdValue += balance;
        accountCount++;
      }
    }

    // Calculate from credit cards
    for (const card of customerCards) {
      totalCreditLimit += Number(card.CRLIM || 0);
      totalCreditOutstanding += Number(card.CURBAL || 0);
    }

    // Calculate investments from product holdings
    for (const product of customerProducts) {
      const value = Number(
        product.CE_ASSET_COUNT || product.CV_ASSET_COUNT || 0,
      );
      if (value > 0) {
        totalInvestmentValue += value;
      }
    }

    return {
      totalCasaBalance,
      totalFdValue,
      totalRdValue,
      totalInvestmentValue,
      totalCreditLimit,
      totalCreditOutstanding,
      totalLoanOutstanding: 0, // Not available in CSV
      accountCount,
    };
  }

  /**
   * Get recent activity/transactions
   */
  public async getRecentActivity(
    customerId: string,
    limit: number = 10,
  ): Promise<Activity[]> {
    const transactions = this.loadCsv('RL_TXN_BASE_AI.csv');
    const customerTransactions = transactions
      .filter((row) => String(row.COD_CUST) === String(customerId))
      .slice(0, limit)
      .map((row) => ({
        transactionDate: String(row.DAT_POST || ''),
        activityType: String(row.COD_DRCR || '') === 'D' ? 'Debit' : 'Credit',
        amount: Math.abs(Number(row.TXN_AMT || 0)),
        status: 'Completed',
        description: String(row.TXT_TXN_DESC || ''),
      }));

    return customerTransactions;
  }

  /**
   * Get account overview
   */
  public async getAccountOverview(customerId: string): Promise<Account[]> {
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const customerAccounts = accounts
      .filter((row) => String(row.COD_CUST) === String(customerId))
      .map((row) => ({
        accountType: String(row.PRODUCT_TYPE || ''),
        accountNumber: String(row.COD_ACCT_NO || ''),
        balance: Number(row.EOP || 0),
        status: Number(row.SYSTEM_FLAG || 0) === 0 ? 'Active' : 'Inactive',
      }));

    return customerAccounts;
  }

  /**
   * Get product holdings
   */
  public async getProductHoldings(customerId: string): Promise<Product[]> {
    const productHoldings = this.loadCsv('RL_PRODUCT_HOLDING_AI.csv');
    const customerProducts = productHoldings
      .filter((row) => String(row.cod_cust) === String(customerId))
      .map((row) => ({
        productType: 'Product',
        productName: 'Holding',
        status: String(row.ACTIVE_FLAG || 'N') === 'Y' ? 'Active' : 'Inactive',
        openedDate: null,
      }));

    // Also get from accounts
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const customerAccounts = accounts
      .filter((row) => String(row.COD_CUST) === String(customerId))
      .map((row) => ({
        productType: String(row.PRODUCT_TYPE || ''),
        productName: String(row.NAME_PRODUCT || ''),
        status: Number(row.SYSTEM_FLAG || 0) === 0 ? 'Active' : 'Inactive',
        openedDate: null,
      }));

    return [...customerProducts, ...customerAccounts];
  }

  /**
   * Get credit card summary
   */
  public async getCreditCardSummary(
    customerId: string,
  ): Promise<CreditCardSummary | null> {
    const creditCards = this.loadCsv('RL_CC_BASE_AI.csv');
    const customerCards = creditCards.filter(
      (row) => String(row.CUST) === String(customerId),
    );

    if (customerCards.length === 0) {
      return null;
    }

    // Use first card or aggregate
    const firstCard = customerCards[0];
    const creditLimit = Number(firstCard.CRLIM || 0);
    const currentBalance = Number(firstCard.CURBAL || 0);
    const availableLimit = creditLimit - currentBalance;
    const utilizationPercentage =
      creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

    return {
      cardName: String(firstCard.DESCR || 'Credit Card'),
      creditLimit,
      availableLimit,
      outstandingAmount: currentBalance,
      amountDue: Number(firstCard.CURR_DUE || 0),
      rewardPoints: 0, // Not available in CSV
      lastBilledAmount: Number(firstCard.PMT_LAST_AMT || 0),
      utilizationPercentage,
    };
  }

  /**
   * Get investment data
   */
  public async getInvestmentData(
    customerId: string,
  ): Promise<InvestmentData[]> {
    const productHoldings = this.loadCsv('RL_PRODUCT_HOLDING_AI.csv');
    const customerProducts = productHoldings
      .filter((row) => String(row.cod_cust) === String(customerId))
      .map((row) => ({
        investmentType: 'Investment',
        category: 'Product Holding',
        value: Number(row.CE_ASSET_COUNT || row.CV_ASSET_COUNT || 0),
        maturityDate: null,
      }));

    return customerProducts.filter((inv) => inv.value > 0);
  }

  /**
   * Get all customer IDs
   */
  public async getAllCustomerIds(): Promise<string[]> {
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const customerIds = new Set<string>();

    for (const row of accounts) {
      if (row.COD_CUST) {
        customerIds.add(String(row.COD_CUST));
      }
    }

    return Array.from(customerIds).sort();
  }

  /**
   * Search customers
   */
  public async searchCustomers(searchTerm: string): Promise<CustomerProfile[]> {
    const accounts = this.loadCsv('RL_ACCT_BASE_AI.csv');
    const searchLower = searchTerm.toLowerCase();
    const results: CustomerProfile[] = [];

    for (const row of accounts) {
      const customerId = String(row.COD_CUST || '');
      const customerName = String(row.NAM_CUST_FULL || '').toLowerCase();

      if (
        customerId.toLowerCase().includes(searchLower) ||
        customerName.includes(searchLower)
      ) {
        const profile = await this.getCustomerProfile(customerId);
        if (profile) {
          results.push(profile);
        }
      }

      if (results.length >= 10) {
        break;
      }
    }

    return results;
  }
}
