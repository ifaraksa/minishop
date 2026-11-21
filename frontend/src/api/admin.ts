import { apiRequest } from './client';
import type { AdminUser, Order, OrderStatus, Product, ProductPayload } from '../types';

export function loginAdmin(email: string, password: string) {
  return apiRequest<{ token: string; user: AdminUser }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function getAdminProfile() {
  return apiRequest<AdminUser>('/auth/me', { auth: true });
}

export function logoutAdmin() {
  return apiRequest<null>('/auth/logout', {
    method: 'POST',
    auth: true,
  });
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>('/admin/products', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function updateProduct(id: number, payload: Partial<ProductPayload>) {
  return apiRequest<Product>(`/admin/products/${id}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

export function deleteProduct(id: number) {
  return apiRequest<null>(`/admin/products/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getAdminOrders(page = 1, status?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (status) params.set('status', status);
  const query = params.toString();
  return apiRequest<Order[]>(`/admin/orders${query ? `?${query}` : ''}`, { auth: true });
}

export function getAdminOrder(id: number) {
  return apiRequest<Order>(`/admin/orders/${id}`, { auth: true });
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  return apiRequest<Order>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  });
}
