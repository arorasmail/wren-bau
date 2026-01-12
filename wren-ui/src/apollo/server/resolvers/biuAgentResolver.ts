import { BiuAgentWrenQueryService } from '../services/biuAgentWrenQueryService';
import { getLogger } from '@server/utils';
import { GraphQLError } from 'graphql';
import { IContext } from '../types';
import {
  AskResultStatus,
  AskResultType,
  WrenAILanguage,
} from '../models/adaptor';

const logger = getLogger('BiuAgentResolver');
logger.level = 'debug';

export class BiuAgentResolver {
  /**
   * Get wren query service instance using context
   * This service uses wren's existing project database connection
   */
  private getWrenQueryService(ctx: IContext): BiuAgentWrenQueryService {
    return new BiuAgentWrenQueryService(ctx);
  }

  constructor() {
    // Bind methods to preserve 'this' context when used as GraphQL resolvers
    this.getCustomerDashboard = this.getCustomerDashboard.bind(this);
    this.getCustomerProfile = this.getCustomerProfile.bind(this);
    this.getFinancialSummary = this.getFinancialSummary.bind(this);
    this.getRecentActivity = this.getRecentActivity.bind(this);
    this.getAccountOverview = this.getAccountOverview.bind(this);
    this.getProductHoldings = this.getProductHoldings.bind(this);
    this.getCreditCardSummary = this.getCreditCardSummary.bind(this);
    this.getInvestmentData = this.getInvestmentData.bind(this);
    this.searchCustomers = this.searchCustomers.bind(this);
    this.getAllCustomerIds = this.getAllCustomerIds.bind(this);
    this.chatQuery = this.chatQuery.bind(this);
  }

  /**
   * Get comprehensive customer dashboard
   */
  public async getCustomerDashboard(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    logger.debug(`Fetching customer dashboard for customerId: ${customerId}`);
    try {
      // Fetch all dashboard data in parallel using wren's database connection
      const wrenQueryService = this.getWrenQueryService(_ctx);
      const [
        profile,
        financialSummary,
        recentActivity,
        accountOverview,
        productHoldings,
        creditCardSummary,
        investmentData,
      ] = await Promise.all([
        wrenQueryService.getCustomerProfile(customerId),
        wrenQueryService.getFinancialSummary(customerId),
        wrenQueryService.getRecentActivity(customerId, 10),
        wrenQueryService.getAccountOverview(customerId),
        wrenQueryService.getProductHoldings(customerId),
        wrenQueryService.getCreditCardSummary(customerId),
        wrenQueryService.getInvestmentData(customerId),
      ]);

      return {
        profile,
        financialSummary,
        recentActivity,
        accountOverview,
        productHoldings,
        creditCardSummary,
        investmentData,
      };
    } catch (error) {
      logger.error(`Error fetching customer dashboard: ${error}`);
      throw new GraphQLError(
        `Failed to fetch customer dashboard: ${error.message}`,
        {
          extensions: {
            code: 'CUSTOMER_DASHBOARD_ERROR',
            customerId,
          },
        },
      );
    }
  }

  /**
   * Get customer profile
   */
  public async getCustomerProfile(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      const profile = await wrenQueryService.getCustomerProfile(customerId);

      if (!profile) {
        throw new GraphQLError(`Customer not found: ${customerId}`, {
          extensions: {
            code: 'CUSTOMER_NOT_FOUND',
            customerId,
          },
        });
      }

      return profile;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      logger.error(`Error fetching customer profile: ${error}`);
      throw new GraphQLError(
        `Failed to fetch customer profile: ${error.message}`,
      );
    }
  }

  /**
   * Get financial summary
   */
  public async getFinancialSummary(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      const summary = await wrenQueryService.getFinancialSummary(customerId);

      if (!summary) {
        // Return zero values if no data found
        return {
          totalCasaBalance: 0,
          totalFdValue: 0,
          totalRdValue: 0,
          totalInvestmentValue: 0,
          totalCreditLimit: 0,
          totalCreditOutstanding: 0,
          totalLoanOutstanding: 0,
          accountCount: 0,
        };
      }

      return summary;
    } catch (error) {
      logger.error(`Error fetching financial summary: ${error}`);
      throw new GraphQLError(
        `Failed to fetch financial summary: ${error.message}`,
      );
    }
  }

  /**
   * Get recent activity
   */
  public async getRecentActivity(
    _root: any,
    args: { customerId: string; limit?: number },
    _ctx: IContext,
  ) {
    const { customerId, limit = 10 } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getRecentActivity(
        customerId,
        Math.min(limit, 100), // Cap at 100
      );
    } catch (error) {
      logger.error(`Error fetching recent activity: ${error}`);
      throw new GraphQLError(
        `Failed to fetch recent activity: ${error.message}`,
      );
    }
  }

  /**
   * Get account overview
   */
  public async getAccountOverview(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getAccountOverview(customerId);
    } catch (error) {
      logger.error(`Error fetching account overview: ${error}`);
      throw new GraphQLError(
        `Failed to fetch account overview: ${error.message}`,
      );
    }
  }

  /**
   * Get product holdings
   */
  public async getProductHoldings(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getProductHoldings(customerId);
    } catch (error) {
      logger.error(`Error fetching product holdings: ${error}`);
      throw new GraphQLError(
        `Failed to fetch product holdings: ${error.message}`,
      );
    }
  }

  /**
   * Get credit card summary
   */
  public async getCreditCardSummary(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getCreditCardSummary(customerId);
    } catch (error) {
      logger.error(`Error fetching credit card summary: ${error}`);
      // Return null if no credit cards found
      return null;
    }
  }

  /**
   * Get investment data
   */
  public async getInvestmentData(
    _root: any,
    args: { customerId: string },
    _ctx: IContext,
  ) {
    const { customerId } = args;
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getInvestmentData(customerId);
    } catch (error) {
      logger.error(`Error fetching investment data: ${error}`);
      return [];
    }
  }

  /**
   * Search customers
   */
  public async searchCustomers(
    _root: any,
    args: { searchTerm: string },
    _ctx: IContext,
  ) {
    const { searchTerm } = args;
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.searchCustomers(searchTerm.trim());
    } catch (error) {
      logger.error(`Error searching customers: ${error}`);
      throw new GraphQLError(`Failed to search customers: ${error.message}`);
    }
  }

  /**
   * Get all customer IDs
   */
  public async getAllCustomerIds(_root: any, _args: any, _ctx: IContext) {
    try {
      const wrenQueryService = this.getWrenQueryService(_ctx);
      return await wrenQueryService.getAllCustomerIds();
    } catch (error) {
      logger.error(`Error fetching customer IDs: ${error}`);
      throw new GraphQLError(`Failed to fetch customer IDs: ${error.message}`);
    }
  }

  /**
   * Handle chat queries using wren's text-to-SQL capability with customer context
   * This uses wren's asking service to generate SQL and get answers
   */
  public async chatQuery(
    _root: any,
    args: { customerId: string; question: string },
    _ctx: IContext,
  ) {
    const { customerId, question } = args;
    logger.debug(`Chat query for customer ${customerId}: ${question}`);

    try {
      // Get customer profile to add context
      const wrenQueryService = this.getWrenQueryService(_ctx);
      const customerProfile = await wrenQueryService.getCustomerProfile(
        customerId,
      );

      if (!customerProfile) {
        return `I couldn't find customer ${customerId}. Please verify the customer ID.`;
      }

      // Enhance question with customer context for wren's AI
      // This helps the AI understand it should filter by customer_id
      const enhancedQuestion = `For customer ${customerId} (${customerProfile.customerName || 'customer'}): ${question}`;

      // Use wren's asking service to create an asking task
      const askingService = _ctx.askingService;
      const project = await _ctx.projectService.getCurrentProject();

      // Create asking task (generates SQL from natural language)
      const task = await askingService.createAskingTask(
        { question: enhancedQuestion },
        {
          language:
            WrenAILanguage[project.language] || WrenAILanguage.EN,
        },
      );

      // Poll for the asking task result
      const deadline = Date.now() + 60000; // 60 second timeout
      let askResult;
      while (true) {
        askResult = await askingService.getAskingTask(task.id);
        if (!askResult) {
          return `Sorry, I couldn't process your question. Please try again.`;
        }

        if (
          askResult.status === AskResultStatus.FINISHED ||
          askResult.status === AskResultStatus.FAILED ||
          askResult.status === AskResultStatus.STOPPED
        ) {
          break;
        }

        if (Date.now() > deadline) {
          return `Sorry, the query timed out. Please try again with a more specific question.`;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
      }

      // Check if task failed
      if (
        askResult.status === AskResultStatus.FAILED ||
        askResult.status === AskResultStatus.STOPPED
      ) {
        return `Sorry, I couldn't process your question. ${askResult.error?.message || 'Please try rephrasing your question.'}`;
      }

      // If it's not a TEXT_TO_SQL type, return a general response
      if (askResult.type !== AskResultType.TEXT_TO_SQL) {
        return `I understand you're asking about customer ${customerId}. For more specific information, please try asking about their accounts, transactions, or financial summary.`;
      }

      // Get the generated SQL and ensure it filters by customer_id
      const sql = askResult.candidates?.[0]?.sql;
      if (!sql) {
        return `I couldn't generate a query for your question. Please try rephrasing it.`;
      }

      // Ensure SQL includes customer_id filter
      let finalSql = sql;
      if (!sql.toLowerCase().includes(`customer_id = '${customerId}'`)) {
        // Try to add WHERE clause with customer_id filter
        // This is a simple approach - in production, you might want more sophisticated SQL parsing
        if (sql.toLowerCase().includes('where')) {
          finalSql = sql.replace(
            /where/gi,
            `WHERE customer_id = '${customerId}' AND`,
          );
        } else {
          // Add WHERE clause
          const sqlUpper = sql.toUpperCase();
          const fromIndex = sqlUpper.indexOf('FROM');
          if (fromIndex !== -1) {
            const beforeFrom = sql.substring(0, fromIndex);
            const afterFrom = sql.substring(fromIndex);
            finalSql = `${beforeFrom} ${afterFrom} WHERE customer_id = '${customerId}'`;
          }
        }
      }

      // Execute the SQL query using wren's query service
      const queryResult = await wrenQueryService.executeQuery(finalSql, 100);

      if (!queryResult || queryResult.length === 0) {
        return `I found no data matching your query for customer ${customerId}.`;
      }

      // Format the response based on the query result
      if (queryResult.length === 1) {
        const result = queryResult[0];
        const keys = Object.keys(result);
        let response = `Here's what I found for customer ${customerProfile.customerName || customerId}:\n\n`;
        keys.forEach((key) => {
          const value = result[key];
          if (value !== null && value !== undefined) {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
            response += `- ${formattedKey}: ${value}\n`;
          }
        });
        return response;
      } else {
        // Multiple results
        let response = `I found ${queryResult.length} results for customer ${customerProfile.customerName || customerId}:\n\n`;
        queryResult.slice(0, 10).forEach((result, index) => {
          response += `Result ${index + 1}:\n`;
          Object.keys(result).forEach((key) => {
            const value = result[key];
            if (value !== null && value !== undefined) {
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
                .trim();
              response += `  - ${formattedKey}: ${value}\n`;
            }
          });
          response += '\n';
        });
        if (queryResult.length > 10) {
          response += `... and ${queryResult.length - 10} more results.`;
        }
        return response;
      }
    } catch (error) {
      logger.error(`Error processing chat query: ${error}`);
      return `I encountered an error while processing your query: ${error.message}. Please try again or verify the customer ID.`;
    }
  }

  /**
   * Legacy chat query handler (kept for backward compatibility)
   * This uses keyword matching - consider using chatQuery instead
   */
  public async chatQueryLegacy(
    _root: any,
    args: { customerId: string; question: string },
    _ctx: IContext,
  ) {
    const { customerId, question } = args;
    logger.debug(`Legacy chat query for customer ${customerId}: ${question}`);

    try {
      const questionLower = question.toLowerCase().trim();

      // Map common queries to data responses
      if (
        questionLower.includes('all details') ||
        questionLower.includes('all information') ||
        questionLower.includes('complete details') ||
        questionLower.includes('full details') ||
        questionLower.includes('everything')
      ) {
        // Return comprehensive customer dashboard summary
        const dashboard = await this.getCustomerDashboard(
          _root,
          { customerId },
          _ctx,
        );

        if (!dashboard || !dashboard.profile) {
          return `I couldn't find any details for customer ${customerId}. Please verify the customer ID.`;
        }

        const profile = dashboard.profile;
        const financial = dashboard.financialSummary;
        const accounts = dashboard.accountOverview || [];
        const activities = dashboard.recentActivity || [];
        const products = dashboard.productHoldings || [];

        let response = `Here are the complete details for customer ${profile.customerName} (ID: ${profile.customerId}):\n\n`;

        // Profile section
        response += `**Customer Profile:**\n`;
        response += `- Name: ${profile.customerName}\n`;
        if (profile.segment) response += `- Segment: ${profile.segment}\n`;
        if (profile.riskProfile)
          response += `- Risk Profile: ${profile.riskProfile}\n`;
        if (profile.cibilScore)
          response += `- CIBIL Score: ${profile.cibilScore}\n`;
        if (profile.rmName)
          response += `- Relationship Manager: ${profile.rmName}\n`;
        if (profile.branchName) response += `- Branch: ${profile.branchName}\n`;
        if (profile.location) response += `- Location: ${profile.location}\n`;
        if (profile.phone) response += `- Phone: ${profile.phone}\n`;
        response += `\n`;

        // Financial summary
        if (financial) {
          response += `**Financial Summary:**\n`;
          response += `- Total CASA Balance: ₹${financial.totalCasaBalance?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total FD Value: ₹${financial.totalFdValue?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total RD Value: ₹${financial.totalRdValue?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total Investment Value: ₹${financial.totalInvestmentValue?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total Credit Limit: ₹${financial.totalCreditLimit?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total Credit Outstanding: ₹${financial.totalCreditOutstanding?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Total Loan Outstanding: ₹${financial.totalLoanOutstanding?.toLocaleString('en-IN') || '0'}\n`;
          response += `- Number of Accounts: ${financial.accountCount || 0}\n`;
          response += `\n`;
        }

        // Accounts
        if (accounts.length > 0) {
          response += `**Account Overview:**\n`;
          accounts.forEach((account) => {
            response += `- ${account.accountType}: ${account.accountNumber} - Balance: ₹${account.balance?.toLocaleString('en-IN') || '0'} (${account.status})\n`;
          });
          response += `\n`;
        }

        // Recent activity
        if (activities.length > 0) {
          response += `**Recent Activity (Last ${activities.length} transactions):**\n`;
          activities.slice(0, 5).forEach((activity) => {
            response += `- ${activity.transactionDate}: ${activity.activityType} - ₹${activity.amount?.toLocaleString('en-IN') || '0'} (${activity.status})\n`;
          });
          response += `\n`;
        }

        // Products
        if (products.length > 0) {
          response += `**Product Holdings:**\n`;
          products.forEach((product) => {
            response += `- ${product.productName} (${product.productType}) - ${product.status}\n`;
          });
        }

        return response;
      } else if (
        questionLower.includes('financial') ||
        questionLower.includes('balance') ||
        questionLower.includes('summary')
      ) {
        const financial = await this.getFinancialSummary(
          _root,
          { customerId },
          _ctx,
        );
        let response = `**Financial Summary for Customer ${customerId}:**\n\n`;
        response += `- Total CASA Balance: ₹${financial.totalCasaBalance?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total FD Value: ₹${financial.totalFdValue?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total RD Value: ₹${financial.totalRdValue?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total Investment Value: ₹${financial.totalInvestmentValue?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total Credit Limit: ₹${financial.totalCreditLimit?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total Credit Outstanding: ₹${financial.totalCreditOutstanding?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Total Loan Outstanding: ₹${financial.totalLoanOutstanding?.toLocaleString('en-IN') || '0'}\n`;
        response += `- Number of Accounts: ${financial.accountCount || 0}\n`;
        return response;
      } else if (
        questionLower.includes('account') ||
        questionLower.includes('accounts')
      ) {
        const accounts = await this.getAccountOverview(
          _root,
          { customerId },
          _ctx,
        );
        if (accounts.length === 0) {
          return `No accounts found for customer ${customerId}.`;
        }
        let response = `**Account Overview for Customer ${customerId}:**\n\n`;
        accounts.forEach((account) => {
          response += `- ${account.accountType}: ${account.accountNumber}\n`;
          response += `  Balance: ₹${account.balance?.toLocaleString('en-IN') || '0'}\n`;
          response += `  Status: ${account.status}\n\n`;
        });
        return response;
      } else if (
        questionLower.includes('activity') ||
        questionLower.includes('transaction') ||
        questionLower.includes('recent')
      ) {
        const activities = await this.getRecentActivity(
          _root,
          { customerId, limit: 10 },
          _ctx,
        );
        if (activities.length === 0) {
          return `No recent activity found for customer ${customerId}.`;
        }
        let response = `**Recent Activity for Customer ${customerId}:**\n\n`;
        activities.forEach((activity) => {
          response += `- ${activity.transactionDate}: ${activity.activityType}\n`;
          response += `  Amount: ₹${activity.amount?.toLocaleString('en-IN') || '0'}\n`;
          response += `  Status: ${activity.status}\n`;
          if (activity.description) {
            response += `  Description: ${activity.description}\n`;
          }
          response += `\n`;
        });
        return response;
      } else if (
        questionLower.includes('profile') ||
        questionLower.includes('information') ||
        questionLower.includes('details')
      ) {
        const profile = await this.getCustomerProfile(
          _root,
          { customerId },
          _ctx,
        );
        let response = `**Customer Profile:**\n\n`;
        response += `- Customer ID: ${profile.customerId}\n`;
        response += `- Name: ${profile.customerName}\n`;
        if (profile.segment) response += `- Segment: ${profile.segment}\n`;
        if (profile.riskProfile)
          response += `- Risk Profile: ${profile.riskProfile}\n`;
        if (profile.cibilScore)
          response += `- CIBIL Score: ${profile.cibilScore}\n`;
        if (profile.rmName)
          response += `- Relationship Manager: ${profile.rmName}\n`;
        if (profile.branchName) response += `- Branch: ${profile.branchName}\n`;
        if (profile.location) response += `- Location: ${profile.location}\n`;
        if (profile.phone) response += `- Phone: ${profile.phone}\n`;
        return response;
      } else {
        // Default response - try to get basic profile
        try {
          const profile = await this.getCustomerProfile(
            _root,
            { customerId },
            _ctx,
          );
          return `I found information about customer ${profile.customerName} (ID: ${profile.customerId}). For more specific details, you can ask about:\n- "all details" - Complete customer information\n- "financial summary" - Financial balances and limits\n- "accounts" - Account overview\n- "recent activity" - Recent transactions\n- "profile" - Customer profile information`;
        } catch (_error) {
          return `I understand you're asking: "${question}". I can help you with customer information. Please try asking:\n- "give me all details for this customer"\n- "show financial summary"\n- "show accounts"\n- "show recent activity"\n- "show customer profile"`;
        }
      }
    } catch (error) {
      logger.error(`Error processing chat query: ${error}`);
      return `I encountered an error while processing your query. Please try again or verify the customer ID.`;
    }
  }
}
