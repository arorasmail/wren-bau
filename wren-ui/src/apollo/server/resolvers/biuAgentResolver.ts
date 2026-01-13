import { BiuAgentWrenQueryService } from '../services/biuAgentWrenQueryService';
import { getLogger } from '@server/utils';
import { GraphQLError } from 'graphql';
import { IContext } from '../types';
import {
  AskResultStatus,
  AskResultType,
  WrenAILanguage,
  AskResult,
} from '../models/adaptor';
import { isAskResultFinished, MAX_WAIT_TIME } from '../utils/apiUtils';
import { Readable } from 'stream';

const logger = getLogger('BiuAgentResolver');
logger.level = 'debug';

export class BiuAgentResolver {
  /**
   *   Get wren query service instance using context
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

      // Poll directly using wrenAIAdaptor (same as wren's API endpoints)
      // This ensures we get real-time updates without waiting for background polling
      const wrenAIAdaptor = _ctx.wrenAIAdaptor;
      const deadline = Date.now() + MAX_WAIT_TIME;
      let askResult: AskResult;
      let pollCount = 0;

      logger.debug(`Starting to poll for ask result with queryId: ${task.id}`);

      while (true) {
        // Poll directly from wren-ai-service (same approach as /api/v1/ask)
        askResult = await wrenAIAdaptor.getAskResult(task.id);
        pollCount++;

        logger.debug(
          `Polling ask result (${pollCount}): status=${askResult.status}, type=${askResult.type}`,
        );

        // Check if the result is finished (same logic as wren's API)
        if (isAskResultFinished(askResult)) {
          break;
        }

        // Check timeout
        if (Date.now() > deadline) {
          return `Sorry, the query timed out after ${pollCount} attempts. Please try again with a more specific question.`;
        }

        // Wait before polling again (same as wren's API)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logger.debug(
        `Ask result finished: status=${askResult.status}, type=${askResult.type}`,
      );

      // Check if task failed
      if (
        askResult.status === AskResultStatus.FAILED ||
        askResult.status === AskResultStatus.STOPPED
      ) {
        return `Sorry, I couldn't process your question. ${askResult.error?.message || 'Please try rephrasing your question.'}`;
      }

      // Handle GENERAL type queries (like discussion points, recommendations, etc.)
      if (askResult.type === AskResultType.GENERAL) {
        // Get the streaming explanation from wren-ai-service
        let explanation = '';
        try {
          const stream = await wrenAIAdaptor.getAskStreamingResult(task.id);

          // Collect the streamed content
          const streamPromise = new Promise<void>((resolve, reject) => {
            stream.on('data', (chunk) => {
              const chunkString = chunk.toString('utf-8');
              const match = chunkString.match(/data: {"message":"([\s\S]*?)"}/);
              if (match && match[1]) {
                explanation += match[1];
              }
            });

            stream.on('end', () => {
              resolve();
            });

            stream.on('error', (error) => {
              reject(error);
            });

            // Timeout after 30 seconds
            setTimeout(() => {
              stream.destroy();
              resolve(); // Resolve anyway to return partial explanation
            }, 30000);
          });

          await streamPromise;
        } catch (streamError) {
          logger.warn(
            `Failed to get streaming explanation: ${streamError.message}`,
          );
          // Continue with customer data even if streaming fails
        }

        // Enhance with customer-specific data insights
        const customerData = await this.getCustomerDashboard(
          _root,
          { customerId },
          _ctx,
        );

        if (!customerData || !customerData.profile) {
          return (
            explanation ||
            `I understand you're asking about customer ${customerId}. For more specific information, please try asking about their accounts, transactions, or financial summary.`
          );
        }

        // Build discussion points based on customer data
        const profile = customerData.profile;
        const financial = customerData.financialSummary;
        const accounts = customerData.accountOverview || [];
        const activities = customerData.recentActivity || [];
        const products = customerData.productHoldings || [];

        let response = `**Discussion Points for ${profile.customerName} (Customer ID: ${customerId})**\n\n`;

        // Add AI-generated explanation if available
        if (explanation) {
          response += `${explanation}\n\n`;
        }

        // Add key customer insights
        response += `**Key Customer Insights:**\n\n`;

        // Profile highlights
        response += `**1. Customer Profile:**\n`;
        response += `- Customer Name: ${profile.customerName}\n`;
        if (profile.segment)
          response += `- Segment: ${profile.segment}\n`;
        if (profile.riskProfile)
          response += `- Risk Profile: ${profile.riskProfile}\n`;
        if (profile.cibilScore)
          response += `- CIBIL Score: ${profile.cibilScore}\n`;
        if (profile.rmName)
          response += `- Relationship Manager: ${profile.rmName}\n`;
        if (profile.branchName) response += `- Branch: ${profile.branchName}\n`;
        response += `\n`;

        // Financial summary
        if (financial) {
          response += `**2. Financial Overview:**\n`;
          response += `- Total Relationship Value: ₹${(
            (financial.totalCasaBalance || 0) +
            (financial.totalFdValue || 0) +
            (financial.totalRdValue || 0) +
            (financial.totalInvestmentValue || 0)
          ).toLocaleString('en-IN')}\n`;
          response += `- Total CASA Balance: ₹${(financial.totalCasaBalance || 0).toLocaleString('en-IN')}\n`;
          response += `- Total Credit Limit: ₹${(financial.totalCreditLimit || 0).toLocaleString('en-IN')}\n`;
          response += `- Credit Outstanding: ₹${(financial.totalCreditOutstanding || 0).toLocaleString('en-IN')}\n`;
          response += `- Number of Accounts: ${financial.accountCount || 0}\n`;
          response += `\n`;
        }

        // Recent activity highlights
        if (activities.length > 0) {
          response += `**3. Recent Activity:**\n`;
          activities.slice(0, 3).forEach((activity) => {
            response += `- ${activity.transactionDate}: ${activity.activityType} - ₹${(activity.amount || 0).toLocaleString('en-IN')}\n`;
          });
          response += `\n`;
        }

        // Product holdings
        if (products.length > 0) {
          response += `**4. Product Holdings:**\n`;
          products.forEach((product) => {
            response += `- ${product.productName} (${product.productType}) - ${product.status}\n`;
          });
          response += `\n`;
        }

        // Discussion suggestions based on data
        response += `**Suggested Discussion Topics:**\n`;
        if (financial && financial.totalCreditOutstanding > 0) {
          response += `- Credit card utilization and payment options\n`;
        }
        if (financial && financial.totalInvestmentValue > 0) {
          response += `- Investment portfolio review and opportunities\n`;
        }
        if (activities.length > 0) {
          response += `- Recent transaction patterns and insights\n`;
        }
        if (accounts.length > 0) {
          response += `- Account optimization and cross-selling opportunities\n`;
        }

        return response;
      }

      // Handle MISLEADING_QUERY type
      if (askResult.type === AskResultType.MISLEADING_QUERY) {
        const reasoning =
          askResult.intentReasoning ||
          `Please try rephrasing your question with more specific details about what you'd like to know about customer ${customerId}.`;
        return `I couldn't understand your question clearly. ${reasoning}`;
      }

      // Get the generated SQL and ensure it filters by customer_id
      // AskResult.response is an array of candidates with sql property
      const sql = askResult.response?.[0]?.sql;
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
}
