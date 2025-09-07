// Customer-related type definitions

export interface Customer {
  _id?: string;
  customerName: string;
  mobileNumber: string;
  countryCode: string;
  flatNumber: string;
  societyName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerSearchResult extends Customer {
  score?: number;
}

export interface CreateCustomerDto {
  customerName: string;
  mobileNumber: string;
  countryCode: string;
  flatNumber: string;
  societyName: string;
  [key: string]: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  id: string;
}

export interface CustomerFilters {
  societyName?: string;
  search?: string;
  [key: string]: string | undefined;
}
