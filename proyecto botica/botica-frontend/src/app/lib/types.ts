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
    location_name?: string | null;
    is_active: boolean;
  };
}

// Lo que devuelve POST /api/auth/customer-login, customer-register y google
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

// POST /api/auth/forgot-password — respuesta SIEMPRE genérica.
// dev_link solo aparece en desarrollo cuando no hay SMTP configurado.
export interface ForgotPasswordResponse {
  message: string;
  dev_link?: string;
}

// POST /api/auth/reset-password/validate
export interface ValidateResetResponse {
  valid: boolean;
  message?: string;
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
  /** Nombre de la sede (viene del LEFT JOIN con location en /users/me y /users) */
  location_name?: string | null;
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

// GET /api/customers/check — verificación en vivo en el registro (solo booleanos).
export interface CustomerCheckResponse {
  /** El email ya pertenece a un customer (activo o inactivo). */
  email_taken?: boolean;
  /** El DNI ya existe en algún customer. */
  dni_taken?: boolean;
  /** El DNI ya tiene cuenta web (debe iniciar sesión, no registrarse). */
  dni_has_account?: boolean;
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
  // Nuevos campos (opcionales para backward compatibility):
  icon_name?: string | null;
  color_hex?: string | null;
  is_featured?: boolean;
  display_order?: number;
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
  /** Precio anterior (tachado). Solo se muestra si is_offer y old_price > product_price. */
  old_price: number | null;
  is_active: boolean;
  is_offer: boolean;
  laboratory_id: number | null;
  category_id: number | null;
}

// Producto enriquecido (lo que devuelve productModel.findAll/findById)
// Incluye JOINs con laboratory, category, image, inventory
export interface Product extends ProductBase {
  laboratory_name?: string | null;
  /** País de origen del laboratorio. Forward-compatible: el endpoint de
   *  detalle aún NO lo expone (ver nota en ProductoDetalle). Llega undefined. */
  laboratory_country?: string | null;
  category_name?: string | null;
  image_url?: string | null;
  /** Galería completa (main + gallery + thumbnail). Forward-compatible:
   *  el endpoint de detalle aún NO la expone; mientras tanto se usa image_url. */
  images?: ProductImage[];
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
  /** Solo admin: incluye productos desactivados (is_active=false). */
  include_inactive?: boolean;
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
  /** Correo de contacto de la sede. */
  location_email: string | null;
  /** Horario de atención en texto libre. */
  schedule: string | null;
  /** Texto de búsqueda para Google Maps (fallback: location_address). */
  maps_query: string | null;
  /** pg serializa NUMERIC como string; opcional (futuro pin con Leaflet). */
  latitude: string | null;
  longitude: string | null;
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
  /** Correlativo del pedido DENTRO de los pedidos del cliente (1 = el primero).
   *  Solo para la vista del cliente; NO reemplaza al order_id real. */
  display_number?: number;
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
  customer_email?: string | null;
  customer_address?: string | null;
  // Datos de location (del JOIN):
  location_name?: string | null;
  // Datos del user que registró (del JOIN, solo en walk-in):
  user_full_name?: string | null;
  employee_name?: string | null;
  // Campos de entrega:
  delivery_address?: string | null;
  delivery_phone?: string | null;
  delivery_notes?: string | null;
  // Auditoría de cancelación:
  cancelled_by_user_id?: number | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  refund_processed?: boolean;
  cancelled_by_name?: string | null;
  // Detalles (sólo en findById):
  details?: OrderDetail[];
  // Pago (si existe):
  payment?: Payment | null;
}

// Payload para crear un pedido web (customer) — formato plano del Checkout
// integrado con MercadoPago. Si payment_method === 'tarjeta', el backend
// procesa el cargo con MP usando card_token antes de tocar la BD.
export interface OrderCreatePayload {
  items: Array<{
    product_id: number;
    amount: number;
    unit_price: number;
  }>;
  delivery_type: DeliveryType;
  address?: string | null;
  phone?: string;
  notes?: string;
  payment_method: PaymentMethod;
  voucher_type?: VoucherType;
  location_id: number;

  // Solo si payment_method === 'tarjeta' (lo genera el Card Payment Brick de MP)
  card_token?: string;
  mp_payment_method_id?: string;
  installments?: number;
  payer_email?: string;
  payer_identification?: { type: string; number: string };
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
  // Campos MercadoPago (solo si payment_method === 'tarjeta')
  mp_payment_id?: string | null;
  mp_status?: string | null;
  mp_status_detail?: string | null;
  /** URL (CloudFront) del comprobante interno en PDF, si ya fue generado. */
  voucher_pdf_url?: string | null;
}

// GET /api/orders/:id/voucher — comprobante interno (PDF)
export interface VoucherResponse {
  order_id: number;
  voucher_type: VoucherType | null;
  voucher_pdf_url: string;
  cached: boolean;
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

// GET /api/orders/sales-series — serie diaria para el gráfico del dashboard
export interface SalesSeriesPoint {
  date: string;   // 'YYYY-MM-DD'
  ventas: number;
  pedidos: number;
}

export interface SalesSeriesResponse {
  days: number;
  location_id: number | null;
  series: SalesSeriesPoint[];
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
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
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
// RECETAS MÉDICAS (lectura con IA → sugerencias para el carrito)
// ============================================================

export type PrescriptionConfidence = 'alta' | 'media' | 'baja';

// Producto del catálogo emparejado con un medicamento detectado en la receta.
export interface PrescriptionMatch {
  product_id: number;
  product_name: string;
  active_ingredient: string | null;
  product_price: number;
  old_price: number | null;
  is_offer: boolean;
  image_url: string | null;
  /** Cantidad sugerida (default 1 si la receta no la indica). */
  quantity: number;
  /** Texto del medicamento tal como se detectó en la receta. */
  detected_name: string;
  /** Dosis/concentración detectada (ej. "500mg"); null si no aparece. */
  strength: string | null;
  confidence: PrescriptionConfidence;
}

// Medicamento detectado que NO existe en el catálogo (para transparencia).
export interface PrescriptionUnmatched {
  detected_name: string;
  active_ingredient: string | null;
  reason: string;
}

// Respuesta de POST /api/prescriptions/scan
export interface PrescriptionScanResponse {
  matched: PrescriptionMatch[];
  unmatched: PrescriptionUnmatched[];
  /** Observaciones de la IA (ej. partes ilegibles de la receta). */
  notes: string;
}


// ============================================================
// API ERROR (errores del backend normalizados)
// ============================================================

export interface ApiErrorBody {
  message: string;
}
