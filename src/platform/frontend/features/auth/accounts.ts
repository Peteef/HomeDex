import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from './internal/authApi.ts';

const ACCOUNTS_QUERY_KEY = ['accounts'] as const;

export const useAccounts = () =>
  useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccounts,
  });
