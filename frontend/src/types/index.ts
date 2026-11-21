export interface PaginationMeta {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors: Record<string, unknown>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  category?: Category;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  status: OrderStatus | string;
  created_at: string;
  items?: OrderItem[];
  items_count?: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StockShortage {
  product_id: number;
  name: string;
  requested: number;
  available: number;
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface ProductPayload {
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
}
