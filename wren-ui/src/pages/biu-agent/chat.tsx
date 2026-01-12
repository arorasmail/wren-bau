import { useState, useRef, useEffect } from 'react';
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
import SendOutlined from '@ant-design/icons/SendOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import RobotOutlined from '@ant-design/icons/RobotOutlined';
import SiderLayout from '@/components/layouts/SiderLayout';
import useBiuAgentSidebar from '@/hooks/useBiuAgentSidebar';
import { useGetCustomerProfileQuery } from '@/apollo/client/graphql/biuAgent.generated';
import { useLazyQuery } from '@apollo/client';
import { CHAT_QUERY } from '@/apollo/client/graphql/biuAgent';

const { Title, Text } = Typography;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function BiuAgentChat() {
  const [customerId, setCustomerId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebar = useBiuAgentSidebar();

  const { data: customerProfile } = useGetCustomerProfileQuery({
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'cache-first',
  });

  const [chatQuery] = useLazyQuery(CHAT_QUERY, {
    onCompleted: (data) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.chatQuery || 'No response received.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    },
    onError: (error) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
      message.error('Failed to get response from chat service');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!customerId) {
      message.warning('Please set a customer ID first');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');
    setLoading(true);

    // Call GraphQL chat query
    chatQuery({
      variables: {
        customerId,
        question,
      },
    });
  };

  return (
    <SiderLayout loading={false} color="gray-3" sidebar={sidebar}>
      <div
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Title level={2}>Chat Assistant</Title>
        <Text type="secondary">Ask questions about customer data</Text>

        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Space>
            <Text>Customer ID:</Text>
            <Input
              placeholder="Enter Customer ID"
              prefix={<UserOutlined />}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{ width: 200 }}
            />
            {customerProfile && (
              <Text type="success">
                ✓ {customerProfile.getCustomerProfile?.customerName}
              </Text>
            )}
          </Space>
        </Card>

        <Card
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          bodyStyle={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#fafafa',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#999',
                }}
              >
                <RobotOutlined style={{ fontSize: 48 }} />
                <div style={{ marginTop: 16 }}>
                  Start a conversation by typing a message below
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent:
                    message.type === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.type === 'user' ? '#1890ff' : '#f0f0f0',
                    color: message.type === 'user' ? '#fff' : '#000',
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    {message.type === 'user' ? (
                      <UserOutlined />
                    ) : (
                      <RobotOutlined />
                    )}{' '}
                    {message.type === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div>{message.content}</div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#f0f0f0',
                  }}
                >
                  <RobotOutlined /> Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Row gutter={8}>
              <Col flex="auto">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={handleSendMessage}
                  disabled={loading || !customerId}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={loading}
                  disabled={!customerId}
                >
                  Send
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      </div>
    </SiderLayout>
  );
}
