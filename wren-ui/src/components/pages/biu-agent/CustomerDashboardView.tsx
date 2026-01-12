import { Card, Row, Col, Typography, Table, Tag, Space } from 'antd';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import CreditCardOutlined from '@ant-design/icons/CreditCardOutlined';
import BankOutlined from '@ant-design/icons/BankOutlined';
import TransactionOutlined from '@ant-design/icons/TransactionOutlined';
import { GetCustomerDashboardQuery } from '@/apollo/client/graphql/biuAgent.generated';

const { Text, Title } = Typography;

interface CustomerDashboardViewProps {
  data: GetCustomerDashboardQuery['getCustomerDashboard'];
  customerId: string;
  onRefresh: () => void;
}

export default function CustomerDashboardView({
  data,
  customerId: _customerId,
  onRefresh: _onRefresh,
}: CustomerDashboardViewProps) {
  const profile = data?.profile;
  const financialSummary = data?.financialSummary;
  const recentActivity = data?.recentActivity || [];
  const accountOverview = data?.accountOverview || [];
  const productHoldings = data?.productHoldings || [];
  const creditCardSummary = data?.creditCardSummary;

  const activityColumns = [
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
    },
    {
      title: 'Type',
      dataIndex: 'activityType',
      key: 'activityType',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) =>
        `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  const accountColumns = [
    {
      title: 'Account Type',
      dataIndex: 'accountType',
      key: 'accountType',
    },
    {
      title: 'Account Number',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) =>
        `₹${balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
  ];

  return (
    <div>
      {/* Customer Profile */}
      {profile && (
        <Card title="Customer Profile" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical">
                <div>
                  <Text type="secondary">Customer Name:</Text>{' '}
                  <Text strong>{profile.customerName}</Text>
                </div>
                <div>
                  <Text type="secondary">Customer ID:</Text>{' '}
                  <Text strong>{profile.customerId}</Text>
                </div>
                <div>
                  <Text type="secondary">Segment:</Text>{' '}
                  <Tag color="blue">{profile.segment}</Tag>
                </div>
                <div>
                  <Text type="secondary">Risk Profile:</Text>{' '}
                  <Tag
                    color={
                      profile.riskProfile === 'Low'
                        ? 'green'
                        : profile.riskProfile === 'Medium'
                          ? 'orange'
                          : 'red'
                    }
                  >
                    {profile.riskProfile}
                  </Tag>
                </div>
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical">
                <div>
                  <Text type="secondary">CIBIL Score:</Text>{' '}
                  <Text strong>{profile.cibilScore}</Text>
                </div>
                <div>
                  <Text type="secondary">RM Name:</Text>{' '}
                  <Text strong>{profile.rmName}</Text>
                </div>
                <div>
                  <Text type="secondary">Branch:</Text>{' '}
                  <Text strong>{profile.branchName}</Text>
                </div>
                <div>
                  <Text type="secondary">Location:</Text>{' '}
                  <Text strong>{profile.location}</Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Financial Summary */}
      {financialSummary && (
        <Card title="Financial Summary" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div>
                <Text type="secondary">CASA Balance</Text>
                <div style={{ marginTop: 8 }}>
                  <BankOutlined style={{ marginRight: 8 }} />
                  <Title level={4} style={{ margin: 0, display: 'inline' }}>
                    ₹
                    {(financialSummary.totalCasaBalance || 0).toLocaleString(
                      'en-IN',
                      { minimumFractionDigits: 2 },
                    )}
                  </Title>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <Text type="secondary">FD Value</Text>
                <div style={{ marginTop: 8 }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  <Title level={4} style={{ margin: 0, display: 'inline' }}>
                    ₹
                    {(financialSummary.totalFdValue || 0).toLocaleString(
                      'en-IN',
                      { minimumFractionDigits: 2 },
                    )}
                  </Title>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <Text type="secondary">Credit Limit</Text>
                <div style={{ marginTop: 8 }}>
                  <CreditCardOutlined style={{ marginRight: 8 }} />
                  <Title level={4} style={{ margin: 0, display: 'inline' }}>
                    ₹
                    {(financialSummary.totalCreditLimit || 0).toLocaleString(
                      'en-IN',
                      { minimumFractionDigits: 2 },
                    )}
                  </Title>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <Text type="secondary">Total Accounts</Text>
                <div style={{ marginTop: 8 }}>
                  <TransactionOutlined style={{ marginRight: 8 }} />
                  <Title level={4} style={{ margin: 0, display: 'inline' }}>
                    {financialSummary.accountCount || 0}
                  </Title>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Account Overview */}
      {accountOverview.length > 0 && (
        <Card title="Account Overview" style={{ marginBottom: 24 }}>
          <Table
            dataSource={accountOverview}
            columns={accountColumns}
            rowKey="accountNumber"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Credit Card Summary */}
      {creditCardSummary && (
        <Card title="Credit Card Summary" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div>
                <Text type="secondary">Card Name</Text>
                <div style={{ marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {creditCardSummary.cardName}
                  </Title>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary">Credit Limit</Text>
                <div style={{ marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    ₹
                    {(creditCardSummary.creditLimit || 0).toLocaleString(
                      'en-IN',
                      { minimumFractionDigits: 2 },
                    )}
                  </Title>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary">Utilization</Text>
                <div style={{ marginTop: 8 }}>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color:
                        (creditCardSummary.utilizationPercentage || 0) > 80
                          ? '#cf1322'
                          : '#3f8600',
                    }}
                  >
                    {(creditCardSummary.utilizationPercentage || 0).toFixed(2)}%
                  </Title>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card title="Recent Activity" style={{ marginBottom: 24 }}>
          <Table
            dataSource={recentActivity}
            columns={activityColumns}
            rowKey={(_record, index) => `activity-${index}`}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}

      {/* Product Holdings */}
      {productHoldings.length > 0 && (
        <Card title="Product Holdings">
          <Row gutter={16}>
            {productHoldings.map((product, index) => (
              <Col span={8} key={`product-${index}`}>
                <Card size="small">
                  <div>
                    <Text strong>{product.productName}</Text>
                  </div>
                  <div>
                    <Text type="secondary">{product.productType}</Text>
                  </div>
                  <div>
                    <Tag color={product.status === 'Active' ? 'green' : 'red'}>
                      {product.status}
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
}
