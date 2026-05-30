/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Sun, Moon, Volume2, ShieldCheck, Clock } from 'lucide-react';

interface Props {
  text: string;
  isOpen: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: string[];
  clearNotifications: () => void;
}

export default function PromoBanner({
  text,
  isOpen,
  isDarkMode,
  onToggleDarkMode,
  notifications,
  clearNotifications
}: Props) {
  return (
    <div className="w-full select-none">
      {/* Top micro promotion bar */}
      <div className="bg-neutral-950 text-white text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{text || '🔥 O melhor churrasquinho assado na brasa da cidade!'}</span>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Business Open/Closed Status indicator */}
          <div className="flex items-center gap-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span className={`${isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOpen ? 'Aberto Agora' : 'Fechado para Pedidos'}
            </span>
          </div>

          <span className="text-neutral-500">|</span>

          {/* Theme switcher */}
          <button
            id="theme-toggler"
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400 px-1 rounded cursor-pointer"
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-300" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating alert bar for new push/real-time notifications */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 border-y border-amber-200 py-2.5 px-4 animate-fade-in flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-800 text-xs md:text-sm">
            <Volume2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-900">Aviso:</span>
            <span>{notifications[notifications.length - 1]}</span>
          </div>
          <button
            onClick={clearNotifications}
            className="text-xs font-semibold text-amber-600 hover:text-amber-800 cursor-pointer hover:underline pl-3"
          >
            Dispensar
          </button>
        </div>
      )}
    </div>
  );
}
