// Product Management Types
export interface Product {
  _id?: string;
  name: string;
  nameGujarati: string;
  nameEnglish: string;
  price: number;
  unit: "KG" | "GM" | "PCS";
  quantity: number;
  category: string;
  isActive: boolean;
  isAvailable: boolean;
  stockQuantity?: number;
  imageUrl?: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  _id?: string;
  name: string;
  nameGujarati: string;
  nameEnglish: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  nameGujarati: string;
  nameEnglish: string;
  price: number;
  unit: "KG" | "GM" | "PCS";
  quantity: number;
  category: string;
  isActive: boolean;
  isAvailable: boolean;
  stockQuantity?: number;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  categories?: ProductCategory[];
}
