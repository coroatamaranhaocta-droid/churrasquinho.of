/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Search,
  ShoppingBag,
  Sliders,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  ShieldAlert,
  ArrowRight,
  Printer,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  Heart,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { CartItem, Product, Coupon, CategoryType, Order } from './types';
import PromoBanner from './components/PromoBanner';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Configuration databases
  const [products, setProducts] = useState<Product[]>([]);
  const [configs, setConfigs] = useState({
    pixKey: 'coroata.maranhao.cta@gmail.com',
    whatsappNumber: '5599984545370',
    deliveryFee: 5.0,
    businessOpen: true,
    promoBannerText: '🔥 PEDIDO ONLINE COM ENTREGA RÁPIDA E NA BRASA! Use o cupom CHEF10 e ganhe 10% de desconto!'
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // UX View States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'todas'>('todas');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');

  // UI Open/Closed Toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Notifications and successes
  const [notifications, setNotifications] = useState<string[]>([]);
  const [lastOrderPlaced, setLastOrderPlaced] = useState<Order | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Sync data on startup and state updates
  const loadStorefrontData = async () => {
    try {
      const [productsRes, configsRes, couponsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/configs'),
        fetch('/api/coupons')
      ]);

      if (productsRes.ok && configsRes.ok && couponsRes.ok) {
        const prodData = await productsRes.json();
        const confData = await configsRes.json();
        const coupData = await couponsRes.json();

        setProducts(prodData);
        setConfigs(confData);
        setCoupons(coupData);
      }
    } catch (err) {
      console.error('Error synchronizing storefront database:', err);
    }
  };

  useEffect(() => {
    loadStorefrontData();

    // Setup initial welcome notification ticker
    setNotifications(['Bem-vindo ao Churrasquinho do Chef! 🔥 Prepare-se para espetinhos crocantes e suculentos na brasa.']);

    // Check localStorage theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Update categories of darkmode on document class
  const handleToggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (!configs.businessOpen) return;

    // Check stock rules
    const index = cartItems.findIndex((it) => it.product.id === product.id);
    const existingQty = index !== -1 ? cartItems[index].quantity : 0;

    if (existingQty >= product.stock) {
      setNotifications([...notifications, `Ops! Quantidade máxima em estoque para ${product.name} atingida.`]);
      return;
    }

    if (index !== -1) {
      const updated = [...cartItems];
      updated[index].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }

    // Short tactile notice
    if (notifications.length < 5) {
      setNotifications([...notifications, `${product.name} adicionado ao carrinho!`]);
    }
  };

  const handleRemoveFromCart = (product: Product) => {
    const index = cartItems.findIndex((it) => it.product.id === product.id);
    if (index === -1) return;

    const updated = [...cartItems];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      setCartItems(updated);
    } else {
      updated.splice(index, 1);
      setCartItems(updated);
    }
  };

  const handleClearCartItem = (product: Product) => {
    setCartItems(cartItems.filter((it) => it.product.id !== product.id));
  };

  // Checkout submission handler
  const handleSubmitOrder = async (orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    reference: string;
    paymentMethod: any;
    paymentDetails: any;
  }) => {
    try {
      const subtotal = cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
      let disc = 0;
      if (appliedCoupon) {
        disc = appliedCoupon.type === 'percent' ? (subtotal * appliedCoupon.value) / 100 : appliedCoupon.value;
      }

      const total = Math.max(0, subtotal - disc + configs.deliveryFee);

      const orderBody = {
        customerName: orderDetails.customerName,
        phone: orderDetails.phone,
        address: orderDetails.address,
        reference: orderDetails.reference,
        items: cartItems.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity
        })),
        subtotal,
        discount: disc,
        total,
        paymentMethod: orderDetails.paymentMethod,
        paymentDetails: orderDetails.paymentDetails,
        couponCode: couponCode || undefined
      };

      // 1. Save to custom file database via Express
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar pedido.');
      }

      const orderCreated: Order = await res.json();
      setLastOrderPlaced(orderCreated);

      // 2. Clear Front End States
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponCode('');
      setIsCheckoutOpen(false);
      setIsCartOpen(false);

      // 3. Compile and Trigger WhatsApp API redirect
      compileAndSendWhatsAppMsg(orderCreated);

      // 4. Reveal success dashboard
      setShowSuccessScreen(true);

      // Refetch storefront database to update stock counters!
      loadStorefrontData();
    } catch (err) {
      console.error(err);
      alert('Houve um problema ao finalizar o pedido. Verifique os dados e tente novamente.');
    }
  };

  const compileAndSendWhatsAppMsg = (order: Order) => {
    const isPix = order.paymentMethod === 'pix';
    const isDinheiro = order.paymentMethod === 'dinheiro';
    const isCartao = order.paymentMethod === 'cartao';

    let methodLabel = '';
    if (isPix) methodLabel = 'PIX';
    if (isDinheiro) {
      methodLabel = order.paymentDetails?.cashChangeFor
        ? `Dinheiro (Troco para R$ ${Number(order.paymentDetails.cashChangeFor).toFixed(2).replace('.', ',')})`
        : 'Dinheiro (Sem troco)';
    }
    if (isCartao) {
      methodLabel = `Cartão (${order.paymentDetails?.cardType === 'credito' ? 'Crédito' : 'Débito'} na entrega)`;
    }

    const itemsStr = order.items
      .map((it) => `${it.quantity}x ${it.name}`)
      .join('\n');

    // WhatsApp compiled message body exactly formatted as requested
    const msgText = `📋 NOVO PEDIDO

Pedido Nº: ${order.id}

Cliente: ${order.customerName}
Telefone: ${order.phone}

Itens:
${itemsStr}

Total: R$ ${order.total.toFixed(2).replace('.', ',')}

Pagamento: ${methodLabel}
${order.paymentDetails?.pixReceiptUrl ? `Link do Comprovante PIX: ${window.location.origin}${order.paymentDetails.pixReceiptUrl}` : ''}

Endereço:
${order.address}
${order.reference ? `Ponto de Referência: ${order.reference}` : ''}`;

    // Format safe URL parameters
    const whatsappCleanNumber = configs.whatsappNumber.replace(/\D/g, '');
    const encodedText = encodeURIComponent(msgText);
    const apiLink = `https://wa.me/${whatsappCleanNumber}?text=${encodedText}`;

    // Update state to make WhatsApp button true/real in the Success dialog
    setWhatsAppUrl(apiLink);

    // Open WhatsApp tab safely
    window.open(apiLink, '_blank');
  };

  // Filter storefront query
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotalQty = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === 'percent'
      ? (subtotal * appliedCoupon.value) / 100
      : appliedCoupon.value;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Dynamic top micro ticker navigation */}
      <PromoBanner
        text={configs.promoBannerText}
        isOpen={configs.businessOpen}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        notifications={notifications}
        clearNotifications={() => setNotifications([])}
      />

      {/* Main Grid Banner Logo and branding */}
      <header className="relative w-full overflow-hidden border-b border-rose-600/35 select-none shrink-0">
        <div className="absolute inset-0 bg-black/65 z-10" />
        {/* Generated dynamic barbecue coals grill banner picture */}
        <img
          src="/src/assets/images/churrasco_banner_1780173522157.png"
          alt="Churrasco na Brasa"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover select-none animate-pulse duration-[5000ms]"
        />

        <div className="relative z-20 max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-xl border border-red-500/20 text-white animate-bounce">
            <Flame className="w-9 h-9 fill-amber-300 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight uppercase [text-shadow:_0_2px_12px_rgba(0,0,0,0.8)]">
              Churrasquinho do Chef
            </h1>
            <p className="font-display font-extrabold italic text-sm md:text-base text-amber-400 tracking-wider">
              "O melhor sabor da cidade"
            </p>
          </div>

          {/* Inline store open statuses */}
          <div className="flex gap-2 text-[11px] font-bold uppercase tracking-wider text-white">
            <span className="px-3 py-1 bg-black/50 border border-neutral-850 rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Grelha ativa das 18h às 23:30h</span>
            </span>
          </div>
        </div>
      </header>

      {/* Primary search categories viewport section */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* Actions bar: search & dynamic tabs */}
        <div className="p-4 md:p-6 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          {/* Form Search Products input */}
          <div className="relative w-full md:w-80 font-sans">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar espetinho, combo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-neutral-100/50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-900 dark:text-white rounded-2xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer select-none"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Tab Categories selections list */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
            {(['todas', 'espetinhos', 'combos', 'bebidas', 'adicionais'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight capitalize cursor-pointer focus:outline-none transition-all duration-200
                  ${selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
              >
                {cat === 'todas' ? 'Tudo' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic products inventory visual grid list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h2 className="font-display font-extrabold text-lg md:text-xl text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600 animate-pulse fill-red-500" />
                <span>Nosso Cardápio Oficial</span>
              </h2>
              <p className="text-xs text-neutral-400">Artesanais selecionados grelhados na hora com carvão de eucalipto.</p>
            </div>

            {/* Displaying counts */}
            <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 bg-neutral-150 dark:bg-neutral-900 border dark:border-neutral-800 py-1.5 px-3 rounded-full">
              {filteredProducts.length} itens encontrados
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-950/20">
              <span className="text-xs text-neutral-500 font-semibold block">Nenhum hambúrguer, espetinho ou bebida corresponde à pesquisa.</span>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('todas'); }}
                className="mt-4 text-[11px] font-bold text-red-600 hover:underline"
              >
                Limpar filtros e pesquisar novamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((prod) => {
                const itemInCart = cartItems.find((it) => it.product.id === prod.id);
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    quantityInCart={itemInCart ? itemInCart.quantity : 0}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    isClosed={!configs.businessOpen}
                  />
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Sticky Mobile Shopping floating badge indicator and triggers */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 z-40 animate-bounce">
          <button
            id="mobile-floating-cart-toggler"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-neutral-950 hover:bg-red-650 text-white rounded-full text-xs font-extrabold shadow-2xl transition-all duration-300 pointer-events-auto transform active:scale-95 focus:outline-none cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Carrinho ({cartTotalQty})</span>
            <span className="font-mono ml-1.5 border-l border-neutral-800 pl-2 text-amber-300">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      )}

      {/* Sticky footer for copyrights and chef administrative tools trigger */}
      <footer className="bg-neutral-100 dark:bg-neutral-950 text-xs py-10 border-t border-neutral-200 dark:border-neutral-900 mt-12 shrink-0 select-none">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 dark:text-neutral-400">
          
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display font-extrabold text-neutral-950 dark:text-white text-xs text-center md:text-left">Churrasquinho do Chef</h4>
            <p className="text-[10px] text-neutral-400 text-center md:text-left">© 2026 Todos os direitos reservados. Grelha com amor e maestria.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Header / Trigger Admin Mode button */}
            <button
              id="admin-mode-trigger"
              onClick={() => {
                setIsAdminOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 dark:border-neutral-900 dark:hover:border-neutral-800 bg-white dark:bg-neutral-950 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer select-none text-neutral-600 dark:text-neutral-300 focus:outline-none"
              title="Para administradores"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Painel Executivo</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Sliding Client Shopping Cart Drawer */}
      <CartDrawer
        cartItems={cartItems}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCartItem={handleClearCartItem}
        deliveryFee={configs.deliveryFee}
        availableCoupons={coupons}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Floating Checkout delivery and options modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          cartItems={cartItems}
          subtotal={subtotal}
          discount={discountAmount}
          deliveryFee={configs.deliveryFee}
          appliedCoupon={appliedCoupon}
          pixKey={configs.pixKey}
          whatsappNumber={configs.whatsappNumber}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmitOrder={handleSubmitOrder}
        />
      )}

      {/* Floating WhatsApp Quick Contact Button */}
      <WhatsAppFloatingButton phone={configs.whatsappNumber} />

      {/* Floating Admin Panel viewport controls */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => {
            setIsAdminOpen(false);
            // Refresh on closure to sync configs or new products seamlessly!
            loadStorefrontData();
          }}
        />
      )}

      {/* Success Receipt ticket viewport pop-up */}
      {showSuccessScreen && lastOrderPlaced && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full shadow-2xl p-6 border dark:border-neutral-900 animate-fade-in block space-y-5">
            
            <div className="flex flex-col items-center text-center space-y-1">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-1.5 rounded-full" />
              <h3 className="font-display font-extrabold text-neutral-900 dark:text-neutral-100 text-lg">Pedido Recebido com Sucesso!</h3>
              <p className="text-[11px] text-neutral-400">O seu pedido foi enviado para o WhatsApp do Churrasquinho!</p>
            </div>

            {/* Receipt Summary Sheet */}
            <div className="border border-neutral-100 dark:border-neutral-900 rounded-xl p-4 bg-neutral-50 dark:bg-neutral-900/40 text-xs space-y-3 font-mono">
              <div className="flex justify-between font-bold border-b pb-1.5 dark:border-neutral-800">
                <span>Pedido Nº:</span>
                <span>{lastOrderPlaced.id}</span>
              </div>
              <div className="space-y-1">
                <span className="font-sans font-bold text-neutral-500 uppercase text-[9px] block">Produtos</span>
                {lastOrderPlaced.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span>R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-1.5 dark:border-neutral-800 space-y-1">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>R$ {lastOrderPlaced.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {lastOrderPlaced.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Desconto</span>
                    <span>- R$ {lastOrderPlaced.discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Taxa de Entrega</span>
                  <span>R$ {configs.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-bold text-red-655 text-sm pt-1 border-t border-dashed dark:border-neutral-800">
                  <span>Total Pago:</span>
                  <span>R$ {lastOrderPlaced.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="border-t pt-1.5 dark:border-neutral-800 text-neutral-500 text-[10px]">
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span className="uppercase font-bold">{lastOrderPlaced.paymentMethod}</span>
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  <span>Destino:</span>
                  <span className="truncate">{lastOrderPlaced.address}</span>
                </div>
              </div>
            </div>

             <div className="space-y-2">
              <a
                id="success-send-whatsapp-btn"
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 text-center cursor-pointer select-none decoration-transparent"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>ENVIAR PEDIDO NO WHATSAPP (BOTÃO REAL)</span>
              </a>

              <p className="text-[10px] text-neutral-400 text-center leading-relaxed font-sans pt-1">
                * Caso a aba do WhatsApp não tenha aberto automaticamente, clique no botão principal acima para enviar e confirmar sua entrega manualmente pelo número ({configs.whatsappNumber.slice(2)}).
              </p>
            </div>

            <button
              onClick={() => setShowSuccessScreen(false)}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer focus:outline-none"
            >
              Fechar Recibo e Continuar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
