/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface Props {
  phone: string;
}

export default function WhatsAppFloatingButton({ phone }: Props) {
  const formattedPhone = phone.replace(/\D/g, '');
  const chatUrl = `https://wa.me/${formattedPhone}?text=Olá! Gostaria de tirar uma dúvida sobre o cardápio.`;

  return (
    <a
      id="whatsapp-floating-btn"
      href={chatUrl}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none pulse-gold"
      title="Fale Conosco no WhatsApp"
    >
      <MessageSquare className="w-7 h-7" />
    </a>
  );
}
