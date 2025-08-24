// Custom hook for wallet balance management
import { useState, useEffect, useCallback } from "react";

export interface UseWalletBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => void;
}

export function useWalletBalance(
  mobileNumber?: string | null
): UseWalletBalanceReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (mobile: string) => {
    if (!mobile) {
      setBalance(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/customers/wallet?mobileNumber=${mobile}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch wallet balance");
      }
      const data = await response.json();
      setBalance(data.data?.balance || 0);
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
      setError("Failed to fetch wallet balance");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mobileNumber) {
      fetchBalance(mobileNumber);
    } else {
      setBalance(null);
      setError(null);
    }
  }, [mobileNumber, fetchBalance]);

  const refreshBalance = useCallback(() => {
    if (mobileNumber) {
      fetchBalance(mobileNumber);
    }
  }, [mobileNumber, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
  };
}
