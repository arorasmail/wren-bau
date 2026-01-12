import { BiuAgentWrenQueryService } from '../services/biuAgentWrenQueryService';
import { getLogger } from '@server/utils';
import { GraphQLError } from 'graphql';
import { IContext } from '../types';

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
   * Handle chat queries and return formatted responses based on customer data
   */
  public async chatQuery(
    _root: any,
    args: { customerId: string; question: string },
    _ctx: IContext,
  ) {
    const { customerId, question } = args;
    logger.debug(`Chat query for customer ${customerId}: ${question}`);

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
