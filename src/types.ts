/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 'espetinhos' | 'combos' | 'bebidas' | 'adicionais';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryType;
  image: string;
  stock: number; // Available quantity
  isPromo?: boolean;
  promoPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';
export type CardType = 'debito' | 'credito';

export interface PaymentDetails {
  pixReceiptUrl?: string;
  cashChangeFor?: string; // Troco para quanto
  cardType?: CardType; // débito ou crédito
}

export type OrderStatus = 'pending' | 'preparing' | 'delivery' | 'completed' | 'cancelled';

export interface Order {
  id: string; // autoincrement / sequential like #00125
  createdAt: string; // ISO string or format YYYY-MM-DD HH:mm:ss
  customerName: string;
  phone: string;
  address: string;
  reference: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: OrderStatus;
  couponCode?: string;
}

export interface Coupon {
  code: string;
  value: number; // raw value or percentage
  type: 'fixed' | 'percent';
  minOrder: number;
  isActive: boolean;
}

export interface DashboardStats {
  totalSalesToday: number;
  orderCountToday: number;
  pendingOrders: number;
  completedOrders: number;
  salesHistory: { date: string; amount: number; count: number }[];
}
