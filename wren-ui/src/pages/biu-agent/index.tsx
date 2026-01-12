import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Path } from '@/utils/enum';

export default function BiuAgentIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page by default
    router.push(Path.BiuAgentLogin);
  }, [router]);

  return null;
}
