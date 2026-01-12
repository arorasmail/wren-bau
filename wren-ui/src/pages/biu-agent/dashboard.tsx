import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Row,
  Col,
  message,
  Space,
} from 'antd';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import SiderLayout from '@/components/layouts/SiderLayout';
import { LoadingWrapper } from '@/components/PageLoading';
import {
  useGetCustomerDashboardQuery,
  useGetAllCustomerIdsQuery,
} from '@/apollo/client/graphql/biuAgent.generated';
import useBiuAgentSidebar from '@/hooks/useBiuAgentSidebar';
import CustomerDashboardView from '@/components/pages/biu-agent/CustomerDashboardView';

const { Title, Text } = Typography;

export default function BiuAgentDashboard() {
  const [customerId, setCustomerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const sidebar = useBiuAgentSidebar();

  const {
    data: customerData,
    loading,
    error,
    refetch,
  } = useGetCustomerDashboardQuery({
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'cache-and-network',
  });

  const { data: allCustomerIds } = useGetAllCustomerIdsQuery({
    fetchPolicy: 'cache-first',
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      message.warning('Please enter a customer ID');
      return;
    }
    setCustomerId(searchTerm.trim());
  };

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    setSearchTerm(id);
  };

  return (
    <SiderLayout loading={false} color="gray-3" sidebar={sidebar}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Customer Dashboard</Title>
        <Text type="secondary">
          Enter a customer ID to view their dashboard
        </Text>

        <Card style={{ marginTop: 24, marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="Enter Customer ID (e.g., 16767, 4843583)"
                  prefix={<UserOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={handleSearch}
                  size="large"
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  size="large"
                  loading={loading}
                >
                  Search
                </Button>
              </Col>
            </Row>

            {allCustomerIds?.getAllCustomerIds &&
              allCustomerIds.getAllCustomerIds.length > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Available Customer IDs:{' '}
                  </Text>
                  <Space wrap>
                    {allCustomerIds.getAllCustomerIds.slice(0, 10).map((id) => (
                      <Button
                        key={id}
                        size="small"
                        type={customerId === id ? 'primary' : 'default'}
                        onClick={() => handleCustomerSelect(id)}
                      >
                        {id}
                      </Button>
                    ))}
                    {allCustomerIds.getAllCustomerIds.length > 10 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        +{allCustomerIds.getAllCustomerIds.length - 10} more
                      </Text>
                    )}
                  </Space>
                </div>
              )}
          </Space>
        </Card>

        <LoadingWrapper loading={loading}>
          <div>
            {error && (
              <Card>
                <Text type="danger">
                  Error loading customer data: {error.message}
                </Text>
              </Card>
            )}

            {customerId && !loading && !error && customerData && (
              <CustomerDashboardView
                data={customerData.getCustomerDashboard}
                customerId={customerId}
                onRefresh={() => refetch()}
              />
            )}

            {customerId && !loading && !error && !customerData && (
              <Card>
                <Text>No data found for customer ID: {customerId}</Text>
              </Card>
            )}

            {!customerId && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <UserOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                  <Title level={4} type="secondary" style={{ marginTop: 16 }}>
                    Enter a customer ID to get started
                  </Title>
                  <Text type="secondary">
                    Search for a customer to view their dashboard and financial
                    information
                  </Text>
                </div>
              </Card>
            )}
          </div>
        </LoadingWrapper>
      </div>
    </SiderLayout>
  );
}
