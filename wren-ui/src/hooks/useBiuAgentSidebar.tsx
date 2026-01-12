import { useMemo } from 'react';
import { Props as HomeSidebarProps } from '@/components/sidebar/Home';

export default function useBiuAgentSidebar(): HomeSidebarProps {
  return useMemo(
    () => ({
      data: {
        threads: [],
      },
      onSelect: () => {},
      onDelete: async () => {},
      onRename: async () => {},
    }),
    [],
  );
}
