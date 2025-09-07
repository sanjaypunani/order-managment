// Common API response types and utility types

export interface WalletResult {
  success: boolean;
  walletUsed: boolean;
  transactionId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  amountProcessed?: number;
  finalAmountAfterWallet?: number; // Add this to track the final amount customer needs to pay
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  wallet?: WalletResult; // Add wallet information to API response
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "date" | "tel";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
