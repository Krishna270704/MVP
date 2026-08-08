import api from './axios';
import { LoginResponse, Entity, Employee, Visitor, Notification } from '../types';

// Auth
export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { email, password });

// Entities
export const getEntities = () =>
  api.get<Entity[]>('/entities');

export const getEntityEmployees = (entityId: string) =>
  api.get<Employee[]>(`/entities/${entityId}/employees`);

// Visitors
export const createVisitor = (formData: FormData) =>
  api.post<Visitor>('/visitors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getVisitors = (params?: { status_filter?: string; today_only?: boolean }) =>
  api.get<Visitor[]>('/visitors', { params });

export const getVisitor = (id: string) =>
  api.get<Visitor>(`/visitors/${id}`);

export const approveVisitor = (id: string) =>
  api.patch<Visitor>(`/visitors/${id}/approve`);

export const declineVisitor = (id: string) =>
  api.patch<Visitor>(`/visitors/${id}/decline`);

export const checkoutVisitor = (id: string) =>
  api.patch<Visitor>(`/visitors/${id}/checkout`);

export const getVisitorHistory = (params?: {
  name?: string;
  mobile?: string;
  status_filter?: string;
  date?: string;
}) =>
  api.get<Visitor[]>('/visitors/history', { params });

export const searchVisitors = (params: { name?: string; mobile?: string }) =>
  api.get<Visitor[]>('/visitors/search', { params });

// Notifications
export const getNotifications = () =>
  api.get<Notification[]>('/notifications');

export const markNotificationRead = (id: string) =>
  api.patch(`/notifications/${id}/read`);
