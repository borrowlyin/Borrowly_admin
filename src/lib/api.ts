// API configuration for admin panel
export const API_BASE_URL = "http://localhost:8080";


export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

// Common API endpoints for admin
export const API_ENDPOINTS = {
  ADMIN_LOGIN: "/api/admin/login",
  ADMIN_REGISTER: "/api/admin/register",
  DASHBOARD_STATS: "/api/v1/admin/dashboard/statics",
  PRODUCTS: "/api/products",
  ADMIN_PRODUCTS: "/api/admin/products",
  PRODUCT_DETAIL: (id: string) => `/api/admin/products/${id}`,
  ORDERS: "/api/orders",
  ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  USERS: "/api/user/users",
  ADMIN_COUPONS: "/api/admin/coupons",
  COUPON_DETAIL: (id: string) => `/api/admin/coupons/${id}`,
  UPLOAD: "/api/upload",
  NOTIFICATIONS: "/api/notifications",
};

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("admin_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for API requests
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const headers = getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};
