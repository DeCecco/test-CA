import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Check, RefreshCw, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface MysteryBoxProps {
  availableGifts: Product[];
  onSelectGift: (product: Product) => void;
  onClose: () => void;
  hasWon: boolean;
  wonGiftProduct: Product | null;
}

export default function MysteryBox({
  availableGifts,
  onSelectGift,
  onClose,
  hasWon,
  wonGiftProduct,
}: MysteryBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<Product | null>(wonGiftProduct);

  const startDraw = () => {
    if (availableGifts.length === 0) return;
    setIsOpening(true);

    // Shuffle effect: switch images/names quickly to build excitement
    let count = 0;
    const interval = setInterval(() => {
      setShuffleIndex(Math.floor(Math.random() * availableGifts.length));
      count++;
      if (count > 15) {
        clearInterval(interval);
        // Select the final random gift
        const randomIndex = Math.floor(Math.random() * availableGifts.length);
        const selected = availableGifts[randomIndex];
        setCurrentPrize(selected);
        onSelectGift(selected);
        setIsOpening(false);
      }
    }, 120);
  };

  return (
    <div id="mystery-box-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        id="mystery-box-modal"
        className="relative w-full max-w-md overflow-hidden rounded-none bg-white dark:bg-neutral-900 border-4 border-black text-black dark:text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
      >
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#3483FA] font-black">Sorteo de Mudanza</span>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-black text-white p-1 hover:bg-[#FFE600] hover:text-black transition-colors"
            id="close-mystery-box-btn"
          >
            <X className="h-5 w-5 stroke-[3px]" />
          </button>
        </div>

        <div className="p-8 text-center relative z-10 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!currentPrize ? (
              <motion.div
                key="box-closed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center w-full"
              >
                <h3 className="text-2xl font-black font-sans tracking-tight mb-2 uppercase text-neutral-950 dark:text-white leading-tight">
                  ¡Caja de Regalos Desbloqueada! 🎁
                </h3>
                <p className="text-xs text-neutral-650 dark:text-neutral-400 mb-6 max-w-xs mx-auto font-bold">
                  Por llevar un producto premium, te regalamos un artículo sorpresa de puntuación media/baja al azar para acelerar el vaciado de la casa.
                </p>

                {/* Animated Interactive Box */}
                <motion.div
                  animate={
                    isOpening
                      ? {
                          rotate: [-4, 4, -4, 4, -6, 6, -2, 2, 0],
                          scale: [1, 1.08, 0.96, 1.08, 1],
                          transition: { repeat: Infinity, duration: 0.5 },
                        }
                      : {
                          y: [0, -6, 0],
                          transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                        }
                  }
                  onClick={!isOpening ? startDraw : undefined}
                  className={`relative cursor-pointer group p-8 rounded-none mb-8 border-4 border-black ${
                    isOpening 
                      ? 'bg-[#FFE600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white dark:bg-neutral-850 hover:bg-[#FFE600] hover:text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  } transition-all duration-300`}
                >
                  <Gift className="h-16 w-16 text-black" />
                </motion.div>

                {isOpening ? (
                  <div className="space-y-2">
                    <p className="text-[#3483FA] font-mono text-xs font-black flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin stroke-[3px]" />
                      REVOLVIENDO CONTENEDOR...
                    </p>
                    {availableGifts.length > 0 && (
                      <p className="text-neutral-500 font-bold text-xs">
                        Posibilidad: "{availableGifts[shuffleIndex]?.name}"
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={startDraw}
                    className="w-full py-3.5 px-8 border-2 border-black bg-[#FFE600] text-black hover:bg-[#ffe600]/80 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
                    id="open-box-spin-btn"
                  >
                    Tirar de la Ruleta <ArrowRight className="h-4 w-4 stroke-[3px]" />
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="box-opened"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className="relative mb-4">
                  <div className="bg-[#00A650] text-white font-black px-4 py-1 border-2 border-black text-xs uppercase tracking-wider mb-2 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-3.5 w-3.5 fill-white" /> ¡Premio Conseguido!
                  </div>
                </div>

                <div className="w-48 h-48 rounded-none overflow-hidden border-4 border-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <img
                    src={currentPrize.imageUrl}
                    alt={currentPrize.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h3 className="text-2xl font-black font-sans tracking-tight text-neutral-900 dark:text-white mb-1 uppercase">
                  {currentPrize.name}
                </h3>
                <p className="text-xs text-[#3483FA] font-mono font-bold mb-3 uppercase tracking-wide">
                  Categoría: {currentPrize.category} • Puntuación: {currentPrize.score}⭐
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-xs mb-6 italic font-medium">
                  "{currentPrize.description}"
                </p>

                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-none p-3 border-2 border-black w-full mb-6 text-left">
                  <span className="text-[10px] uppercase font-mono text-neutral-550 block mb-1 font-bold">Costo del regalo</span>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 line-through text-xs font-bold font-mono">
                      US$ {currentPrize.priceUSD} / ${currentPrize.priceUYU} UYU
                    </span>
                    <span className="text-[#00A650] font-black text-lg font-mono">
                      ¡GRATIS ($0)!
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-6 border-2 border-black bg-black text-white hover:bg-neutral-800 font-extrabold uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    id="accept-gift-btn"
                  >
                    Excelente, ¡Lo quiero! 💪
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
