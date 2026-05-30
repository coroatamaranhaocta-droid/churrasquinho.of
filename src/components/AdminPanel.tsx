/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Database,
  Trash,
  Plus,
  Save,
  Check,
  Settings,
  X,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  BadgeAlert,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Product, Order, Coupon, OrderStatus, CategoryType } from '../types';

interface Props {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [configs, setConfigs] = useState({
    pixKey: '',
    whatsappNumber: '',
    deliveryFee: 5.0,
    businessOpen: true,
    promoBannerText: ''
  });

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingConfigs, setEditingConfigs] = useState({ ...configs });
  
  // New coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState(0);
  const [newCouponType, setNewCouponType] = useState<'fixed' | 'percent'>('percent');
  const [newCouponMin, setNewCouponMin] = useState(0);

  // New product form
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<CategoryType>('espetinhos');
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductStock, setNewProductStock] = useState(50);

  // Dashboard calculations
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    pendingCount: 0,
    completedCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'coupons' | 'config'>('dashboard');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders with dates
      let ordersUrl = '/api/orders';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) ordersUrl += '?' + params.join('&');

      const [ordersRes, productsRes, couponsRes, configsRes] = await Promise.all([
        fetch(ordersUrl),
        fetch('/api/products'),
        fetch('/api/coupons'),
        fetch('/api/configs')
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const couponsData = await couponsRes.json();
      const configsData = await configsRes.json();

      setOrders(ordersData);
      setProducts(productsData);
      setCoupons(couponsData);
      setConfigs(configsData);
      setEditingConfigs(configsData);

      // Analyze metrics
      calculateStats(ordersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    // Total sales matches only COMPLETED/CONCLUÍDO order totals
    const completed = ordersList.filter(o => o.status === 'completed');
    const total = completed.reduce((sum, o) => sum + o.total, 0);

    setStats({
      totalSales: total,
      orderCount: ordersList.length,
      pendingCount: ordersList.filter(o => o.status === 'pending').length,
      completedCount: completed.length
    });
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        // Update local state
        const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        setOrders(updated);
        calculateStats(updated);
      }
    } catch (err) {
      console.error('Order status update failed:', err);
    }
  };

  const handleToggleProductStock = async (product: Product) => {
    const nextStock = product.stock > 0 ? 0 : 50; // out of stock vs stocked
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nextStock })
      });
      if (response.ok) {
        setProducts(products.map(p => p.id === product.id ? { ...p, stock: nextStock } : p));
      }
    } catch (err) {
      console.error('Failed toggling stock:', err);
    }
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      if (response.ok) {
        setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Failed to save product details:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este espetinho/produto?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProd = {
      name: newProductName,
      category: newProductCategory,
      price: Number(newProductPrice),
      description: newProductDescription,
      image: newProductImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
      stock: Number(newProductStock)
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });

      if (response.ok) {
        const added = await response.json();
        setProducts([...products, added]);
        setIsNewProductModalOpen(false);
        // Clear fields
        setNewProductName('');
        setNewProductPrice(0);
        setNewProductDescription('');
        setNewProductImage('');
        setNewProductStock(50);
      }
    } catch (err) {
      console.error('Product addition failed:', err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    const newCp = {
      code: newCouponCode.trim().toUpperCase(),
      value: Number(newCouponValue),
      type: newCouponType,
      minOrder: Number(newCouponMin)
    };

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCp)
      });

      if (response.ok) {
        const added = await response.json();
        setCoupons([...coupons, added]);
        setNewCouponCode('');
        setNewCouponValue(0);
        setNewCouponMin(0);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Erro ao criar cupom.');
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Excluir cupom ${code}?`)) return;
    try {
      const response = await fetch(`/api/coupons/${code}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCoupons(coupons.filter(c => c.code !== code));
      }
    } catch (err) {
      console.error('Delete coupon failed:', err);
    }
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfigs)
      });
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
        alert('Configurações atualizadas com sucesso!');
      }
    } catch (err) {
      console.error('Update configs failed:', err);
    }
  };

  // EXPORT TO EXCEL: Generate beautifully formatted CSV which Excel naturally reads
  const exportToExcel = () => {
    if (orders.length === 0) return alert('Sem pedidos para exportar.');

    let csvContent = 'ID_Pedido,Data,Hora,Cliente,Telefone,Produtos,Subtotal,Desconto,Total,Pagamento,Status,Endereco\n';
    orders.forEach(order => {
      const dateLocal = new Date(order.createdAt).toLocaleDateString('pt-BR');
      const timeLocal = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const productsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      const rawRow = [
        `#${order.id}`,
        dateLocal,
        timeLocal,
        order.customerName.replace(/,/g, ' '),
        order.phone,
        productsStr.replace(/,/g, ' '),
        order.subtotal.toFixed(2),
        order.discount.toFixed(2),
        order.total.toFixed(2),
        order.paymentMethod,
        order.status,
        order.address.replace(/,/g, ' ')
      ];
      csvContent += rawRow.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendas_churrasquinho_chef_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // EXPORT TO PDF: Direct structured printing block
  const exportToPDF = () => {
    // Elegant client-side table printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Por favor, permita popups para exportar.');

    const tableRows = orders.map(order => {
      const dateLocal = new Date(order.createdAt).toLocaleDateString('pt-BR');
      const productsHtml = order.items.map(i => `<div>${i.quantity}x ${i.name}</div>`).join('');
      return `
        <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold;">#${order.id}</td>
          <td style="padding: 10px;">${dateLocal}</td>
          <td style="padding: 10px; font-weight: 500;">${order.customerName}</td>
          <td style="padding: 10px;">${order.phone}</td>
          <td style="padding: 10px;">${productsHtml}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #dc2626;">R$ ${order.total.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 10px; text-transform: uppercase;">${order.paymentMethod}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">${order.status}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Pedidos - Churrasquinho do Chef</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; }
            h1 { font-size: 22px; margin-bottom: 5px; text-align: center; color: #dc2626; }
            h2 { font-size: 14px; text-align: center; margin-top: 0; color: #4b5563; font-weight: normal; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #111827; color: white; padding: 12px 10px; text-align: left; font-size: 12px; }
            .totals-box { margin-top: 40px; background-color: #f3f4f6; padding: 20px; border-radius: 8px; float: right; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>CHURRASQUINHO DO CHEF</h1>
          <h2>Relatório Detalhado de Vendas e Pedidos (Gerado em ${new Date().toLocaleDateString('pt-BR')})</h2>
          
          <table>
            <thead>
              <tr>
                <th>PEDIDO</th>
                <th>DATA</th>
                <th>CLIENTE</th>
                <th>CONTATO</th>
                <th>PRODUTOS</th>
                <th style="text-align: right;">TOTAL</th>
                <th>PAGAMENTO</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="totals-box">
            <div class="totals-row"><strong>Total de Pedidos:</strong> <span>${stats.orderCount}</span></div>
            <div class="totals-row"><strong>Pedidos Concluídos:</strong> <span>${stats.completedCount}</span></div>
            <div class="totals-row" style="font-size: 16px; border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 8px; color: #dc2626;">
              <strong>Faturamento Total:</strong> <strong>R$ ${stats.totalSales.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/45 dark:bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4 select-none animate-fade-in font-sans">
      
      <div className="bg-white dark:bg-neutral-950 w-full md:max-w-6xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-900 flex flex-col overflow-hidden">
        
        {/* Header Block */}
        <div className="bg-neutral-950 text-white p-5 flex flex-wrap items-center justify-between gap-4 border-b border-red-600/30">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-650 flex items-center justify-center border border-red-500/20 text-white font-display font-extrabold text-xl">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg tracking-tight select-none">Painel Administrativo</h1>
                <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-red-500/30">Chef Mode</span>
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">Gestão de produtos, pedidos, controle de estoque e relatórios comerciais.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer focus:outline-none"
              title="Sincronizar Dados"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer focus:outline-none"
              title="Fechar Painel"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Dashboard inner columns split */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0 bg-neutral-50/50 dark:bg-neutral-900/20">
          
          {/* Sidebar tabs */}
          <div className="w-full md:w-56 bg-neutral-100/65 dark:bg-neutral-950/70 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-900 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus:outline-none w-full md:text-left
                ${activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus:outline-none w-full md:text-left
                ${activeTab === 'orders'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedidos Recentes</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus:outline-none w-full md:text-left
                ${activeTab === 'products'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'}`}
            >
              <Database className="w-4 h-4" />
              <span>Espetinhos & Estoque</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus:outline-none w-full md:text-left
                ${activeTab === 'coupons'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>Cupons Promocionais</span>
            </button>

            <button
              id="admin-tab-config"
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer focus:outline-none w-full md:text-left
                ${activeTab === 'config'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/15'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>

          </div>

          {/* Interactive display panel viewport */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 min-w-0">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-650 animate-spin" />
                <span className="text-xs text-neutral-500 font-semibold mt-3">Carregando dados executivos...</span>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Dashboard Viewport */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Filter controls */}
                    <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Filtro por Período:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">De:</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs border border-neutral-200 dark:border-neutral-800 rounded-lg py-1 px-2.5 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Até:</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs border border-neutral-200 dark:border-neutral-800 rounded-lg py-1 px-2.5 cursor-pointer"
                          />
                        </div>
                        <button
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="text-[10px] font-bold text-neutral-400 hover:text-red-500 cursor-pointer ml-1.5"
                        >
                          Limpar Filtros
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Vendas do Dia */}
                      <div className="p-5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl shadow-sm">
                        <span className="text-neutral-400 font-medium text-[10px] uppercase tracking-wider block">Faturamento (Concluídos)</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                          <h3 className="font-display font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white font-mono shrink-0">
                            R$ {stats.totalSales.toFixed(2).replace('.', ',')}
                          </h3>
                        </div>
                      </div>

                      {/* Pedidos Recebidos */}
                      <div className="p-5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl shadow-sm">
                        <span className="text-neutral-400 font-medium text-[10px] uppercase tracking-wider block">Total de Pedidos</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <ShoppingBag className="w-5 h-5 text-red-500 shrink-0" />
                          <h3 className="font-display font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white font-mono">
                            {stats.orderCount}
                          </h3>
                        </div>
                      </div>

                      {/* Pedidos Pendentes */}
                      <div className="p-5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl shadow-sm">
                        <span className="text-neutral-400 font-medium text-[10px] uppercase tracking-wider block">Pedidos Pendentes</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Loader2 className="w-5 h-5 text-amber-500 shrink-0 select-none animate-spin" />
                          <h3 className="font-display font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white font-mono">
                            {stats.pendingCount}
                          </h3>
                        </div>
                      </div>

                      {/* Pedidos Concluídos */}
                      <div className="p-5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl shadow-sm">
                        <span className="text-neutral-400 font-medium text-[10px] uppercase tracking-wider block">Pedidos Concluídos</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          <h3 className="font-display font-extrabold text-xl md:text-2xl text-neutral-900 dark:text-white font-mono">
                            {stats.completedCount}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Report Exports Options card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl">
                        <h4 className="font-display font-bold text-neutral-800 dark:text-neutral-200 text-sm mb-1.5">Exportação de Relatórios</h4>
                        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">Gere planilhas comerciais em formato CSV (Excel) ou faturas formatadas de fechamento de caixa para auditoria presencial.</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={exportToExcel}
                            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-900 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl cursor-pointer shadow transition-all focus:outline-none"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            <span>Exportar para Excel</span>
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-850 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl cursor-pointer shadow transition-all focus:outline-none"
                          >
                            <FileDown className="w-4 h-4 text-amber-400" />
                            <span>Exportar para PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Stock alarm notifications block */}
                      <div className="p-6 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-display font-bold text-neutral-800 dark:text-neutral-200 text-sm mb-1.5 flex items-center gap-2">
                            <BadgeAlert className="w-4.5 h-4.5 text-rose-500" />
                            <span>Notificações de Estoque Baixo</span>
                          </h4>
                          <div className="space-y-2 max-h-[110px] overflow-y-auto mt-2.5">
                            {products.filter(p => p.stock <= 5).length === 0 ? (
                              <p className="text-[11px] text-neutral-400">Excelente! Todos os itens com o estoque saudável no momento.</p>
                            ) : (
                              products.filter(p => p.stock <= 5).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-rose-50 dark:bg-rose-950/20 text-xs font-semibold p-2 px-3 rounded-lg text-rose-800 dark:text-rose-300">
                                  <span>{p.name}</span>
                                  <span className="font-mono text-[10px] bg-rose-100 dark:bg-rose-950 border border-rose-200 px-1.5 py-0.5 rounded">
                                    Apenas {p.stock} un.
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Orders Tab Viewport */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <h3 className="font-display font-extrabold text-neutral-800 dark:text-neutral-200 text-base">Pedidos Realizados ({orders.length})</h3>
                    {orders.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950/20">
                        <span className="text-xs text-neutral-400 font-semibold block">Nenhum pedido recebido neste período.</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const orderDate = new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                          return (
                            <div
                              key={order.id}
                              className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl p-5 hover:shadow-md transition-all duration-200 space-y-4"
                            >
                              {/* Order metadata top row */}
                              <div className="flex flex-wrap justify-between items-center gap-2.5 pb-3 border-b dark:border-neutral-900 border-neutral-100">
                                <div>
                                  <span className="text-xs font-mono font-bold text-red-655 bg-red-50 dark:bg-neutral-900 px-2 py-0.5 rounded">
                                    Pedido #{order.id}
                                  </span>
                                  <span className="text-[11px] text-neutral-400 ml-2">{orderDate}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Mudar Status:</span>
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                    className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white border dark:border-neutral-800 border-neutral-200 text-xs px-2.5 py-1.5 rounded-lg font-bold"
                                  >
                                    <option value="pending">Pendente (Novo)</option>
                                    <option value="preparing">Preparando Grelha</option>
                                    <option value="delivery">Saiu para Entrega</option>
                                    <option value="completed">Concluído</option>
                                    <option value="cancelled">Cancelado</option>
                                  </select>
                                </div>
                              </div>

                              {/* Order columns */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                {/* Column 1: Client details */}
                                <div className="space-y-1">
                                  <span className="font-bold text-neutral-500 dark:text-neutral-400 block pb-1 border-b border-dashed dark:border-neutral-900">Cliente & Contato</span>
                                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">{order.customerName}</div>
                                  <div className="text-neutral-500">{order.phone}</div>
                                  <div className="text-neutral-500 truncate" title={order.address}>{order.address}</div>
                                  {order.reference && <div className="text-[10px] text-neutral-400 italic">Ref: {order.reference}</div>}
                                </div>

                                {/* Column 2: Items inside order */}
                                <div className="space-y-1">
                                  <span className="font-bold text-neutral-500 dark:text-neutral-400 block pb-1 border-b border-dashed dark:border-neutral-900 font-sans">Itens do Pedido</span>
                                  <div className="space-y-1">
                                    {order.items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between font-medium">
                                        <span className="text-neutral-800 dark:text-neutral-300 text-xs">
                                          {it.quantity}x {it.name}
                                        </span>
                                        <span className="font-mono text-neutral-500">R$ {(it.price * it.quantity).toFixed(2).replace('.', ',')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Column 3: Totals & Payments */}
                                <div className="space-y-2 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-900">
                                  <div className="flex justify-between font-medium">
                                    <span className="text-neutral-550 dark:text-neutral-400">Total Pago:</span>
                                    <span className="font-extrabold text-red-650 dark:text-red-400 font-mono">
                                      R$ {order.total.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-neutral-500">
                                    <span>Pagamento:</span>
                                    <span className="uppercase font-bold">{order.paymentMethod}</span>
                                  </div>

                                  {/* Render receipt visual if PIX */}
                                  {order.paymentMethod === 'pix' && order.paymentDetails?.pixReceiptUrl && (
                                    <div className="border-t pt-1.5 mt-1.5 flex justify-between items-center text-[10px]">
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        Comprovante Anexo
                                      </span>
                                      <a
                                        href={order.paymentDetails.pixReceiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-red-600 dark:text-red-400 font-bold hover:underline"
                                      >
                                        Ver Documento
                                      </a>
                                    </div>
                                  )}

                                  {/* Cash change */}
                                  {order.paymentMethod === 'dinheiro' && order.paymentDetails?.cashChangeFor && (
                                    <div className="border-t pt-1.5 mt-1.5 text-[10px] text-neutral-500 flex justify-between">
                                      <span>Enviar Troco Para:</span>
                                      <strong className="font-mono text-neutral-800 dark:text-neutral-200">
                                        R$ {Number(order.paymentDetails.cashChangeFor).toFixed(2).replace('.', ',')}
                                      </strong>
                                    </div>
                                  )}

                                  {/* Card type */}
                                  {order.paymentMethod === 'cartao' && order.paymentDetails?.cardType && (
                                    <div className="border-t pt-1.5 mt-1.5 text-[10px] text-neutral-400 flex justify-between capitalize">
                                      <span>Máquina na Entrega:</span>
                                      <span className="font-bold">{order.paymentDetails.cardType}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Products & Stock Inventory view */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-neutral-800 dark:text-neutral-200 text-base">Controle de Espetinhos & Bebidas</h3>
                      <button
                        onClick={() => setIsNewProductModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer focus:outline-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Item</span>
                      </button>
                    </div>

                    <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-bold text-xs uppercase border-b dark:border-neutral-900">
                            <th className="p-3 pl-4">Nome & Categoria</th>
                            <th className="p-3">Preço</th>
                            <th className="p-3 text-center">Unidades no Estoque</th>
                            <th className="p-3 text-right pr-4">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 text-xs text-neutral-700 dark:text-neutral-300">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-3">
                                  <img src={p.image} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg bg-neutral-100 shrink-0" />
                                  <div>
                                    <div className="font-bold text-neutral-900 dark:text-neutral-100">{p.name}</div>
                                    <span className="text-[10px] uppercase text-red-500 font-bold font-display">{p.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className={`font-semibold font-mono ${p.stock <= 5 ? 'text-red-500 font-bold' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                    {p.stock} un.
                                  </span>
                                  <button
                                    onClick={() => handleToggleProductStock(p)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight border cursor-pointer focus:outline-none
                                      ${p.stock > 0 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20' 
                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20'}`}
                                  >
                                    {p.stock > 0 ? 'Ativo' : 'Esgotado'}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-right pr-4 space-x-1.5">
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="text-neutral-400 hover:text-red-500 cursor-pointer text-xs font-semibold px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="text-neutral-400 hover:text-red-600 cursor-pointer text-xs font-bold px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded"
                                >
                                  Excluir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Coupons Tab Viewport */}
                {activeTab === 'coupons' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List Existing Coupons */}
                    <div className="space-y-4">
                      <h3 className="font-display font-extrabold text-neutral-800 dark:text-neutral-200 text-sm">Cupons Disponíveis</h3>
                      <div className="space-y-3.5">
                        {coupons.map((cp) => (
                          <div
                            key={cp.code}
                            className="p-4 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-red-50 border border-red-250 font-mono font-extrabold text-xs text-red-650 rounded-lg dark:bg-neutral-900 tracking-wider">
                                  {cp.code}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Ativo</span>
                              </div>
                              <p className="text-xs mt-2 font-medium text-neutral-600 dark:text-neutral-400">
                                Desconto de {cp.value}{cp.type === 'percent' ? '%' : ' R$'} para pedidos acima de R$ {cp.minOrder.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteCoupon(cp.code)}
                              className="p-1 px-2.5 border hover:bg-rose-50 hover:text-rose-600 text-neutral-400 dark:hover:bg-red-950 text-xs rounded-xl cursor-pointer focus:outline-none"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Create New Coupon */}
                    <div className="p-6 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl">
                      <h3 className="font-display font-bold text-neutral-800 dark:text-neutral-200 text-sm mb-4">Criar Novo Cupom</h3>
                      <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Dígito do Código (Sem espaços)</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: CHEF15"
                            value={newCouponCode}
                            onChange={(e) => setNewCouponCode(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Tipo de Desconto</label>
                            <select
                              value={newCouponType}
                              onChange={(e) => setNewCouponType(e.target.value as 'fixed' | 'percent')}
                              className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 font-semibold focus:outline-none"
                            >
                              <option value="percent">Porcentagem (%)</option>
                              <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Valor do Desconto</label>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="10"
                              value={newCouponValue || ''}
                              onChange={(e) => setNewCouponValue(Number(e.target.value))}
                              className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Pedido Mínimo Exigido (R$)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="30"
                            value={newCouponMin || ''}
                            onChange={(e) => setNewCouponMin(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold shadow cursor-pointer focus:outline-none text-xs"
                        >
                          Salvar Cupom
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Configurations tab viewport */}
                {activeTab === 'config' && (
                  <div className="p-6 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-2xl max-w-xl">
                    <h3 className="font-display font-extrabold text-neutral-800 dark:text-neutral-200 text-base mb-4">Configurações Gerais do Estabelecimento</h3>
                    <form onSubmit={handleSaveConfigs} className="space-y-4 text-xs">
                      
                      {/* Business Status Toggle */}
                      <div className="flex justify-between items-center p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 block text-xs">Atendimento Aberto</span>
                          <span className="text-[10px] text-neutral-400">Controla se os clientes conseguem adicionar itens ao carrinho e fazer pedidos.</span>
                        </div>
                        <input
                          id="configs-businessOpen-chk"
                          type="checkbox"
                          checked={editingConfigs.businessOpen}
                          onChange={(e) => setEditingConfigs({ ...editingConfigs, businessOpen: e.target.checked })}
                          className="w-5 h-5 rounded hover:ring-2 accent-red-600"
                        />
                      </div>

                      {/* PIX Key */}
                      <div>
                        <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Chave PIX do Estabelecimento</label>
                        <input
                          type="text"
                          required
                          value={editingConfigs.pixKey}
                          onChange={(e) => setEditingConfigs({ ...editingConfigs, pixKey: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white focus:outline-none font-mono text-xs"
                        />
                      </div>

                      {/* Whatsapp Number */}
                      <div>
                        <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Número de Recebimento de WhatsApp (Formato Internacional)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 5599984545370"
                          value={editingConfigs.whatsappNumber}
                          onChange={(e) => setEditingConfigs({ ...editingConfigs, whatsappNumber: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white focus:outline-none font-mono text-xs"
                        />
                        <span className="text-[10px] text-neutral-400 mt-1 block">Insira o código do país (55 para Brasil), DDD e número sem traços ou parênteses.</span>
                      </div>

                      {/* Delivery Fee */}
                      <div>
                        <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Taxa de Entrega Fixa (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editingConfigs.deliveryFee}
                          onChange={(e) => setEditingConfigs({ ...editingConfigs, deliveryFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>

                      {/* Promo Banner String */}
                      <div>
                        <label className="block text-neutral-600 dark:text-neutral-300 font-semibold mb-1">Mensagem do Ticker Promocional</label>
                        <textarea
                          rows={2}
                          value={editingConfigs.promoBannerText}
                          onChange={(e) => setEditingConfigs({ ...editingConfigs, promoBannerText: e.target.value })}
                          className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold shadow flex items-center justify-center gap-2 cursor-pointer focus:outline-none text-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Configurações</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Embedded edit product modal pop-ups */}
      {editingProduct && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full shadow-2xl p-6 border dark:border-neutral-900">
            <h4 className="font-display font-extrabold text-neutral-900 dark:text-neutral-100 text-base mb-4">Editar Produto</h4>
            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
              <div>
                <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium font-sans">Nome do Espetinho / Bebida</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Unidades no Estoque</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Descrição Completa</label>
                <textarea
                  rows={2.5}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                />
              </div>

              {/* Promotional toggles */}
              <div className="flex justify-between items-center p-2.5 bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-900 rounded-xl">
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Colocar em Oferta (Promoção)</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingProduct.isPromo || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isPromo: e.target.checked })}
                  className="w-4 h-4 accent-red-650 cursor-pointer"
                />
              </div>

              {editingProduct.isPromo && (
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.promoPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, promoPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded adding product modal popups */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full shadow-2xl p-6 border dark:border-neutral-900">
            <h4 className="font-display font-extrabold text-neutral-900 dark:text-neutral-100 text-base mb-4">Adicionar Novo Produto</h4>
            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Espetinho de Coração"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Categoria *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value as CategoryType)}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white font-medium"
                  >
                    <option value="espetinhos">Espetinhos</option>
                    <option value="combos">Combos</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="adicionais">Adicionais</option>
                  </select>
                </div>
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Preço Inicial *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="7,50"
                    value={newProductPrice || ''}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Estoque Inicial (un.)</label>
                  <input
                    type="number"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">Descrição Completa *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Coraçãozinho de frango suculento marinado no limão..."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block pb-0.5 text-neutral-600 dark:text-neutral-400 font-medium">URL da Imagem (Opcional)</label>
                <input
                  type="text"
                  placeholder="Deixe vazio para usar imagem padrão"
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-neutral-800 rounded-lg dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Criar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
