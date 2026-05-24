// ============================================================
// CartContext — Carrito de compras del customer
// ============================================================
// Persiste en localStorage hasta que el usuario vacíe el carrito
// o complete la compra. Maneja items con producto + cantidad.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import type { Product } from './types';

// ============================================================
// TIPOS
// ============================================================

export interface CartItem {
  product_id: number;
  product_name: string;
  product_price: number;
  image_url?: string | null;
  amount: number;
  // Snapshot del producto al momento de agregar (por si cambia el precio luego)
  unit_price: number;
  // Stock disponible al momento de agregar (para mostrar warning si baja)
  available_stock?: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isEmpty: boolean;
  addItem: (product: Product, amount?: number) => void;
  removeItem: (product_id: number) => void;
  updateAmount: (product_id: number, amount: number) => void;
  clear: () => void;
  getItem: (product_id: number) => CartItem | undefined;
}

// ============================================================
// CONTEXT
// ============================================================

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'botica_cart';

// ============================================================
// HELPERS
// ============================================================

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignorar si localStorage está lleno (raro)
  }
}

// ============================================================
// PROVIDER
// ============================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  // Persistir cada vez que cambia
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  // Agregar item (o incrementar cantidad si ya existe)
  const addItem = useCallback((product: Product, amount: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);

      if (existing) {
        // Si ya está en el carrito, sumar cantidad
        const newAmount = existing.amount + amount;
        // Validar stock si lo conocemos
        if (
          existing.available_stock !== undefined &&
          newAmount > existing.available_stock
        ) {
          toast.warning(`Solo hay ${existing.available_stock} unidades disponibles`);
          return prev.map((i) =>
            i.product_id === product.product_id
              ? { ...i, amount: existing.available_stock! }
              : i
          );
        }
        toast.success(`Cantidad actualizada en el carrito`);
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, amount: newAmount } : i
        );
      }

      // Agregar nuevo item
      toast.success(`${product.product_name} agregado al carrito`);
      const newItem: CartItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        image_url: product.image_url,
        amount,
        unit_price: product.product_price,
        available_stock: product.current_stock,
      };
      return [...prev, newItem];
    });
  }, []);

  // Quitar item
  const removeItem = useCallback((product_id: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product_id === product_id);
      if (item) {
        toast.info(`${item.product_name} eliminado del carrito`);
      }
      return prev.filter((i) => i.product_id !== product_id);
    });
  }, []);

  // Actualizar cantidad (con validación de stock)
  const updateAmount = useCallback((product_id: number, amount: number) => {
    if (amount <= 0) {
      // Si la cantidad llega a 0, removemos
      setItems((prev) => prev.filter((i) => i.product_id !== product_id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product_id !== product_id) return i;
        // Validar stock
        if (i.available_stock !== undefined && amount > i.available_stock) {
          toast.warning(`Solo hay ${i.available_stock} unidades disponibles`);
          return { ...i, amount: i.available_stock };
        }
        return { ...i, amount };
      })
    );
  }, []);

  // Vaciar carrito
  const clear = useCallback(() => {
    setItems([]);
  }, []);

  // Obtener un item
  const getItem = useCallback(
    (product_id: number) => items.find((i) => i.product_id === product_id),
    [items]
  );

  // Cálculos derivados
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.amount, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unit_price * i.amount, 0),
    [items]
  );

  const isEmpty = items.length === 0;

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    isEmpty,
    addItem,
    removeItem,
    updateAmount,
    clear,
    getItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }
  return ctx;
}
