import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, Gift, Check, ArrowRight, MessageSquare } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
  onQuickWhatsApp: (product: Product) => void;
  key?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  isInCart,
  onQuickWhatsApp,
}: ProductCardProps) {
  const isPremium = product.score >= 4;
  const isSold = product.status === 'vendido';
  const isReserved = product.status === 'reservado';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      id={`product-card-${product.id}`}
      className={`relative flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden border-2 border-black dark:border-neutral-700 ${
        isInCart 
          ? 'shadow-[6px_6px_0px_0px_rgba(52,131,250,1)] ring-1 ring-[#3483FA]/40' 
          : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]'
      } transition-all duration-300`}
    >
      {/* Dynamic badges on top corner of the image */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-none font-bold uppercase tracking-wider border border-black">
          {product.category}
        </span>
        
        {isPremium && (
          <span className="text-[10px] bg-[#FFE600] text-neutral-950 px-2.5 py-1 font-black flex items-center gap-1 border border-black uppercase tracking-tight animate-pulse">
            <Sparkles className="h-3 w-3 fill-neutral-950" /> PREMIUM ⭐{product.score}
          </span>
        )}

        {(product.isOfferBonus || product.score <= 2) && (
          <span className="text-[10px] bg-purple-600 text-white px-2.5 py-1 font-bold flex items-center gap-1 border border-black">
            <Gift className="h-3 w-3" /> REGALO
          </span>
        )}
      </div>

      {/* Image container with sold/reserved overlay */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 border-b-2 border-black overflow-hidden select-none">
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isSold ? 'grayscale contrast-75 brightness-75' : ''}`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {isSold && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
            <span className="px-5 py-2 bg-black text-rose-500 border-2 border-rose-500 font-extrabold tracking-widest text-[15px] uppercase shadow-[3px_3px_0px_0px_rgba(244,63,94,1)] rotate-[-8deg]">
              ¡VENDIDO!
            </span>
            <p className="text-white text-[10px] mt-3 text-center font-bold font-mono tracking-tight bg-black/80 px-2 py-0.5">Ya tiene dueño en Canadá</p>
          </div>
        )}

        {isReserved && (
          <div className="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center p-4">
            <span className="px-4 py-1.5 bg-amber-500 text-neutral-950 font-black tracking-widest text-[11px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              RESERVADO
            </span>
            <p className="text-white text-[10px] mt-2 text-center font-mono font-bold bg-black/50 px-2 py-0.5">Preguntá si se libera</p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Rating Stars as elegant Neobrutalist design */}
          <div className="flex items-center gap-0.5" id={`product-stars-${product.id}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < product.score 
                    ? 'fill-amber-400 stroke-black dark:stroke-amber-400' 
                    : 'stroke-neutral-300 dark:stroke-neutral-700'
                }`}
              />
            ))}
            <span className="text-[10px] text-neutral-500 font-mono font-bold ml-1">Score: {product.score}/5</span>
          </div>

          <h3 className="font-extrabold text-neutral-900 dark:text-white font-sans text-base line-clamp-1 group-hover:text-[#3483FA] transition-colors leading-tight">
            {product.name}
          </h3>

          <p className="text-neutral-500 dark:text-neutral-400 text-xs line-clamp-2 leading-relaxed h-8">
            {product.description}
          </p>
        </div>

        {/* Price Tag with modern Uruguay display */}
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest leading-none mb-1">Precio de liquidación</span>
            <div className="flex items-baseline gap-1" id={`product-price-${product.id}`}>
              <span className="text-xl font-black text-neutral-900 dark:text-white font-mono">
                U$S {product.priceUSD}
              </span>
              <span className="text-[11px] text-[#3483FA] font-black font-mono">
                (~${product.priceUYU} UYU)
              </span>
            </div>
          </div>
        </div>

        {/* Promo info banner on the card */}
        <div className="mt-3">
          {isPremium ? (
            <div className="bg-amber-100 dark:bg-amber-950/20 text-neutral-900 dark:text-amber-300 p-2 text-[10px] font-bold flex items-center gap-1 border border-black">
              🎁 <span>¡Llevá este premium y tirá en la <strong>Caja de Regalos</strong>!</span>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 p-2 text-[10px] font-bold border border-gray-300 dark:border-neutral-700">
              🪴 <span><strong>Ahorro:</strong> Elegible para sumarlo de regalo.</span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-4 flex gap-2">
          {!isSold ? (
            <>
              <button
                onClick={() => onAddToCart(product)}
                disabled={isSold}
                className={`flex-1 py-2 px-3 text-xs font-bold tracking-wide transition-all duration-200 active:translate-x-0.5 active:translate-y-0.5 border border-black ${
                  isInCart
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#3483FA] hover:bg-[#206cd2] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
                id={`add-to-cart-btn-${product.id}`}
              >
                {isInCart ? (
                  <span className="flex items-center justify-center gap-1 uppercase tracking-tight">
                    <Check className="h-3.5 w-3.5 stroke-[3px]" /> En lista
                  </span>
                ) : (
                  <span className="uppercase tracking-tight">Llevar / Reservar</span>
                )}
              </button>

              <button
                onClick={() => onQuickWhatsApp(product)}
                className="p-2 border border-black hover:bg-neutral-950 hover:text-[#FFE600] transition-colors"
                title="Consultar por WhatsApp directamente"
                id={`quick-wa-btn-${product.id}`}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              disabled
              className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-300 dark:border-neutral-700 text-xs font-bold uppercase cursor-not-allowed"
              id={`sold-btn-${product.id}`}
            >
              Sin Stock
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
