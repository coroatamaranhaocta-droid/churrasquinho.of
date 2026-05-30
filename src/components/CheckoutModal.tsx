/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle, Sparkles, CreditCard, DollarSign, QrCode } from 'lucide-react';
import { CartItem, Coupon, PaymentMethod, CardType } from '../types';

interface Props {
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  appliedCoupon: Coupon | null;
  pixKey: string;
  whatsappNumber: string;
  onClose: () => void;
  onSubmitOrder: (orderDetails: {
    customerName: string;
    phone: string;
    address: string;
    reference: string;
    paymentMethod: PaymentMethod;
    paymentDetails: {
      pixReceiptUrl?: string;
      cashChangeFor?: string;
      cardType?: CardType;
    };
  }) => Promise<void>;
}

export default function CheckoutModal({
  cartItems,
  subtotal,
  discount,
  deliveryFee,
  appliedCoupon,
  pixKey,
  whatsappNumber,
  onClose,
  onSubmitOrder
}: Props) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  
  // Payment auxiliary state
  const [cashChangeFor, setCashChangeFor] = useState('');
  const [cardType, setCardType] = useState<CardType>('debito');
  const [pixReceiptUrl, setPixReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = Math.max(0, subtotal - discount + deliveryFee);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadingReceipt(true);

    // Validate size and type
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Tamanho máximo permitido: 5MB');
      setUploadingReceipt(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const fileData = reader.result as string;
        const response = await fetch('/api/upload-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na resposta do servidor.');
        }

        const data = await response.json();
        setPixReceiptUrl(data.url);
        setUploadingReceipt(false);
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError('Erro ao enviar comprovante. Tente novamente.');
        setUploadingReceipt(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFormValidation = () => {
    const errors: Record<string, string> = {};
    if (!customerName.trim()) errors.customerName = 'Nome é obrigatório.';
    if (!phone.trim()) errors.phone = 'Telefone é obrigatório.';
    if (!address.trim()) errors.address = 'Endereço Completo é obrigatório.';

    if (paymentMethod === 'pix' && !pixReceiptUrl) {
      errors.pixReceipt = 'O envio do comprovante PIX é obrigatório para finalizar.';
    }

    if (paymentMethod === 'dinheiro' && cashChangeFor.trim()) {
      const parsed = parseFloat(cashChangeFor.replace(',', '.'));
      if (isNaN(parsed)) {
        errors.cashChange = 'Insira um valor numérico válido.';
      } else if (parsed < total) {
        errors.cashChange = `O valor de troco deve ser maior que o total R$ ${total.toFixed(2)}`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleFormValidation()) return;

    setIsSubmitting(true);
    try {
      const paymentDetails: any = {};
      if (paymentMethod === 'pix') {
        paymentDetails.pixReceiptUrl = pixReceiptUrl;
      } else if (paymentMethod === 'dinheiro') {
        paymentDetails.cashChangeFor = cashChangeFor.trim();
      } else if (paymentMethod === 'cartao') {
        paymentDetails.cardType = cardType;
      }

      await onSubmitOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        reference: reference.trim(),
        paymentMethod,
        paymentDetails
      });
    } catch (err) {
      console.error('Error submitting order form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-neutral-950 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-900 animate-fade-in block max-h-[90vh] overflow-y-auto">
        
        {/* Header banner */}
        <div className="bg-neutral-950 text-white p-5 border-b border-rose-600/35 flex justify-between items-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-950/60 via-neutral-950 to-neutral-950">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Etapa Final</span>
            </span>
            <h2 className="text-lg font-display font-extrabold mt-0.5 tracking-tight">Finalizar Seu Pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Order Summary Ticker */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100 dark:border-neutral-900 flex justify-between items-center text-xs">
            <span className="text-neutral-500 font-medium">Produtos Selecionados ({cartItems.reduce((s, o) => s + o.quantity, 0)})</span>
            <span className="font-bold text-red-600 dark:text-red-400 font-mono text-sm">
              Total: R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1 dark:border-neutral-800">
              Dados de Entrega
            </h3>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Sebastião Botelho"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-lg bg-neutral-50/50 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 
                  ${formErrors.customerName ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:ring-red-500'}`}
              />
              {formErrors.customerName && (
                <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.customerName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Telefone de Contato (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: (99) 98454-5370"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-lg bg-neutral-50/50 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 
                  ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:ring-red-500'}`}
              />
              {formErrors.phone && (
                <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Endereço Completo de Entrega *
              </label>
              <input
                type="text"
                required
                placeholder="Rua, Número, Bairro/Apartamento"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-lg bg-neutral-50/50 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 
                  ${formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:ring-red-500'}`}
              />
              {formErrors.address && (
                <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.address}
                </p>
              )}
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Ponto de Referência
              </label>
              <input
                type="text"
                placeholder="Ex: Próximo ao supermercado, igreja, padaria"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50/50 dark:bg-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1 dark:border-neutral-800">
              Formas de Pagamento
            </h3>

            {/* Selector Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* PIX */}
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer focus:outline-none
                  ${paymentMethod === 'pix'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/40'}`}
              >
                <QrCode className="w-5 h-5 mb-1.5" />
                <span className="text-xs">PIX</span>
              </button>

              {/* Cash (Dinheiro) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer focus:outline-none
                  ${paymentMethod === 'dinheiro'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/40'}`}
              >
                <DollarSign className="w-5 h-5 mb-1.5" />
                <span className="text-xs">Dinheiro</span>
              </button>

              {/* Card (Cartão) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer focus:outline-none
                  ${paymentMethod === 'cartao'
                    ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/40'}`}
              >
                <CreditCard className="w-5 h-5 mb-1.5" />
                <span className="text-xs">Cartão</span>
              </button>
            </div>

            {/* Dynamic Payment Forms */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100 dark:border-neutral-900 animate-fade-in text-xs">
              
              {/* PIX Flow */}
              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="font-bold text-red-700 dark:text-red-400">Pague Online via PIX para Garantir o Preparo</span>
                    
                    {/* Simulated Pix QR view */}
                    <div className="p-3 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                      <div className="relative w-28 h-28 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/45 via-white to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950 flex flex-col items-center justify-center">
                        <QrCode className="w-20 h-20 text-neutral-900 dark:text-white" />
                        <span className="absolute text-[8px] tracking-wider uppercase font-extrabold bg-red-650 text-white dark:bg-red-600 px-1 py-0.5 rounded leading-none">
                          Churrasco PIX
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-neutral-500 dark:text-neutral-400 gap-1 mt-1 text-[11px]">
                      <span>Chave PIX:</span>
                      <strong id="pix-key-val" className="bg-white dark:bg-neutral-950 border dark:border-neutral-800 border-neutral-100 py-1.5 px-3 rounded-md select-all text-neutral-900 dark:text-neutral-100 font-mono tracking-tight cursor-pointer" title="Clique para copiar">
                        {pixKey}
                      </strong>
                    </div>
                  </div>

                  {/* Mandatory uploads */}
                  <div className="border-t pt-3 dark:border-neutral-800 space-y-2">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                      Envio de Comprovante * <span className="text-red-500">(Obrigatório)</span>
                    </label>

                    <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-5 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition duration-250 cursor-pointer">
                      <input
                        id="pix-receipt-uploader"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, application/pdf"
                        onChange={handleReceiptUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {pixReceiptUrl ? (
                        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950/40 rounded-full p-0.5" />
                          <span>Comprovante enviado com sucesso!</span>
                        </div>
                      ) : uploadingReceipt ? (
                        <span className="text-neutral-500">Enviando comprovante...</span>
                      ) : (
                        <div className="flex flex-col items-center text-center text-neutral-500 gap-1">
                          <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300 leading-none">Escolha ou arraste o comprovante</span>
                          <span className="text-[10px] text-neutral-400">Suporta PNG, JPG ou PDF de até 5MB</span>
                        </div>
                      )}
                    </div>

                    {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
                    {formErrors.pixReceipt && <p className="text-[10px] text-red-550 dark:text-red-400 font-extrabold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {formErrors.pixReceipt}</p>}
                  </div>
                </div>
              )}

              {/* Dinheiro (Cash) Flow */}
              {paymentMethod === 'dinheiro' && (
                <div className="space-y-2.5">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                    Troco para quanto? (Deixe em branco se não precisar de troco)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-neutral-400 font-mono">R$</span>
                    <input
                      type="text"
                      placeholder="Ex: 50,00 ou 100,00"
                      value={cashChangeFor}
                      onChange={(e) => setCashChangeFor(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  {formErrors.cashChange && (
                    <p className="text-[10px] text-red-550 dark:text-red-450 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.cashChange}
                    </p>
                  )}
                </div>
              )}

              {/* Cartao (Cards) Flow */}
              {paymentMethod === 'cartao' && (
                <div className="space-y-3">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                    Selecione a modalidade do cartão na entrega:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="cardType"
                        checked={cardType === 'debito'}
                        onChange={() => setCardType('debito')}
                        className="text-red-650 focus:ring-red-500"
                      />
                      <span>Cartão de Débito</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="cardType"
                        checked={cardType === 'credito'}
                        onChange={() => setCardType('credito')}
                        className="text-red-655 focus:ring-red-500"
                      />
                      <span>Cartão de Crédito</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">O entregador levará a maquininha até você com a opção selecionada.</p>
                </div>
              )}

            </div>
          </div>

          {/* Submit button */}
          <button
            id="btn-finalizar-pedido"
            type="submit"
            disabled={isSubmitting || uploadingReceipt}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-red-500/20 cursor-pointer focus:outline-none transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Finalizando seu Pedido...' : 'FINALIZAR PEDIDO'}
          </button>
        </form>
      </div>
    </div>
  );
}
