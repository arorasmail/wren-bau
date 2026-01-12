import { ModelMDL, ColumnMDL, RelationMDL, Manifest } from '../mdl/type';

/**
 * Generate MDL models for biu-agent database schema
 * Phase 2: MDL Semantic Layer Integration
 */
export class BiuAgentMdlService {
  /**
   * Generate MDL manifest for biu-agent schema
   */
  public generateMDLManifest(): {
    models: ModelMDL[];
    relations: RelationMDL[];
  } {
    const models: ModelMDL[] = [
      {
        name: 'CustomersModel',
        tableReference: {
          schema: 'main',
          table: 'customers',
        },
        columns: [
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique customer identifier',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'customer_name',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Full name of the customer',
              displayName: 'Customer Name',
            },
          },
          {
            name: 'segment',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Customer segment (e.g., HNW, Imperia, Premium)',
              displayName: 'Segment',
            },
          },
          {
            name: 'risk_profile',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Risk assessment level (Low, Medium, High)',
              displayName: 'Risk Profile',
            },
          },
          {
            name: 'cibil_score',
            type: 'INTEGER',
            isCalculated: false,
            properties: {
              description: 'CIBIL credit score (300-900)',
              displayName: 'CIBIL Score',
            },
          },
          {
            name: 'rm_name',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Relationship Manager name',
              displayName: 'RM Name',
            },
          },
          {
            name: 'rm_code',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Relationship Manager employee code',
              displayName: 'RM Code',
            },
          },
          {
            name: 'branch_name',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Branch name where customer is serviced',
              displayName: 'Branch Name',
            },
          },
          {
            name: 'location',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Customer location/city',
              displayName: 'Location',
            },
          },
          {
            name: 'phone',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Customer phone number',
              displayName: 'Phone',
            },
          },
          {
            name: 'pan_number',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'PAN number (masked in display)',
              displayName: 'PAN Number',
            },
          },
          {
            name: 'customer_since',
            type: 'DATE',
            isCalculated: false,
            properties: {
              description: 'Date when customer first opened account',
              displayName: 'Customer Since',
            },
          },
        ],
        primaryKey: 'customer_id',
        cached: false,
        properties: {
          displayName: 'Customers',
          description:
            'Customer master data including profile and relationship information',
        },
      },
      {
        name: 'AccountsModel',
        tableReference: {
          schema: 'main',
          table: 'accounts',
        },
        columns: [
          {
            name: 'account_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique account identifier',
              displayName: 'Account ID',
            },
          },
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Reference to customer',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'account_type',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Type of account (Savings, Current, FD, RD)',
              displayName: 'Account Type',
            },
          },
          {
            name: 'account_number',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Masked account number',
              displayName: 'Account Number',
            },
          },
          {
            name: 'balance',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Current account balance',
              displayName: 'Balance',
            },
          },
          {
            name: 'status',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Account status (Active, Blocked, Closed)',
              displayName: 'Status',
            },
          },
        ],
        primaryKey: 'account_id',
        cached: false,
        properties: {
          displayName: 'Accounts',
          description:
            'Customer account information including balances and status',
        },
      },
      {
        name: 'TransactionsModel',
        tableReference: {
          schema: 'main',
          table: 'transactions',
        },
        columns: [
          {
            name: 'transaction_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique transaction identifier',
              displayName: 'Transaction ID',
            },
          },
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Reference to customer',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'transaction_date',
            type: 'DATE',
            isCalculated: false,
            properties: {
              description: 'Date of transaction',
              displayName: 'Transaction Date',
            },
          },
          {
            name: 'activity_type',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Type of activity (Debit, Credit, Transfer)',
              displayName: 'Activity Type',
            },
          },
          {
            name: 'amount',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Transaction amount',
              displayName: 'Amount',
            },
          },
          {
            name: 'status',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Transaction status (Completed, Pending, Failed)',
              displayName: 'Status',
            },
          },
          {
            name: 'description',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Transaction description',
              displayName: 'Description',
            },
          },
        ],
        primaryKey: 'transaction_id',
        cached: false,
        properties: {
          displayName: 'Transactions',
          description: 'Customer transaction history',
        },
      },
      {
        name: 'CreditCardsModel',
        tableReference: {
          schema: 'main',
          table: 'credit_cards',
        },
        columns: [
          {
            name: 'card_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique credit card identifier',
              displayName: 'Card ID',
            },
          },
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Reference to customer',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'card_name',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Credit card product name',
              displayName: 'Card Name',
            },
          },
          {
            name: 'credit_limit',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Total credit limit',
              displayName: 'Credit Limit',
            },
          },
          {
            name: 'available_limit',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Available credit limit',
              displayName: 'Available Limit',
            },
          },
          {
            name: 'outstanding_amount',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Outstanding balance',
              displayName: 'Outstanding Amount',
            },
          },
          {
            name: 'amount_due',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Amount due for payment',
              displayName: 'Amount Due',
            },
          },
          {
            name: 'reward_points',
            type: 'INTEGER',
            isCalculated: false,
            properties: {
              description: 'Accumulated reward points',
              displayName: 'Reward Points',
            },
          },
          {
            name: 'last_billed_amount',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Last billed amount',
              displayName: 'Last Billed Amount',
            },
          },
          {
            name: 'utilization_percentage',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Credit utilization percentage',
              displayName: 'Utilization %',
            },
          },
        ],
        primaryKey: 'card_id',
        cached: false,
        properties: {
          displayName: 'Credit Cards',
          description: 'Credit card information and utilization',
        },
      },
      {
        name: 'ProductsModel',
        tableReference: {
          schema: 'main',
          table: 'products',
        },
        columns: [
          {
            name: 'product_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique product identifier',
              displayName: 'Product ID',
            },
          },
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Reference to customer',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'product_type',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Type of product (Savings, Credit Card, Loan, etc.)',
              displayName: 'Product Type',
            },
          },
          {
            name: 'product_name',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Product name',
              displayName: 'Product Name',
            },
          },
          {
            name: 'status',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Product status (Active, Inactive)',
              displayName: 'Status',
            },
          },
          {
            name: 'opened_date',
            type: 'DATE',
            isCalculated: false,
            properties: {
              description: 'Date when product was opened',
              displayName: 'Opened Date',
            },
          },
        ],
        primaryKey: 'product_id',
        cached: false,
        properties: {
          displayName: 'Products',
          description: 'Customer product holdings',
        },
      },
      {
        name: 'InvestmentsModel',
        tableReference: {
          schema: 'main',
          table: 'investments',
        },
        columns: [
          {
            name: 'investment_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Unique investment identifier',
              displayName: 'Investment ID',
            },
          },
          {
            name: 'customer_id',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Reference to customer',
              displayName: 'Customer ID',
            },
          },
          {
            name: 'investment_type',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Type of investment (FD, RD, Mutual Fund, etc.)',
              displayName: 'Investment Type',
            },
          },
          {
            name: 'category',
            type: 'VARCHAR',
            isCalculated: false,
            properties: {
              description: 'Investment category',
              displayName: 'Category',
            },
          },
          {
            name: 'value',
            type: 'DECIMAL',
            isCalculated: false,
            properties: {
              description: 'Current investment value',
              displayName: 'Value',
            },
          },
          {
            name: 'maturity_date',
            type: 'DATE',
            isCalculated: false,
            properties: {
              description: 'Investment maturity date',
              displayName: 'Maturity Date',
            },
          },
        ],
        primaryKey: 'investment_id',
        cached: false,
        properties: {
          displayName: 'Investments',
          description: 'Customer investment portfolio',
        },
      },
    ];

    const relations: RelationMDL[] = [
      {
        name: 'AccountsToCustomers',
        models: ['AccountsModel', 'CustomersModel'],
        joinType: 'MANY_TO_ONE',
        condition: 'AccountsModel.customer_id = CustomersModel.customer_id',
        properties: {
          description:
            'Relationship between accounts and customers (many accounts per customer)',
        },
      },
      {
        name: 'TransactionsToCustomers',
        models: ['TransactionsModel', 'CustomersModel'],
        joinType: 'MANY_TO_ONE',
        condition: 'TransactionsModel.customer_id = CustomersModel.customer_id',
        properties: {
          description:
            'Relationship between transactions and customers (many transactions per customer)',
        },
      },
      {
        name: 'CreditCardsToCustomers',
        models: ['CreditCardsModel', 'CustomersModel'],
        joinType: 'MANY_TO_ONE',
        condition: 'CreditCardsModel.customer_id = CustomersModel.customer_id',
        properties: {
          description:
            'Relationship between credit cards and customers (many cards per customer)',
        },
      },
      {
        name: 'ProductsToCustomers',
        models: ['ProductsModel', 'CustomersModel'],
        joinType: 'MANY_TO_ONE',
        condition: 'ProductsModel.customer_id = CustomersModel.customer_id',
        properties: {
          description:
            'Relationship between products and customers (many products per customer)',
        },
      },
      {
        name: 'InvestmentsToCustomers',
        models: ['InvestmentsModel', 'CustomersModel'],
        joinType: 'MANY_TO_ONE',
        condition: 'InvestmentsModel.customer_id = CustomersModel.customer_id',
        properties: {
          description:
            'Relationship between investments and customers (many investments per customer)',
        },
      },
    ];

    return { models, relations };
  }

  /**
   * Create calculated fields/metrics for common queries
   */
  public generateCalculatedFields(): ColumnMDL[] {
    return [
      {
        name: 'total_relationship_value',
        type: 'DECIMAL',
        isCalculated: true,
        expression: `
          COALESCE(SUM(AccountsModel.balance), 0) + 
          COALESCE(SUM(CreditCardsModel.credit_limit), 0) - 
          COALESCE(SUM(CreditCardsModel.outstanding_amount), 0)
        `,
        properties: {
          description: 'Total relationship value including accounts and credit',
          displayName: 'Total Relationship Value',
        },
      },
      {
        name: 'total_savings',
        type: 'DECIMAL',
        isCalculated: true,
        expression: `
          SUM(CASE 
            WHEN AccountsModel.account_type IN ('Savings', 'Current') 
            THEN AccountsModel.balance 
            ELSE 0 
          END)
        `,
        properties: {
          description: 'Total savings and current account balance',
          displayName: 'Total Savings',
        },
      },
      {
        name: 'credit_utilization_percentage',
        type: 'DECIMAL',
        isCalculated: true,
        expression: `
          CASE 
            WHEN SUM(CreditCardsModel.credit_limit) > 0 
            THEN (SUM(CreditCardsModel.outstanding_amount) / SUM(CreditCardsModel.credit_limit)) * 100
            ELSE 0 
          END
        `,
        properties: {
          description: 'Overall credit card utilization percentage',
          displayName: 'Credit Utilization %',
        },
      },
      {
        name: 'total_investments',
        type: 'DECIMAL',
        isCalculated: true,
        expression: 'SUM(InvestmentsModel.value)',
        properties: {
          description: 'Total investment portfolio value',
          displayName: 'Total Investments',
        },
      },
    ];
  }

  /**
   * Generate complete MDL manifest
   */
  public generateCompleteMDL(): Manifest {
    const { models, relations } = this.generateMDLManifest();
    const calculatedFields = this.generateCalculatedFields();

    // Add calculated fields to CustomersModel
    const customersModel = models.find((m) => m.name === 'CustomersModel');
    if (customersModel && customersModel.columns) {
      customersModel.columns.push(...calculatedFields);
    }

    return {
      models,
      relationships: relations,
    };
  }
}
