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
import { ThreadResponse } from '../repositories/threadResponseRepository';
import { Thread } from '../repositories/threadRepository';

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
   * Handle chat queries using wren's thread system with customer context
   * This creates a thread response that uses wren's asking service to generate SQL and get answers
   * Returns a ThreadResponse that the frontend can poll for updates
   */
  public async chatQuery(
    _root: any,
    args: { customerId: string; question: string; threadId?: number },
    _ctx: IContext,
  ): Promise<ThreadResponse> {
    const { customerId, question, threadId } = args;
    logger.debug(
      `Chat query for customer ${customerId}: ${question}${threadId ? ` (threadId: ${threadId})` : ''}`,
    );

    try {
      // Get customer profile to add context
      const wrenQueryService = this.getWrenQueryService(_ctx);
      const customerProfile = await wrenQueryService.getCustomerProfile(
        customerId,
      );

      if (!customerProfile) {
        throw new GraphQLError(
          `I couldn't find customer ${customerId}. Please verify the customer ID.`,
        );
      }

      // Enhance question with customer context for wren's AI
      // This helps the AI understand it should filter by customer_id
      const enhancedQuestion = `For customer ${customerId} (${customerProfile.customerName || 'customer'}): ${question}`;

      // Use wren's asking service to create an asking task
      const askingService = _ctx.askingService;
      const project = await _ctx.projectService.getCurrentProject();

      // Create asking task (generates SQL from natural language)
      // This will be tracked by wren's background polling system
      const task = await askingService.createAskingTask(
        { question: enhancedQuestion },
        {
          language:
            WrenAILanguage[project.language] || WrenAILanguage.EN,
          threadId,
        },
      );

      logger.debug(`Created asking task: ${task.id} for customer ${customerId}`);

      // Get the TrackedAskingResult (wait a bit for it to be available in tracker)
      // The task.id is actually the queryId
      let trackedAskingResult;
      let retries = 0;
      while (retries < 5) {
        trackedAskingResult = await askingService.getAskingTask(task.id);
        if (trackedAskingResult) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!trackedAskingResult) {
        throw new GraphQLError(
          `Failed to get asking task result. Please try again.`,
        );
      }

      // Create thread response
      let threadResponse: ThreadResponse;
      if (threadId) {
        // Add to existing thread
        threadResponse = await askingService.createThreadResponse(
          {
            question: enhancedQuestion,
            trackedAskingResult,
          },
          threadId,
        );
        logger.debug(
          `Created thread response: ${threadResponse.id} in thread ${threadId} for task: ${task.id}`,
        );
      } else {
        // Create new thread (which also creates the first thread response)
        const thread = await askingService.createThread({
          question: enhancedQuestion,
          trackedAskingResult,
        });
        // Get the thread response that was created
        const threadResponses = await askingService.getResponsesWithThread(
          thread.id,
        );
        threadResponse = threadResponses[threadResponses.length - 1];
        logger.debug(
          `Created new thread: ${thread.id} with response: ${threadResponse.id} for customer ${customerId}`,
        );
      }

      return threadResponse;
    } catch (error) {
      logger.error(`Error processing chat query: ${error}`);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError(
        `I encountered an error while processing your query: ${error.message}. Please try again or verify the customer ID.`,
      );
    }
  }
}
