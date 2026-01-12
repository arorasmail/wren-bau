import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Input, Form, Card, Typography, message } from 'antd';
import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import SimpleLayout from '@/components/layouts/SimpleLayout';
import { Path } from '@/utils/enum';

const { Title, Text } = Typography;

export default function BiuAgentLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (_values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // Simple authentication - in production, this would call an API
      // For now, just redirect to dashboard
      message.success('Login successful');
      router.push(Path.BiuAgentDashboard);
    } catch (_error) {
      message.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card
          style={{
            width: 400,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2}>RM Portal</Title>
            <Text type="secondary">Relationship Manager Login</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: 'Please input your username!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </SimpleLayout>
  );
}
