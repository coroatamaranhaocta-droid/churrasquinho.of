/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface Props {
  product: Product;
  quantityInCart: number;
  onAddToCart: (p: Product) => void;
  onRemoveFromCart: (p: Product) => void;
  isClosed: boolean;
  key?: string | number;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
  isClosed
}: Props) {
  const isOutOfStock = product.stock <= 0;
  const isPromo = product.isPromo && product.promoPrice && product.promoPrice < product.price;
  const activePrice = isPromo && product.promoPrice ? product.promoPrice : product.price;

  return (
    <div
      id={`product-card-${product.id}`}
      className={`relative flex flex-col h-full overflow-hidden rounded-2xl border transition-all duration-300 group
        ${isOutOfStock 
          ? 'bg-neutral-50/70 border-neutral-200 dark:bg-neutral-900/40 dark:border-neutral-800 opacity-80' 
          : 'bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-red-950/20 hover:border-red-500/30'
        }`}
    >
      {/* Promotional Ribbons / Badges */}
      {isPromo && !isOutOfStock && (
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-rose-900 bg-rose-100 rounded-full dark:bg-rose-950 dark:text-rose-100 animate-pulse uppercase border border-rose-200 dark:border-rose-900">
          Promoção
        </span>
      )}

      {/* Stock warning ribbon */}
      {product.stock <= 5 && product.stock > 0 && !isOutOfStock && (
        <span className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[10px] font-semibold text-amber-900 bg-amber-100 rounded-full dark:bg-amber-950 dark:text-amber-100 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Últimas {product.stock} un.</span>
        </span>
      )}

      {/* Image container */}
      <div className="relative w-full aspect-video overflow-hidden bg-neutral-900 shrink-0">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${isOutOfStock ? 'grayscale blur-[1px]' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-4 py-1.5 font-display text-sm font-bold tracking-wider uppercase text-white bg-red-600 rounded-full shadow-lg border border-red-500">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-col flex-grow p-4.5">
        <div className="flex-grow">
          {/* Category breadcrumb */}
          <span className="text-[10px] uppercase tracking-wider font-extrabold font-display text-red-600 dark:text-red-400">
            {product.category}
          </span>
          {/* Name */}
          <h3 className="mt-1 font-display font-bold text-gray-950 dark:text-gray-100 text-base leading-tight">
            {product.name}
          </h3>
          {/* Description */}
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Pricing and Action Row */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0">
          <div>
            {isPromo ? (
              <div className="flex flex-col">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-lg font-display font-extrabold text-red-600 dark:text-red-400">
                  R$ {activePrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <span className="text-lg font-display font-extrabold text-neutral-900 dark:text-neutral-100">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="text-xs text-neutral-400 dark:text-neutral-600 font-medium">Por hoje acabou!</span>
            ) : isClosed ? (
              <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold text-right leading-tight block">
                Estabelecimento<br />fechado
              </span>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center bg-red-50 dark:bg-neutral-900 border border-red-300 dark:border-red-900/55 rounded-full p-1 shadow-sm">
                <button
                  onClick={() => onRemoveFromCart(product)}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-neutral-800 hover:text-red-700 cursor-pointer focus:outline-none"
                  title="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold font-mono text-gray-900 dark:text-white">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={quantityInCart >= product.stock}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-neutral-800 hover:text-red-700 cursor-pointer focus:outline-none disabled:opacity-30 disabled:pointer-events-none"
                  title="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id={`btn-add-${product.id}`}
                onClick={() => onAddToCart(product)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold shadow-md active:scale-95 duration-200 transition-all cursor-pointer hover:shadow-red-500/10 focus:outline-none"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
