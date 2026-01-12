import { gql } from '@apollo/client';

export const GET_CUSTOMER_DASHBOARD = gql`
  query GetCustomerDashboard($customerId: String!) {
    getCustomerDashboard(customerId: $customerId) {
      profile {
        customerId
        customerName
        segment
        riskProfile
        cibilScore
        rmName
        rmCode
        branchName
        location
        phone
        customerSince
      }
      financialSummary {
        totalCasaBalance
        totalFdValue
        totalRdValue
        totalInvestmentValue
        totalCreditLimit
        totalCreditOutstanding
        totalLoanOutstanding
        accountCount
      }
      recentActivity {
        transactionDate
        activityType
        amount
        status
        description
      }
      accountOverview {
        accountType
        accountNumber
        balance
        status
      }
      productHoldings {
        productType
        productName
        status
        openedDate
      }
      creditCardSummary {
        cardName
        creditLimit
        availableLimit
        outstandingAmount
        amountDue
        rewardPoints
        lastBilledAmount
        utilizationPercentage
      }
      investmentData {
        investmentType
        category
        value
        maturityDate
      }
    }
  }
`;

export const GET_CUSTOMER_PROFILE = gql`
  query GetCustomerProfile($customerId: String!) {
    getCustomerProfile(customerId: $customerId) {
      customerId
      customerName
      segment
      riskProfile
      cibilScore
      rmName
      rmCode
      branchName
      location
      phone
      customerSince
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($searchTerm: String!) {
    searchCustomers(searchTerm: $searchTerm) {
      customerId
      customerName
      segment
      location
      phone
    }
  }
`;

export const GET_FINANCIAL_SUMMARY = gql`
  query GetFinancialSummary($customerId: String!) {
    getFinancialSummary(customerId: $customerId) {
      totalCasaBalance
      totalFdValue
      totalRdValue
      totalInvestmentValue
      totalCreditLimit
      totalCreditOutstanding
      totalLoanOutstanding
      accountCount
    }
  }
`;

export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($customerId: String!, $limit: Int) {
    getRecentActivity(customerId: $customerId, limit: $limit) {
      transactionDate
      activityType
      amount
      status
      description
    }
  }
`;

export const GET_ACCOUNT_OVERVIEW = gql`
  query GetAccountOverview($customerId: String!) {
    getAccountOverview(customerId: $customerId) {
      accountType
      accountNumber
      balance
      status
    }
  }
`;

export const GET_PRODUCT_HOLDINGS = gql`
  query GetProductHoldings($customerId: String!) {
    getProductHoldings(customerId: $customerId) {
      productType
      productName
      status
      openedDate
    }
  }
`;

export const GET_CREDIT_CARD_SUMMARY = gql`
  query GetCreditCardSummary($customerId: String!) {
    getCreditCardSummary(customerId: $customerId) {
      cardName
      creditLimit
      availableLimit
      outstandingAmount
      amountDue
      rewardPoints
      lastBilledAmount
      utilizationPercentage
    }
  }
`;

export const GET_INVESTMENT_DATA = gql`
  query GetInvestmentData($customerId: String!) {
    getInvestmentData(customerId: $customerId) {
      investmentType
      category
      value
      maturityDate
    }
  }
`;

export const GET_ALL_CUSTOMER_IDS = gql`
  query GetAllCustomerIds {
    getAllCustomerIds
  }
`;

export const CHAT_QUERY = gql`
  query ChatQuery($customerId: String!, $question: String!) {
    chatQuery(customerId: $customerId, question: $question)
  }
`;
