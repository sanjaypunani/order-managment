import { useState, useEffect } from "react";

export function useWalletBalance(mobileNumber?: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async (mobile: string) => {
    if (!mobile) {
      setBalance(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use API call instead of direct service import
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
  };

  useEffect(() => {
    if (mobileNumber) {
      fetchBalance(mobileNumber);
    } else {
      setBalance(null);
      setError(null);
    }
  }, [mobileNumber]);

  const refreshBalance = () => {
    if (mobileNumber) {
      fetchBalance(mobileNumber);
    }
  };

  return {
    balance,
    loading,
    error,
    refreshBalance,
  };
}
