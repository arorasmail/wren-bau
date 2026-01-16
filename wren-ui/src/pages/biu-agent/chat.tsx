import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Input, Typography, Space, message } from 'antd';
import UserOutlined from '@ant-design/icons/UserOutlined';
import SiderLayout from '@/components/layouts/SiderLayout';
import useBiuAgentSidebar from '@/hooks/useBiuAgentSidebar';
import { useGetCustomerProfileQuery } from '@/apollo/client/graphql/biuAgent.generated';
import { useLazyQuery, useQuery } from '@apollo/client';
import { CHAT_QUERY } from '@/apollo/client/graphql/biuAgent';
import Prompt from '@/components/pages/home/prompt';
import PromptThread from '@/components/pages/home/promptThread';
import useAskPrompt, {
  getIsFinished,
  canFetchThreadResponse,
} from '@/hooks/useAskPrompt';
import useAdjustAnswer from '@/hooks/useAdjustAnswer';
import useModalAction from '@/hooks/useModalAction';
import { useRouter } from 'next/router';
import {
  useThreadQuery,
  useThreadResponseLazyQuery,
  useUpdateThreadResponseMutation,
  useGenerateThreadRecommendationQuestionsMutation,
  useGetThreadRecommendationQuestionsLazyQuery,
  useGenerateThreadResponseAnswerMutation,
  useGenerateThreadResponseChartMutation,
  useAdjustThreadResponseChartMutation,
} from '@/apollo/client/graphql/home.generated';
import { PromptThreadProvider } from '@/components/pages/home/promptThread/store';
import { getAnswerIsFinished } from '@/components/pages/home/promptThread/TextBasedAnswer';
import { getIsChartFinished } from '@/components/pages/home/promptThread/ChartAnswer';
import {
  ThreadResponse,
  CreateThreadResponseInput,
  AdjustThreadResponseChartInput,
} from '@/apollo/client/graphql/__types__';
import { SelectQuestionProps } from '@/components/pages/home/RecommendedQuestions';

const { Title, Text } = Typography;

const getThreadResponseIsFinished = (threadResponse: ThreadResponse) => {
  const { answerDetail, breakdownDetail, chartDetail } = threadResponse || {};
  const isBreakdownOnly = answerDetail === null && breakdownDetail;
  let isAnswerFinished = isBreakdownOnly ? null : false;
  let isChartFinished = null;

  if (answerDetail?.queryId || answerDetail?.status) {
    isAnswerFinished = getAnswerIsFinished(answerDetail?.status);
  }

  if (chartDetail?.queryId) {
    isChartFinished = getIsChartFinished(chartDetail?.status);
  }

  return isAnswerFinished !== false && isChartFinished !== false;
};

export default function BiuAgentChat() {
  const [customerId, setCustomerId] = useState<string>('');
  const [threadId, setThreadId] = useState<number | null>(null);
  const router = useRouter();
  const sidebar = useBiuAgentSidebar();

  const { data: customerProfile } = useGetCustomerProfileQuery({
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'cache-first',
  });

  const { data, updateQuery: updateThreadQuery } = useThreadQuery({
    variables: { threadId },
    skip: !threadId,
    fetchPolicy: 'cache-and-network',
  });

  const askPrompt = useAskPrompt(threadId);
  const adjustAnswer = useAdjustAnswer(threadId);
  const saveAsViewModal = useModalAction();
  const questionSqlPairModal = useModalAction();
  const adjustReasoningStepsModal = useModalAction();
  const adjustSqlModal = useModalAction();

  const [fetchThreadResponse, threadResponseResult] =
    useThreadResponseLazyQuery({
      pollInterval: 1000,
      onCompleted(next) {
        const nextResponse = next.threadResponse;
        updateThreadQuery((prev) => ({
          ...prev,
          thread: {
            ...prev.thread,
            responses: prev.thread.responses.map((response) =>
              response.id === nextResponse.id ? nextResponse : response,
            ),
          },
        }));
      },
    });

  const [generateThreadRecommendationQuestions] =
    useGenerateThreadRecommendationQuestionsMutation({
      onError: (error) => console.error(error),
    });

  const [
    fetchThreadRecommendationQuestions,
    threadRecommendationQuestionsResult,
  ] = useGetThreadRecommendationQuestionsLazyQuery({
    pollInterval: 1000,
  });

  const [generateThreadResponseAnswer] =
    useGenerateThreadResponseAnswerMutation({
      onError: (error) => console.error(error),
    });

  const [generateThreadResponseChart] = useGenerateThreadResponseChartMutation({
    onError: (error) => console.error(error),
  });

  const [adjustThreadResponseChart] = useAdjustThreadResponseChartMutation({
    onError: (error) => console.error(error),
  });

  const [updateThreadResponse] = useUpdateThreadResponseMutation({
    onError: (error) => console.error(error),
  });

  const [chatQuery] = useLazyQuery(CHAT_QUERY, {
    onCompleted: (data) => {
      const response = data.chatQuery;
      if (response) {
        // Set threadId if we got a new thread
        if (!threadId && response.threadId) {
          setThreadId(response.threadId);
          router.push(
            `/biu-agent/chat?customerId=${customerId}&threadId=${response.threadId}`,
            undefined,
            { shallow: true },
          );
        }
        // Update thread query with new response
        updateThreadQuery((prev) => {
          if (!prev?.thread) return prev;
          const existingIndex = prev.thread.responses.findIndex(
            (r) => r.id === response.id,
          );
          return {
            ...prev,
            thread: {
              ...prev.thread,
              responses:
                existingIndex >= 0
                  ? prev.thread.responses.map((r) =>
                      r.id === response.id ? response : r,
                    )
                  : [...prev.thread.responses, response],
            },
          };
        });
      }
    },
    onError: (error) => {
      console.error(error);
      message.error(`Failed to get response: ${error.message}`);
    },
  });

  // Initialize threadId from URL params
  useEffect(() => {
    const urlThreadId = router.query.threadId;
    const urlCustomerId = router.query.customerId as string;
    if (urlThreadId && typeof urlThreadId === 'string') {
      setThreadId(Number(urlThreadId));
    }
    if (urlCustomerId) {
      setCustomerId(urlCustomerId);
    }
  }, [router.query]);

  const thread = useMemo(() => data?.thread || null, [data]);
  const responses = useMemo(() => thread?.responses || [], [thread]);
  const pollingResponse = useMemo(
    () => threadResponseResult.data?.threadResponse || null,
    [threadResponseResult.data],
  );
  const isPollingResponseFinished = useMemo(
    () => getThreadResponseIsFinished(pollingResponse),
    [pollingResponse],
  );

  const onFixSQLStatement = async (responseId: number, sql: string) => {
    await updateThreadResponse({
      variables: { where: { id: responseId }, data: { sql } },
    });
  };

  const onGenerateThreadResponseAnswer = async (responseId: number) => {
    await generateThreadResponseAnswer({ variables: { responseId } });
    fetchThreadResponse({ variables: { responseId } });
  };

  const onGenerateThreadResponseChart = async (responseId: number) => {
    await generateThreadResponseChart({ variables: { responseId } });
    fetchThreadResponse({ variables: { responseId } });
  };

  const onAdjustThreadResponseChart = async (
    responseId: number,
    data: AdjustThreadResponseChartInput,
  ) => {
    await adjustThreadResponseChart({
      variables: { responseId, data },
    });
    fetchThreadResponse({ variables: { responseId } });
  };

  const onGenerateThreadRecommendedQuestions = async () => {
    if (threadId) {
      await generateThreadRecommendationQuestions({
        variables: { threadId },
      });
      fetchThreadRecommendationQuestions({ variables: { threadId } });
    }
  };

  const handleUnfinishedTasks = useCallback(
    (responses: ThreadResponse[]) => {
      const unfinishedAskingResponse = (responses || []).find(
        (response) =>
          response?.askingTask &&
          !getIsFinished(response?.askingTask?.status),
      );
      if (unfinishedAskingResponse) {
        askPrompt.onFetching(unfinishedAskingResponse?.askingTask?.queryId);
        return;
      }

      const unfinishedThreadResponse = (responses || []).find(
        (response) => !getThreadResponseIsFinished(response),
      );

      if (
        canFetchThreadResponse(unfinishedThreadResponse?.askingTask) &&
        unfinishedThreadResponse
      ) {
        fetchThreadResponse({
          variables: { responseId: unfinishedThreadResponse.id },
        });
      }
    },
    [askPrompt, fetchThreadResponse],
  );

  useEffect(() => {
    if (threadId !== null) {
      fetchThreadRecommendationQuestions({ variables: { threadId } });
    }
    return () => {
      askPrompt.onStopPolling();
      threadResponseResult.stopPolling();
      threadRecommendationQuestionsResult.stopPolling();
    };
  }, [threadId]);

  useEffect(() => {
    if (!responses) return;
    handleUnfinishedTasks(responses);
  }, [responses]);

  useEffect(() => {
    if (isPollingResponseFinished) {
      threadResponseResult.stopPolling();
    }
  }, [isPollingResponseFinished]);

  const recommendedQuestions = useMemo(
    () =>
      threadRecommendationQuestionsResult.data
        ?.getThreadRecommendationQuestions || null,
    [threadRecommendationQuestionsResult.data],
  );

  const onCreateResponse = async (payload: CreateThreadResponseInput) => {
    if (!customerId) {
      message.warning('Please set a customer ID first');
      return;
    }

    try {
      askPrompt.onStopPolling();
      // Extract question from payload
      const question = payload.question || '';
      await chatQuery({
        variables: {
          customerId,
          question,
          threadId: threadId || undefined,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const providerValue = useMemo(
    () => ({
      data: thread,
      recommendedQuestions,
      showRecommendedQuestions: false,
      preparation: {
        askingStreamTask: askPrompt.data?.askingStreamTask,
        onStopAskingTask: askPrompt.onStop,
        onReRunAskingTask: askPrompt.onReRun,
        onStopAdjustTask: adjustAnswer.onStop,
        onReRunAdjustTask: adjustAnswer.onReRun,
        onFixSQLStatement,
        fixStatementLoading: false,
      },
      onOpenSaveAsViewModal: saveAsViewModal.openModal,
      onSelectRecommendedQuestion: onCreateResponse,
      onGenerateThreadRecommendedQuestions: onGenerateThreadRecommendedQuestions,
      onGenerateTextBasedAnswer: onGenerateThreadResponseAnswer,
      onGenerateChartAnswer: onGenerateThreadResponseChart,
      onAdjustChartAnswer: onAdjustThreadResponseChart,
      onOpenSaveToKnowledgeModal: questionSqlPairModal.openModal,
      onOpenAdjustReasoningStepsModal: adjustReasoningStepsModal.openModal,
      onOpenAdjustSQLModal: adjustSqlModal.openModal,
    }),
    [
      thread,
      recommendedQuestions,
      askPrompt.data,
      askPrompt.onStop,
      askPrompt.onReRun,
      adjustAnswer.onStop,
      adjustAnswer.onReRun,
      saveAsViewModal.openModal,
      questionSqlPairModal.openModal,
      adjustReasoningStepsModal.openModal,
      adjustSqlModal.openModal,
      onGenerateThreadRecommendedQuestions,
      onGenerateThreadResponseAnswer,
      onGenerateThreadResponseChart,
      onAdjustThreadResponseChart,
    ],
  );

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
              onChange={(e) => {
                setCustomerId(e.target.value);
                setThreadId(null);
                router.push(
                  `/biu-agent/chat?customerId=${e.target.value}`,
                  undefined,
                  { shallow: true },
                );
              }}
              style={{ width: 200 }}
            />
            {customerProfile && (
              <Text type="success">
                ✓ {customerProfile.getCustomerProfile?.customerName}
              </Text>
            )}
          </Space>
        </Card>

        {threadId && thread ? (
          <PromptThreadProvider value={providerValue}>
            <PromptThread />
            <div className="py-12" />
            <Prompt
              {...askPrompt}
              onCreateResponse={onCreateResponse}
              inputProps={{
                placeholder: 'Ask follow-up questions to explore customer data',
              }}
            />
          </PromptThreadProvider>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
            }}
          >
            <Text type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
              {customerId
                ? 'Start a conversation by asking a question about the customer'
                : 'Please set a customer ID to begin'}
            </Text>
            {customerId && (
              <Prompt
                {...askPrompt}
                onCreateResponse={onCreateResponse}
                inputProps={{
                  placeholder: 'Ask to explore customer data',
                }}
              />
            )}
          </div>
        )}
      </div>
    </SiderLayout>
  );
}
