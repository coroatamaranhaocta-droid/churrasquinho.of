/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash, Ticket, ArrowRight } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface Props {
  cartItems: CartItem[];
  onAddToCart: (p: any) => void;
  onRemoveFromCart: (p: any) => void;
  onClearCartItem: (p: any) => void;
  deliveryFee: number;
  availableCoupons: Coupon[];
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (c: Coupon | null) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onClearCartItem,
  deliveryFee,
  availableCoupons,
  couponCode,
  setCouponCode,
  appliedCoupon,
  setAppliedCoupon,
  onCheckout,
  isOpen,
  onClose
}: Props) {
  const [typedCode, setTypedCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const trimmed = typedCode.trim().toUpperCase();
    if (!trimmed) return;

    const coupon = availableCoupons.find(c => c.code.toUpperCase() === trimmed && c.isActive);

    if (!coupon) {
      setCouponError('Cupom inválido ou expirado.');
      setAppliedCoupon(null);
      setCouponCode('');
      return;
    }

    if (subtotal < coupon.minOrder) {
      setCouponError(`Mínimo de R$ ${coupon.minOrder.toFixed(2).replace('.', ',')} em produtos.`);
      setAppliedCoupon(null);
      setCouponCode('');
      return;
    }

    // Apply Coupon Successfully
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponSuccess(`Cupom ${coupon.code} aplicado com sucesso!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setTypedCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // Re-evaluate discount
  let discountValue = 0;
  if (appliedCoupon) {
    if (subtotal >= appliedCoupon.minOrder) {
      if (appliedCoupon.type === 'percent') {
        discountValue = (subtotal * appliedCoupon.value) / 100;
      } else {
        discountValue = appliedCoupon.value;
      }
    } else {
      // Auto disable if subtotal fell below min
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('O valor mínimo do cupom não é mais atendido.');
    }
  }

  const total = Math.max(0, subtotal - discountValue + deliveryFee);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-950 shadow-2xl flex flex-col h-full transform transition-all duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-600 dark:text-red-500" />
              <h2 className="text-lg font-display font-extrabold text-neutral-900 dark:text-neutral-50">
                Seu Carrinho ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer focus:outline-none p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag className="w-16 h-16 text-neutral-300 dark:text-neutral-800 mb-4 stroke-[1.5]" />
                <h3 className="font-display font-bold text-neutral-700 dark:text-neutral-300 text-base">
                  Seu carrinho está vazio
                </h3>
                <p className="text-neutral-400 text-xs mt-1.5 max-w-xs leading-relaxed">
                  Dê um pulo no nosso cardápio e adicione os espetinhos mais suculentos da cidade!
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2 bg-neutral-950 hover:bg-red-600 dark:bg-neutral-800 dark:hover:bg-red-700 text-white rounded-full text-xs font-semibold shadow-md cursor-pointer transition-all focus:outline-none"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = item.product.price;
                  return (
                    <div
                      key={item.product.id}
                      className="flex gap-4 p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-900 rounded-xl"
                    >
                      {/* Thumnail */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded-lg bg-neutral-100 shrink-0 border border-neutral-200 dark:border-neutral-800"
                      />

                      {/* Info & Quantity controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-neutral-200 truncate leading-tight">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => onClearCartItem(item.product)}
                              className="text-neutral-400 hover:text-red-500 cursor-pointer p-0.5 rounded"
                              title="Remover"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            R$ {itemPrice.toFixed(2).replace('.', ',')} un.
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Counter */}
                          <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 rounded-full py-0.5 px-2 bg-white dark:bg-neutral-950 scale-90 origin-left">
                            <button
                              onClick={() => onRemoveFromCart(item.product)}
                              className="text-neutral-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-0.5 focus:outline-none"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onAddToCart(item.product)}
                              disabled={item.quantity >= item.product.stock}
                              className="text-neutral-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-0.5 focus:outline-none disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-200 font-mono">
                            R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Billing Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-100 dark:border-neutral-800 p-6 space-y-4 shrink-0 bg-neutral-50/55 dark:bg-neutral-950">
              
              {/* Coupon Row */}
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Cupom de Desconto"
                      value={typedCode}
                      onChange={(e) => setTypedCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer focus:outline-none transition-colors"
                  >
                    Aplicar
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-2 px-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-red-800 dark:text-red-300 font-medium">
                    <Ticket className="w-3.5 h-3.5 text-red-500" />
                    <span>Cupom {appliedCoupon.code} Ativo</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}

              {/* Coupon Messages */}
              {couponError && <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}

              {/* Core Calculations */}
              <div className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-200">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Desconto</span>
                    <span className="font-mono">
                      - R$ {discountValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-200">
                    {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-neutral-900 dark:text-neutral-100 font-bold pt-1.5 border-t border-neutral-100 dark:border-neutral-900">
                  <span>Total Geral</span>
                  <span className="font-mono text-red-600 dark:text-red-400 text-base">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Checkout buttons */}
              <button
                id="btn-proseguir"
                onClick={onCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-red-500/10 cursor-pointer focus:outline-none transition-all active:scale-[0.98]"
              >
                <span>Prosseguir para Entrega</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
