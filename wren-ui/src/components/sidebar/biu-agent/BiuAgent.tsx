import clsx from 'clsx';
import { useRouter } from 'next/router';
import { Path } from '@/utils/enum';
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import { StyledTreeNodeLink } from '../SidebarTree';

export default function BiuAgent() {
  const router = useRouter();

  return (
    <>
      <StyledTreeNodeLink
        className={clsx({
          'adm-treeNode--selected': router.pathname === Path.BiuAgentDashboard,
        })}
        href={Path.BiuAgentDashboard}
      >
        <DashboardOutlined className="mr-2" />
        <span className="text-medium">Dashboard</span>
      </StyledTreeNodeLink>
      <StyledTreeNodeLink
        className={clsx({
          'adm-treeNode--selected': router.pathname === Path.BiuAgentChat,
        })}
        href={Path.BiuAgentChat}
      >
        <MessageOutlined className="mr-2" />
        <span className="text-medium">Chat Assistant</span>
      </StyledTreeNodeLink>
    </>
  );
}
