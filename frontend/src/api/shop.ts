import { apiRequest } from './client';
import type { Category, CheckoutPayload, Order, Product } from '../types';

export interface ProductQueryParams {
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export function getCategories(signal?: AbortSignal) {
  return apiRequest<Category[]>('/categories', { signal });
}

export function getProducts(params: ProductQueryParams = {}, signal?: AbortSignal) {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }
  if (params.category) {
    searchParams.set('category', params.category);
  }
  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page));
  }
  if (params.per_page) {
    searchParams.set('per_page', String(params.per_page));
  }

  const query = searchParams.toString();
  return apiRequest<Product[]>(`/products${query ? `?${query}` : ''}`, { signal });
}

export function getProduct(id: number, signal?: AbortSignal) {
  return apiRequest<Product>(`/products/${id}`, { signal });
}

export function createOrder(payload: CheckoutPayload) {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: payload,
  });
}
