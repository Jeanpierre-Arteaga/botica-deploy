// ============================================================
// BOTICA CENTRAL — Tipos TypeScript del API
// ============================================================
// Estos tipos matchean EXACTAMENTE los campos que devuelve el
// backend Express + PostgreSQL. Usamos snake_case porque así es
// como vienen las columnas de la BD. NO renombrar a camelCase.
// ============================================================


// ============================================================
// ENUMS Y CONSTANTES
// ============================================================

export type Role = 'admin' | 'emp' | 'cust';

export type OrderState = 'pendiente' | 'en proceso' | 'entregado' | 'cancelado';

export type DeliveryType = 'delivery' | 'pickup';

export type PaymentMethod = 'efectivo' | 'yape' | 'plin' | 'tarjeta' | 'transferencia';

export type VoucherType = 'boleta' | 'factura' | 'ticket';

export type ImageType = 'main' | 'gallery' | 'thumbnail';


// ============================================================
// AUTH
// ============================================================

// Payload del JWT cuando es staff/admin (login con user_code)
export interface StaffJwtPayload {
  user_id: number;
  role: 'admin' | 'emp';
  full_name: string;
  location_id: number | null;
  iat: number;
  exp: number;
}

// Payload del JWT cuando es customer (login con email)
export interface CustomerJwtPayload {
  customer_id: number;
  role: 'cust';
  full_name: string;
  email: string;
  iat: number;
  exp: number;
}

export type JwtPayload = StaffJwtPayload | CustomerJwtPayload;

// Lo que devuelve POST /api/auth/login (staff/admin)
export interface StaffLoginResponse {
  token: string;
  user: {
    user_id: number;
    user_code: string;
    full_name: string;
    role: 'admin' | 'emp';
    location_id: number | null;
    is_active: boolean;
  };
}

// Lo que devuelve POST /api/auth/customer-login y customer-register
export interface CustomerAuthResponse {
  token: string;
  customer: {
    customer_id: number;
    full_name: string;
    dni: string | null;
    address: string | null;
    phone: string | null;
    email: string;
    is_active: boolean;
    created_at: string;
  };
}


// ============================================================
// USERS (staff y admin)
// ============================================================

export interface User {
  user_id: number;
  user_code: string;
  full_name: string;
  role: 'admin' | 'emp';
  location_id: number | null;
  is_active: boolean;
  // user_password nunca viene en respuestas (sanitizado en backend)
}

export interface UserCreatePayload {
  user_code: string;
  user_password: string;
  full_name: string;
  role: 'admin' | 'emp';
  location_id?: number | null;
}

export interface UserUpdatePayload {
  user_code?: string;
  full_name?: string;
  location_id?: number | null;
  is_active?: boolean;
  // role NO se cambia por aquí. Usar updateRole con admin.
}


// ============================================================
// CUSTOMERS (clientes)
// ============================================================

export interface Customer {
  customer_id: number;
  full_name: string;
  dni: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CustomerCreatePayload {
  full_name: string;
  dni?: string;
  address?: string;
  phone?: string;
  email?: string;
  customer_password?: string;
}

export interface CustomerRegisterPayload {
  full_name: string;
  email: string;
  customer_password: string;
  dni?: string;
  address?: string;
  phone?: string;
}


// ============================================================
// CATÁLOGO (laboratory, category, product)
// ============================================================

export interface Laboratory {
  laboratory_id: number;
  laboratory_name: string;
  laboratory_country: string | null;
}

export interface Category {
  category_id: number;
  category_name: string;
  category_description: string | null;
}

// Producto base (lo que tienen las columnas de la tabla)
export interface ProductBase {
  product_id: number;
  product_name: string;
  active_ingredient: string | null;
  product_composition: string | null;
  contraindications: string | null;
  adverse_effects: string | null;
  product_batch: string | null;
  expiration_date: string | null;
  health_record: string | null;
  is_generic: boolean;
  product_price: number;
  is_active: boolean;
  is_offer: boolean;
  laboratory_id: number | null;
  category_id: number | null;
}

// Producto enriquecido (lo que devuelve productModel.findAll/findById)
// Incluye JOINs con laboratory, category, image, inventory
export interface Product extends ProductBase {
  laboratory_name?: string | null;
  category_name?: string | null;
  image_url?: string | null;
  // Si se pasó location_id en la query:
  current_stock?: number;
  min_stock?: number;
}

export interface ProductFilters {
  nombre?: string;
  laboratory_id?: number;
  category_id?: number;
  is_offer?: boolean;
  location_id?: number;
}

export interface ProductStockInfo {
  product_id: number;
  location_id: number;
  current_stock: number;
  min_stock: number;
}


// ============================================================
// SEDES
// ============================================================

export interface Location {
  location_id: number;
  location_name: string;
  location_address: string | null;
  district: string | null;
  location_phone: string | null;
  is_active: boolean;
}


// ============================================================
// PEDIDOS
// ============================================================

// Una línea de detalle de pedido (lo que viene en el array details)
export interface OrderDetail {
  detail_id?: number;
  amount: number;
  unit_price: number;
  sub_total_price: number;
  product_id: number;
  order_id?: number;
  product_name?: string;
  image_url?: string;
}

// Pedido completo (lo que devuelve findById, includes JOIN con customer/location/user)
export interface Order {
  order_id: number;
  order_state: OrderState;
  delivery_type: DeliveryType | null;
  order_date: string;
  total_price: number;
  customer_id: number | null;
  user_id: number | null;
  location_id: number | null;
  // Datos del customer (del JOIN):
  customer_name?: string | null;
  customer_dni?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  // Datos de location (del JOIN):
  location_name?: string | null;
  // Datos del user que registró (del JOIN, solo en walk-in):
  user_full_name?: string | null;
  // Detalles (sólo en findById):
  details?: OrderDetail[];
  // Pago (si existe):
  payment?: Payment | null;
}

// Payload para crear un pedido web (customer)
export interface OrderCreatePayload {
  order: {
    delivery_type: DeliveryType;
    location_id: number;
    customer_id: number;
    total_price: number;
  };
  details: Array<{
    product_id: number;
    amount: number;
    unit_price: number;
    sub_total_price: number;
  }>;
  payment?: {
    payment_method: PaymentMethod;
    voucher_type?: VoucherType;
    email_pay?: string;
    phone_pay?: string;
  };
}

// Payload para crear venta presencial (walk-in, staff)
export interface OrderWalkInPayload {
  order: {
    delivery_type: DeliveryType;
    location_id: number;
    customer_id?: number | null;
    total_price: number;
  };
  details: Array<{
    product_id: number;
    amount: number;
    unit_price: number;
    sub_total_price: number;
  }>;
  payment: {
    payment_method: PaymentMethod;
    voucher_type?: VoucherType;
    email_pay?: string;
    phone_pay?: string;
  };
}


// ============================================================
// PAGOS
// ============================================================

export interface Payment {
  payment_id: number;
  payment_method: PaymentMethod;
  total_price: number;
  voucher_type: VoucherType | null;
  email_pay: string | null;
  phone_pay: string | null;
  order_id: number;
}


// ============================================================
// INVENTARIO
// ============================================================

export interface InventoryItem {
  inventory_id: number;
  current_stock: number;
  min_stock: number;
  product_id: number;
  location_id: number;
  product_name?: string;
  location_name?: string;
}


// ============================================================
// IMÁGENES
// ============================================================

export interface ProductImage {
  image_id: number;
  url: string;
  type: ImageType;
  product_id: number;
}


// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardSummary {
  hoy: {
    ventas: number;
    pedidos: number;
    pendientes: number;
    ticket_promedio: number;
    ventas_vs_ayer_pct: number;
    pedidos_vs_ayer_pct: number;
  };
  mes: {
    ventas: number;
    pedidos: number;
    ventas_vs_mes_anterior_pct: number;
  };
  stock: {
    bajo_stock_count: number;
  };
  ventas_ultimos_7_dias: Array<{
    date: string;
    total: number;
    count: number;
  }>;
  pedidos_por_estado: {
    pendiente: number;
    'en proceso': number;
    entregado: number;
    cancelado: number;
  };
  top_productos_7_dias: Array<{
    product_id: number;
    product_name: string;
    total_vendido: number;
    total_ingresos: number;
  }>;
}


// ============================================================
// REPORTES
// ============================================================

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  byDay: Array<{ date: string; total: number; count: number }>;
  byCategory: Array<{
    category_id: number | null;
    category_name: string;
    total: number;
    count: number;
  }>;
  byPaymentMethod: Array<{
    payment_method: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total: number;
  }>;
}


// ============================================================
// ORDERS STATS Y SHIFT SUMMARY (staff)
// ============================================================

export interface OrdersStats {
  date: string;
  location_id: number | null;
  ventas: number;
  pedidos: number;
  pendientes: number;
  ticket_promedio: number;
  ventas_por_metodo_pago: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
}

export interface ShiftSummary {
  date: string;
  user_id: number;
  full_name: string;
  total_sales: number;
  total_transactions: number;
  average_ticket: number;
  by_payment_method: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
  transactions: Array<{
    order_id: number;
    order_date: string;
    total_price: number;
    order_state: OrderState;
    delivery_type: DeliveryType | null;
    customer_name: string | null;
    payment_method: string | null;
  }>;
}


// ============================================================
// API ERROR (errores del backend normalizados)
// ============================================================

export interface ApiErrorBody {
  message: string;
}
