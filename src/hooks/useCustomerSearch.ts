// Custom hook for customer search functionality
import { useState, useCallback, useEffect } from "react";
import { Customer } from "../types";
import { customerService } from "../services";

export interface UseCustomerSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
}

export interface UseCustomerSearchReturn {
  searchResults: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  searchByMobile: (mobileNumber: string) => Promise<void>;
  searchByFlat: (flatNumber: string) => Promise<void>;
  searchByName: (customerName: string) => Promise<void>;
  search: (query: string, type: "mobile" | "flat" | "name") => Promise<void>;
  selectCustomer: (customer: Customer) => void;
  clearSearch: () => void;
  clearSelection: () => void;
}

export function useCustomerSearch(): UseCustomerSearchReturn {
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchByMobile = useCallback(async (mobileNumber: string) => {
    if (!mobileNumber.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean mobile number
      let cleanNumber = mobileNumber.trim();
      if (cleanNumber.startsWith("+91")) {
        cleanNumber = cleanNumber.substring(3);
      } else if (cleanNumber.startsWith("91") && cleanNumber.length > 10) {
        cleanNumber = cleanNumber.substring(2);
      }

      const results = await customerService.searchByMobile(cleanNumber);
      setSearchResults(results);

      // Auto-select if only one result
      if (results.length === 1) {
        setSelectedCustomer(results[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByFlat = useCallback(async (flatNumber: string) => {
    if (!flatNumber.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await customerService.searchByFlat(flatNumber);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByName = useCallback(async (customerName: string) => {
    if (!customerName.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await customerService.searchByName(customerName);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(
    async (query: string, type: "mobile" | "flat" | "name") => {
      switch (type) {
        case "mobile":
          return searchByMobile(query);
        case "flat":
          return searchByFlat(query);
        case "name":
          return searchByName(query);
        default:
          setSearchResults([]);
      }
    },
    [searchByMobile, searchByFlat, searchByName]
  );

  const selectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCustomer(null);
    setSearchResults([]);
    setError(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    searchResults,
    selectedCustomer,
    isLoading,
    error,
    searchByMobile,
    searchByFlat,
    searchByName,
    search,
    selectCustomer,
    clearSearch,
    clearSelection,
  };
}
