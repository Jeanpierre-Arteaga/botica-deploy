// ============================================================
// BOTICA CENTRAL — Cliente HTTP del API
// ============================================================
// Cliente centralizado que habla con el backend Express.
// Toda llamada al backend pasa por aquí. NO hacer fetch sueltos
// en componentes.
//
// USO:
//   import { api } from './lib/api';
//   const products = await api.products.getAll({ is_offer: true });
//   await api.auth.loginStaff('ADMIN01', 'admin1234');
// ============================================================

import type {
  StaffLoginResponse,
  CustomerAuthResponse,
  CustomerRegisterPayload,
  ForgotPasswordResponse,
  ValidateResetResponse,
  User,
  UserCreatePayload,
  UserUpdatePayload,
  Customer,
  CustomerCreatePayload,
  Product,
  ProductFilters,
  ProductStockInfo,
  Laboratory,
  Category,
  Location,
  Order,
  OrderState,
  OrderCreatePayload,
  OrderWalkInPayload,
  InventoryItem,
  DashboardSummary,
  SalesReport,
  OrdersStats,
  ShiftSummary,
  PrescriptionScanResponse,
} from './types';

// ============================================================
// HELPERS DE NORMALIZACIÓN
// ============================================================
// PostgreSQL devuelve DECIMAL como string (precisión). Convertimos
// a number en la frontera del sistema (Anti-Corruption Layer).
// ============================================================

/** Convierte string|number|null|undefined a number. Devuelve 0 si no se puede. */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Convierte string|number|null|undefined a integer. Devuelve 0 si no se puede. */
function toInt(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Math.trunc(value);
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// Normalizadores por entidad. Cada uno convierte los campos DECIMAL/INT
// que el backend devuelve como string a number.

function normalizeProduct<T extends Record<string, any>>(p: T): T {
  if (!p) return p;
  return {
    ...p,
    product_price: toNumber(p.product_price),
    // old_price es nullable: preservamos null para no mostrar un tachado falso.
    old_price: p.old_price != null ? toNumber(p.old_price) : null,
    current_stock: p.current_stock !== undefined ? toInt(p.current_stock) : undefined,
    min_stock: p.min_stock !== undefined ? toInt(p.min_stock) : undefined,
  };
}

function normalizeOrderDetail<T extends Record<string, any>>(d: T): T {
  if (!d) return d;
  return {
    ...d,
    amount: toInt(d.amount),
    unit_price: toNumber(d.unit_price),
    sub_total_price: toNumber(d.sub_total_price),
  };
}

function normalizePayment<T extends Record<string, any>>(p: T): T {
  if (!p) return p;
  return {
    ...p,
    total_price: toNumber(p.total_price),
  };
}

function normalizeOrder<T extends Record<string, any>>(o: T): T {
  if (!o) return o;
  return {
    ...o,
    total_price: toNumber(o.total_price),
    details: Array.isArray(o.details) ? o.details.map(normalizeOrderDetail) : o.details,
    payment: o.payment ? normalizePayment(o.payment) : o.payment,
  };
}

function normalizeInventory<T extends Record<string, any>>(i: T): T {
  if (!i) return i;
  return {
    ...i,
    current_stock: toInt(i.current_stock),
    min_stock: toInt(i.min_stock),
  };
}

function normalizeProductStockInfo<T extends Record<string, any>>(s: T): T {
  if (!s) return s;
  return {
    ...s,
    current_stock: toInt(s.current_stock),
    min_stock: toInt(s.min_stock),
  };
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_BASE =
  (import.meta.env?.VITE_API_BASE as string) ||
  'http://localhost:3000/api';

const TOKEN_STORAGE_KEY = 'botica_token';

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

// El token vive en localStorage cuando la sesión es persistente
// ("Recordarme en este dispositivo") o en sessionStorage cuando NO
// lo es (solo dura mientras la pestaña esté abierta). Por defecto
// persistent=true para no cambiar el comportamiento de staff/admin.
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      localStorage.getItem(TOKEN_STORAGE_KEY)
    );
  },
  set(token: string, persistent = true): void {
    if (typeof window === 'undefined') return;
    if (persistent) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

// ============================================================
// ERROR HANDLING
// ============================================================

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ============================================================
// FETCH WRAPPER
// ============================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Si true, no incluye el token (para endpoints públicos como login) */
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, skipAuth = false } = opts;

  // Construir URL con query params
  let url = `${API_BASE}${path}`;
  if (query) {
    const search = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        search.append(k, String(v));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  // Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Fetch
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, 'Sin conexión con el servidor.', err);
  }

  // Status sin body (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  // Parsear body
  let data: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  // Error HTTP
  if (!response.ok) {
    const message =
      (data as { message?: string })?.message ||
      `Error ${response.status}`;

    // Notificar al AuthContext si es 401 (token expirado/inválido)
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api-unauthorized', { detail: { status: 401 } })
      );
    }

    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// ============================================================
// MULTIPART UPLOAD WRAPPER
// ============================================================
// Igual que request() pero para FormData (subida de archivos). NO fija
// Content-Type — el navegador lo hace con el boundary correcto. Incluye
// el token y reutiliza el mismo manejo de errores/401.
// ============================================================

async function uploadRequest<T>(
  path: string,
  form: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: form,
    });
  } catch (err) {
    throw new ApiError(0, 'Sin conexión con el servidor.', err);
  }

  let data: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (data as { message?: string })?.message || `Error ${response.status}`;
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api-unauthorized', { detail: { status: 401 } })
      );
    }
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// ============================================================
// AUTH
// ============================================================

const auth = {
  /** Login para staff y admin con user_code + password */
  async loginStaff(user_code: string, user_password: string): Promise<StaffLoginResponse> {
    const res = await request<StaffLoginResponse>('/auth/login', {
      method: 'POST',
      body: { user_code, user_password },
      skipAuth: true,
    });
    tokenStorage.set(res.token);
    return res;
  },

  /**
   * Login para customer con email + password.
   * remember=true → sesión persistente (localStorage + JWT largo).
   * remember=false → sesión de pestaña (sessionStorage + JWT corto).
   */
  async loginCustomer(
    email: string,
    customer_password: string,
    remember = false
  ): Promise<CustomerAuthResponse> {
    const res = await request<CustomerAuthResponse>('/auth/customer-login', {
      method: 'POST',
      body: { email, customer_password, remember },
      skipAuth: true,
    });
    tokenStorage.set(res.token, remember);
    return res;
  },

  /** Login / alta con Google (el front envía el access_token de GIS) */
  async loginWithGoogle(
    access_token: string,
    remember = true
  ): Promise<CustomerAuthResponse> {
    const res = await request<CustomerAuthResponse>('/auth/google', {
      method: 'POST',
      body: { access_token, remember },
      skipAuth: true,
    });
    tokenStorage.set(res.token, remember);
    return res;
  },

  /** Solicita el enlace de recuperación (respuesta genérica por seguridad) */
  forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return request<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      skipAuth: true,
    });
  },

  /** Valida que un token de reseteo siga vigente (pantalla B) */
  validateResetToken(token: string): Promise<ValidateResetResponse> {
    return request<ValidateResetResponse>('/auth/reset-password/validate', {
      method: 'POST',
      body: { token },
      skipAuth: true,
    });
  },

  /** Fija la nueva contraseña usando el token del correo */
  resetPassword(token: string, password: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      skipAuth: true,
    });
  },

  /** Registro de customer nuevo (auto-login incluido) */
  async registerCustomer(payload: CustomerRegisterPayload): Promise<CustomerAuthResponse> {
    const res = await request<CustomerAuthResponse>('/auth/customer-register', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
    tokenStorage.set(res.token);
    return res;
  },

  /** Cerrar sesión (solo borra el token local) */
  logout(): void {
    tokenStorage.clear();
  },
};

// ============================================================
// USERS (staff/admin, admin-only)
// ============================================================

const users = {
  /** GET /api/users — listar usuarios (admin) */
  getAll(): Promise<User[]> {
    return request<User[]>('/users');
  },

  /** GET /api/users/me — datos del usuario autenticado (staff/admin) */
  getMe(): Promise<User> {
    return request<User>('/users/me');
  },

  /** GET /api/users/:id — detalle de usuario (admin) */
  getById(user_id: number): Promise<User> {
    return request<User>(`/users/${user_id}`);
  },

  /** POST /api/users — crear usuario staff/admin (admin) */
  create(payload: UserCreatePayload): Promise<User> {
    return request<User>('/users', { method: 'POST', body: payload });
  },

  /** PUT /api/users/:id — actualizar datos del usuario (admin) */
  update(user_id: number, payload: UserUpdatePayload): Promise<User> {
    return request<User>(`/users/${user_id}`, { method: 'PUT', body: payload });
  },

  /** PATCH /api/users/:id/role — cambiar rol (admin) */
  updateRole(user_id: number, role: 'admin' | 'emp'): Promise<User> {
    return request<User>(`/users/${user_id}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  /** DELETE /api/users/:id (admin) */
  delete(user_id: number): Promise<void> {
    return request<void>(`/users/${user_id}`, { method: 'DELETE' });
  },
};

// ============================================================
// CUSTOMERS
// ============================================================

const customers = {
  /** GET /api/customers — listar clientes (admin/emp) */
  getAll(): Promise<Customer[]> {
    return request<Customer[]>('/customers');
  },

  /** GET /api/customers/me — datos del customer autenticado */
  getMe(): Promise<Customer> {
    return request<Customer>('/customers/me');
  },

  /** GET /api/customers/:id (admin/emp, o el propio cust) */
  getById(customer_id: number): Promise<Customer> {
    return request<Customer>(`/customers/${customer_id}`);
  },

  /** GET /api/customers/dni/:dni — buscar por DNI (admin/emp para POS) */
  getByDni(dni: string): Promise<Customer> {
    return request<Customer>(`/customers/dni/${dni}`);
  },

  /** POST /api/customers — crear customer (público para checkout walk-in) */
  create(payload: CustomerCreatePayload): Promise<Customer> {
    return request<Customer>('/customers', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  },

  /** PUT /api/customers/:id — actualizar (cust solo el suyo, staff cualquiera) */
  update(customer_id: number, payload: Partial<CustomerCreatePayload>): Promise<Customer> {
    return request<Customer>(`/customers/${customer_id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /** DELETE /api/customers/:id (admin) */
  delete(customer_id: number): Promise<void> {
    return request<void>(`/customers/${customer_id}`, { method: 'DELETE' });
  },
};

// ============================================================
// PRODUCTS
// ============================================================

const products = {
  /** GET /api/products — catálogo público con filtros */
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    const data = await request<Product[]>('/products', {
      query: filters as Record<string, string | number | boolean | undefined | null> | undefined,
      skipAuth: true,
    });
    return data.map(normalizeProduct);
  },

  /** GET /api/products/:id — detalle público */
  async getById(product_id: number, location_id?: number): Promise<Product> {
    const data = await request<Product>(`/products/${product_id}`, {
      query: { location_id },
      skipAuth: true,
    });
    return normalizeProduct(data);
  },

  /** GET /api/products/stock — info de stock de un producto en una sede */
  async getStock(productId: number, location_id: number): Promise<ProductStockInfo> {
    const data = await request<ProductStockInfo>('/products/stock', {
      query: { productId, location_id },
    });
    return normalizeProductStockInfo(data);
  },

  /** POST /api/products (admin) */
  async create(payload: Partial<Product>): Promise<Product> {
    const data = await request<Product>('/products', { method: 'POST', body: payload });
    return normalizeProduct(data);
  },

  /** PUT /api/products/:id (admin) */
  async update(product_id: number, payload: Partial<Product>): Promise<Product> {
    const data = await request<Product>(`/products/${product_id}`, {
      method: 'PUT',
      body: payload,
    });
    return normalizeProduct(data);
  },

  /** PATCH /api/products/:id (admin) — actualización parcial */
  async patch(product_id: number, payload: Partial<Product>): Promise<Product> {
    const data = await request<Product>(`/products/${product_id}`, {
      method: 'PATCH',
      body: payload,
    });
    return normalizeProduct(data);
  },

  /** PATCH /api/products/offers/:id — toggle oferta (admin) */
  async toggleOffer(product_id: number, is_offer: boolean): Promise<Product> {
    const data = await request<Product>(`/products/offers/${product_id}`, {
      method: 'PATCH',
      body: { is_offer },
    });
    return normalizeProduct(data);
  },

  /** DELETE /api/products/:id (admin) */
  delete(product_id: number): Promise<void> {
    return request<void>(`/products/${product_id}`, { method: 'DELETE' });
  },

  /**
   * POST /api/products/:id/image — sube una foto a S3/CloudFront (admin).
   * Usa multipart/form-data con el campo `image`. NO fijamos Content-Type:
   * el navegador añade el boundary correcto. Devuelve la URL pública.
   */
  uploadImage(product_id: number, file: File): Promise<{ image_url: string }> {
    const form = new FormData();
    form.append('image', file);
    return uploadRequest<{ image_url: string }>(
      `/products/${product_id}/image`,
      form
    );
  },

  /** DELETE /api/products/:id/image — quita la imagen principal (admin) */
  deleteImage(product_id: number): Promise<{ message: string; removed: number }> {
    return request<{ message: string; removed: number }>(
      `/products/${product_id}/image`,
      { method: 'DELETE' }
    );
  },
};

// ============================================================
// CATEGORIES
// ============================================================

const categories = {
  /** GET /api/categories — público (soporta filtro ?featured=true|false) */
  getAll(filters?: { featured?: boolean }): Promise<Category[]> {
    return request<Category[]>('/categories', {
      query: filters as Record<string, string | number | boolean | undefined | null> | undefined,
      skipAuth: true,
    });
  },

  /** GET /api/categories/:id */
  getById(category_id: number): Promise<Category> {
    return request<Category>(`/categories/${category_id}`, { skipAuth: true });
  },

  /** POST /api/categories (admin) */
  create(payload: Omit<Category, 'category_id'>): Promise<Category> {
    return request<Category>('/categories', { method: 'POST', body: payload });
  },

  /** PUT /api/categories/:id (admin) */
  update(category_id: number, payload: Partial<Category>): Promise<Category> {
    return request<Category>(`/categories/${category_id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /** DELETE /api/categories/:id (admin) */
  delete(category_id: number): Promise<void> {
    return request<void>(`/categories/${category_id}`, { method: 'DELETE' });
  },
};

// ============================================================
// LABORATORIES
// ============================================================

const laboratories = {
  /** GET /api/laboratories */
  getAll(): Promise<Laboratory[]> {
    return request<Laboratory[]>('/laboratories', { skipAuth: true });
  },

  /** GET /api/laboratories/:id */
  getById(laboratory_id: number): Promise<Laboratory> {
    return request<Laboratory>(`/laboratories/${laboratory_id}`, {
      skipAuth: true,
    });
  },

  /** POST /api/laboratories (admin) */
  create(payload: Omit<Laboratory, 'laboratory_id'>): Promise<Laboratory> {
    return request<Laboratory>('/laboratories', {
      method: 'POST',
      body: payload,
    });
  },

  /** PUT /api/laboratories/:id (admin) */
  update(laboratory_id: number, payload: Partial<Laboratory>): Promise<Laboratory> {
    return request<Laboratory>(`/laboratories/${laboratory_id}`, {
      method: 'PUT',
      body: payload,
    });
  },
};

// ============================================================
// LOCATIONS (sedes)
// ============================================================

const locations = {
  /** GET /api/locations — público */
  getAll(): Promise<Location[]> {
    return request<Location[]>('/locations', { skipAuth: true });
  },

  /** GET /api/locations/:id */
  getById(location_id: number): Promise<Location> {
    return request<Location>(`/locations/${location_id}`, { skipAuth: true });
  },

  /** POST /api/locations (admin) */
  create(payload: Omit<Location, 'location_id'>): Promise<Location> {
    return request<Location>('/locations', { method: 'POST', body: payload });
  },

  /** PUT /api/locations/:id (admin) */
  update(location_id: number, payload: Partial<Location>): Promise<Location> {
    return request<Location>(`/locations/${location_id}`, {
      method: 'PUT',
      body: payload,
    });
  },
};

// ============================================================
// ORDERS (pedidos)
// ============================================================

const orders = {
  /** GET /api/orders — listar pedidos (admin/emp) */
  async getAll(filters?: {
    location_id?: number;
    order_state?: OrderState;
    date_from?: string;
    date_to?: string;
  }): Promise<Order[]> {
    const data = await request<Order[]>('/orders', { query: filters });
    return data.map(normalizeOrder);
  },

  /** GET /api/orders/my-orders — pedidos del customer autenticado */
  async getMyOrders(): Promise<Order[]> {
    const data = await request<Order[]>('/orders/my-orders');
    return data.map(normalizeOrder);
  },

  /** GET /api/orders/stats?date= — KPIs del día (staff/admin) */
  getStats(date?: string): Promise<OrdersStats> {
    return request<OrdersStats>('/orders/stats', { query: { date } });
  },

  /** GET /api/orders/shift-summary?date= — cierre de caja del trabajador */
  getShiftSummary(date?: string): Promise<ShiftSummary> {
    return request<ShiftSummary>('/orders/shift-summary', { query: { date } });
  },

  /** GET /api/orders/:id — detalle del pedido */
  async getById(order_id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}`);
    return normalizeOrder(data);
  },

  /** POST /api/orders — crear pedido web (customer) */
  async create(payload: OrderCreatePayload): Promise<Order> {
    const data = await request<Order>('/orders', { method: 'POST', body: payload });
    return normalizeOrder(data);
  },

  /** POST /api/orders/walk-in — venta presencial (staff/admin) */
  async createWalkIn(payload: OrderWalkInPayload): Promise<Order> {
    const data = await request<Order>('/orders/walk-in', { method: 'POST', body: payload });
    return normalizeOrder(data);
  },

  /** PATCH /api/orders/:id/status — cambiar estado (staff cualquiera, cust solo cancelar pendientes) */
  async updateStatus(order_id: number, order_state: OrderState): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}/status`, {
      method: 'PATCH',
      body: { order_state },
    });
    return normalizeOrder(data);
  },

  /** PATCH /api/orders/:id/cancel — cancelación del cliente (no aplica a tarjeta) */
  async cancel(order_id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}/cancel`, {
      method: 'PATCH',
    });
    return normalizeOrder(data);
  },

  /** POST /api/orders/:id/cancel-with-refund — cancelación staff de pedido con tarjeta (refund manual) */
  async cancelWithRefund(
    order_id: number,
    data: { reason: string; refund_confirmed: boolean; force?: boolean }
  ): Promise<Order> {
    const res = await request<Order>(`/orders/${order_id}/cancel-with-refund`, {
      method: 'POST',
      body: data,
    });
    return normalizeOrder(res);
  },

  /** PATCH /api/orders/:id/status → 'en proceso' — validar pago manual (yape/plin/transferencia) */
  async validatePayment(order_id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}/status`, {
      method: 'PATCH',
      body: { order_state: 'en proceso' },
    });
    return normalizeOrder(data);
  },

  /** PATCH /api/orders/:id/status → 'entregado' — marcar pedido como entregado */
  async markDelivered(order_id: number): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}/status`, {
      method: 'PATCH',
      body: { order_state: 'entregado' },
    });
    return normalizeOrder(data);
  },

  /** PATCH /api/orders/:id/status → 'cancelado' — cancelación staff sin tarjeta */
  async staffCancel(order_id: number, reason: string): Promise<Order> {
    const data = await request<Order>(`/orders/${order_id}/status`, {
      method: 'PATCH',
      body: { order_state: 'cancelado', cancellation_reason: reason },
    });
    return normalizeOrder(data);
  },
};

// ============================================================
// INVENTORY
// ============================================================

const inventory = {
  /** GET /api/inventory — listar inventario (staff/admin) */
  async getAll(filters?: { location_id?: number; product_id?: number }): Promise<InventoryItem[]> {
    const data = await request<InventoryItem[]>('/inventory', { query: filters });
    return data.map(normalizeInventory);
  },

  /** POST /api/inventory (admin) */
  async create(payload: Omit<InventoryItem, 'inventory_id'>): Promise<InventoryItem> {
    const data = await request<InventoryItem>('/inventory', { method: 'POST', body: payload });
    return normalizeInventory(data);
  },

  /** PATCH /api/inventory/:id (admin) */
  async update(inventory_id: number, payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const data = await request<InventoryItem>(`/inventory/${inventory_id}`, {
      method: 'PATCH',
      body: payload,
    });
    return normalizeInventory(data);
  },

  /**
   * PUT /api/inventory/upsert (admin) — fija el stock de un producto en
   * una sede. Crea la fila si no existe o la actualiza (UNIQUE product+sede).
   */
  async upsert(payload: {
    product_id: number;
    location_id: number;
    current_stock: number;
    min_stock: number;
  }): Promise<InventoryItem> {
    const data = await request<InventoryItem>('/inventory/upsert', {
      method: 'PUT',
      body: payload,
    });
    return normalizeInventory(data);
  },
};

// ============================================================
// DASHBOARD (staff/admin)
// ============================================================

const dashboard = {
  /** GET /api/dashboard/summary — KPIs completos */
  getSummary(filters?: { location_id?: number; date?: string }): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary', { query: filters });
  },
};

// ============================================================
// PRESCRIPTIONS (recetas médicas → sugerencias con IA)
// ============================================================

const prescriptions = {
  /**
   * POST /api/prescriptions/scan — sube la foto de una receta (multipart,
   * campo `image`), la IA la lee y devuelve productos del catálogo que
   * coinciden + los no encontrados. NO fijamos Content-Type: el navegador
   * añade el boundary correcto. Normalizamos los precios a number.
   */
  async scan(file: File): Promise<PrescriptionScanResponse> {
    const form = new FormData();
    form.append('image', file);
    const data = await uploadRequest<PrescriptionScanResponse>(
      '/prescriptions/scan',
      form
    );
    return {
      matched: Array.isArray(data.matched)
        ? data.matched.map((m) => ({
            ...m,
            product_price: toNumber(m.product_price),
            old_price: m.old_price != null ? toNumber(m.old_price) : null,
            quantity: toInt(m.quantity) || 1,
          }))
        : [],
      unmatched: Array.isArray(data.unmatched) ? data.unmatched : [],
      notes: typeof data.notes === 'string' ? data.notes : '',
    };
  },
};

// ============================================================
// REPORTS (admin)
// ============================================================

const reports = {
  /** GET /api/reports/sales — reporte de ventas (admin) */
  getSales(params: {
    date_from: string;
    date_to: string;
    location_id?: number;
  }): Promise<SalesReport> {
    return request<SalesReport>('/reports/sales', { query: params });
  },
};

// ============================================================
// EXPORT
// ============================================================

export const api = {
  auth,
  users,
  customers,
  products,
  categories,
  laboratories,
  locations,
  orders,
  inventory,
  dashboard,
  reports,
  prescriptions,
};

export default api;
