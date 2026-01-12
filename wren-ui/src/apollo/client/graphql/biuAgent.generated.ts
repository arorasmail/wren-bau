// Temporary type definitions - will be replaced by codegen
// Run: yarn generate-gql to generate proper types

import { gql } from '@apollo/client';

// Re-export queries
export * from './biuAgent';

// Type definitions based on GraphQL schema
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

export interface CustomerDashboard {
  profile?: CustomerProfile | null;
  financialSummary?: FinancialSummary | null;
  recentActivity: Activity[];
  accountOverview: Account[];
  productHoldings: Product[];
  creditCardSummary?: CreditCardSummary | null;
  investmentData: InvestmentData[];
}

export interface GetCustomerDashboardQuery {
  getCustomerDashboard: CustomerDashboard | null;
}

export interface GetCustomerProfileQuery {
  getCustomerProfile: CustomerProfile | null;
}

export interface GetAllCustomerIdsQuery {
  getAllCustomerIds: string[];
}

// Apollo hooks - temporary implementations
// These will be replaced by codegen
import * as Apollo from '@apollo/client';
import {
  GET_CUSTOMER_DASHBOARD,
  GET_CUSTOMER_PROFILE,
  GET_ALL_CUSTOMER_IDS,
} from './biuAgent';

export type GetCustomerDashboardQueryVariables = {
  customerId: string;
};

export type GetCustomerProfileQueryVariables = {
  customerId: string;
};

export type GetAllCustomerIdsQueryVariables = Record<string, never>;

const defaultOptions = {} as const;

export function useGetCustomerDashboardQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetCustomerDashboardQuery,
    GetCustomerDashboardQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCustomerDashboardQuery, GetCustomerDashboardQueryVariables>(
    GET_CUSTOMER_DASHBOARD,
    options,
  );
}

export function useGetCustomerProfileQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetCustomerProfileQuery,
    GetCustomerProfileQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCustomerProfileQuery, GetCustomerProfileQueryVariables>(
    GET_CUSTOMER_PROFILE,
    options,
  );
}

export function useGetAllCustomerIdsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetAllCustomerIdsQuery,
    GetAllCustomerIdsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetAllCustomerIdsQuery, GetAllCustomerIdsQueryVariables>(
    GET_ALL_CUSTOMER_IDS,
    options,
  );
}

export interface ChatQueryQuery {
  chatQuery: string;
}

export interface ChatQueryQueryVariables {
  customerId: string;
  question: string;
}

