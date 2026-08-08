export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'receptionist' | 'employee';
  entity_id?: string;
  entity_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Entity {
  _id: string;
  name: string;
  created_at?: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  entity_id?: string;
}

export interface Visitor {
  _id: string;
  name: string;
  mobile: string;
  company: string;
  purpose: string;
  visitor_type: string;
  entity_id: string;
  entity_name?: string;
  host_employee_id: string;
  host_name?: string;
  photo_url?: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'waiting' | 'approved' | 'declined' | 'checked_out';
  pass_id?: string;
  qr_code_data?: string;
  registered_by?: string;
  created_at?: string;
}

export interface Notification {
  _id: string;
  user_id: string;
  message: string;
  type: 'visitor_arrival' | 'visitor_approved' | 'visitor_declined';
  visitor_id?: string;
  is_read: boolean;
  created_at?: string;
}

export type VisitorStatus = 'waiting' | 'approved' | 'declined' | 'checked_out';
