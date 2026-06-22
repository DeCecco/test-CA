import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, Gift, Check, MessageSquare, ChevronLeft, ChevronRight, Play, Maximize2, X } from 'lucide-react';
import { Product } from '../types';
import { categoryTranslations } from '../translations';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
  onQuickWhatsApp: (product: Product) => void;
  lang?: 'es' | 'en';
  key?: string;
}

function getVideoEmbedUrl(url: string) {
  if (!url) return { type: 'unsupported', url: '' };
  
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(ytRegExp);
  if (match && match[2].length === 11) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1`
    };
  }
  
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1`
    };
  }

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('video') || lowerUrl.includes('.quicktime')) {
    return {
      type: 'direct',
      url
    };
  }
  
  if (lowerUrl.includes('embed') || lowerUrl.includes('player.vimeo.com')) {
    return {
      type: 'youtube',
      url
    };
  }

  return {
    type: 'direct',
    url
  };
}

export default function ProductCard({
  product,
  onAddToCart,
  isInCart,
  onQuickWhatsApp,
  lang = 'es',
}: ProductCardProps) {
  const isPremium = product.score >= 4;
  const isSold = product.status === 'vendido';
  const isReserved = product.status === 'reservado';

  const categoryName = categoryTranslations[lang]?.[product.category] || product.category;

  const [activeMediaIndex, setActiveMediaIndex] = React.useState(0);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  // Collect all available media items for the product
  const mediaItems = React.useMemo(() => {
    const list: Array<{ type: 'image' | 'video'; url: string }> = [];
    if (product.imageUrl) {
      list.push({ type: 'image', url: product.imageUrl });
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && img.trim().length > 0) {
          list.push({ type: 'image', url: img.trim() });
        }
      });
    }
    if (product.videoUrl && product.videoUrl.trim().length > 0) {
      list.push({ type: 'video', url: product.videoUrl.trim() });
    }
    return list;
  }, [product.imageUrl, product.images, product.videoUrl]);

  // Adjust index if out of bounds
  React.useEffect(() => {
    if (activeMediaIndex >= mediaItems.length) {
      setActiveMediaIndex(0);
    }
  }, [mediaItems, activeMediaIndex]);

  const activeItem = mediaItems[activeMediaIndex] || { type: 'image', url: product.imageUrl };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const textDict = {
    es: {
      premium: 'PREMIUM',
      gift: 'REGALO',
      sold: '¡VENDIDO!',
      soldDesc: 'Ya tiene dueño en Canadá',
      reserved: 'RESERVADO',
      reservedDesc: 'Preguntá si se libera',
      clearancePrice: 'Precio de liquidación',
      premiumPromo: '🎁 ¡Llevá este premium y tirá en la Caja de Regalos!',
      standardPromo: '🪴 Ahorro: Elegible para sumarlo de regalo.',
      inList: 'En lista',
      addList: 'Llevar / Reservar',
      outOfStock: 'Sin Stock',
      quickWaTitle: 'Consultar por WhatsApp directamente',
      closeBtn: 'Cerrar x',
    },
    en: {
      premium: 'PREMIUM',
      gift: 'FREE GIFT',
      sold: 'SOLD!',
      soldDesc: 'Already has an owner in Canada',
      reserved: 'RESERVED',
      reservedDesc: 'Ask if it becomes available',
      clearancePrice: 'Clearance price',
      premiumPromo: '🎁 Buy this premium item & spin the Gift Box!',
      standardPromo: '🪴 Bargain: Eligible to get as a free gift.',
      inList: 'In list',
      addList: 'Claim / Reserve',
      outOfStock: 'Out of Stock',
      quickWaTitle: 'Inquire directly via WhatsApp',
      closeBtn: 'Close x',
    }
  }[lang];

  return (
    <>
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
        {/* ribbon for offer banner */}
        {product.showOfferBanner && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
            <div className="absolute top-4 -right-8 w-28 bg-red-600 dark:bg-rose-600 text-white font-black text-[9px] tracking-widest text-center py-1.5 rotate-45 border-y border-black uppercase shadow-lg">
              {lang === 'es' ? 'OFERTA' : 'OFFER'}
            </div>
          </div>
        )}

        {/* Dynamic badges on top corner of the image */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-none font-bold uppercase tracking-wider border border-black">
            {categoryName}
          </span>
          
          {isPremium && (
            <span className="text-[10px] bg-[#FFE600] text-neutral-950 px-2.5 py-1 font-black flex items-center gap-1 border border-black uppercase tracking-tight animate-pulse">
              <Sparkles className="h-3 w-3 fill-neutral-950" /> {textDict.premium} ⭐{product.score}
            </span>
          )}

          {(product.isOfferBonus || product.score <= 2) && (
            <span className="text-[10px] bg-purple-600 text-white px-2.5 py-1 font-bold flex items-center gap-1 border border-black">
              <Gift className="h-3 w-3" /> {textDict.gift}
            </span>
          )}
        </div>

        {/* Magnifier / Zoom button for current active image */}
        {activeItem.type === 'image' && !isSold && !isReserved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(activeItem.url);
            }}
            className={`absolute ${product.showOfferBanner ? 'top-12' : 'top-3'} right-3 z-30 p-1.5 bg-black/80 hover:bg-[#FFE600] text-white hover:text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] select-none transition-colors`}
            title={lang === 'es' ? 'Ampliar imagen' : 'Enlarge image'}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Media Carousel container with sold/reserved overlay */}
        <div className="relative aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-950 border-b-2 border-black overflow-hidden select-none">
          {/* Active media display */}
          <div className="w-full h-full relative">
            {activeItem.type === 'video' ? (
              (() => {
                const videoData = getVideoEmbedUrl(activeItem.url);
                if (videoData.type === 'youtube') {
                  return (
                    <iframe
                      src={videoData.url}
                      title={`${product.name} Video`}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                } else {
                  return (
                    <video
                      src={videoData.url}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  );
                }
              })()
            ) : (
              <img
                src={activeItem.url}
                alt={product.name}
                onClick={() => {
                  if (!isSold && !isReserved) {
                    setLightboxImage(activeItem.url);
                  }
                }}
                className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-[1.02] ${isSold ? 'grayscale contrast-75 brightness-75' : ''}`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
          </div>

          {/* Left/Right carousel navigation */}
          {mediaItems.length > 1 && (
            <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-2 pointer-events-none z-10">
              <button
                onClick={handlePrevMedia}
                className="w-7 h-7 bg-black text-white hover:bg-[#FFE600] hover:text-black border border-black flex items-center justify-center select-none cursor-pointer transition-all active:scale-90 pointer-events-auto shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4 stroke-[3px]" />
              </button>
              <button
                onClick={handleNextMedia}
                className="w-7 h-7 bg-black text-white hover:bg-[#FFE600] hover:text-black border border-black flex items-center justify-center select-none cursor-pointer transition-all active:scale-90 pointer-events-auto shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                title="Siguiente"
              >
                <ChevronRight className="h-4 w-4 stroke-[3px]" />
              </button>
            </div>
          )}

          {/* Thumbnails indicator overlay */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center px-2 pointer-events-none">
              <div className="flex bg-black/85 backdrop-blur-xs p-1 border-2 border-black max-w-full overflow-x-auto select-none no-scrollbar gap-1 pointer-events-auto">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex(idx);
                    }}
                    className={`relative w-8 h-8 flex-shrink-0 border transition-all ${
                      idx === activeMediaIndex 
                        ? 'border-[#FFE600] scale-105 z-10 font-bold' 
                        : 'border-neutral-600 hover:border-white'
                    } bg-neutral-900 overflow-hidden`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        <span className="absolute inset-0 bg-neutral-950/80" />
                        <Play className="h-3 w-3 text-[#FFE600] fill-[#FFE600] relative z-10" />
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSold && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 z-20">
              <span className="px-5 py-2 bg-black text-rose-500 border-2 border-rose-500 font-extrabold tracking-widest text-[15px] uppercase shadow-[3px_3px_0px_0px_rgba(244,63,94,1)] rotate-[-8deg]">
                {textDict.sold}
              </span>
              <p className="text-white text-[10px] mt-3 text-center font-bold font-mono tracking-tight bg-black/80 px-2 py-0.5">{textDict.soldDesc}</p>
            </div>
          )}

          {isReserved && (
            <div className="absolute inset-0 bg-neutral-900/60 flex flex-col items-center justify-center p-4 z-20">
              <span className="px-4 py-1.5 bg-amber-500 text-neutral-950 font-black tracking-widest text-[11px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {textDict.reserved}
              </span>
              <p className="text-white text-[10px] mt-2 text-center font-mono font-bold bg-black/50 px-2 py-0.5">{textDict.reservedDesc}</p>
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

          {/* Price Tag with Uruguay display */}
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 font-mono uppercase tracking-widest leading-none mb-1">{textDict.clearancePrice}</span>
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
          <div className="mt-3 font-sans w-full">
            {isPremium ? (
              <div className="bg-amber-100 dark:bg-amber-950/20 text-neutral-900 dark:text-amber-300 p-2 text-[10px] font-bold flex items-center gap-1 border border-black">
                {textDict.premiumPromo}
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 p-2 text-[10px] font-bold border border-gray-300 dark:border-neutral-700">
                {textDict.standardPromo}
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
                      <Check className="h-3.5 w-3.5 stroke-[3px]" /> {textDict.inList}
                    </span>
                  ) : (
                    <span className="uppercase tracking-tight">{textDict.addList}</span>
                  )}
                </button>

                <button
                  onClick={() => onQuickWhatsApp(product)}
                  className="p-2 border border-black hover:bg-neutral-950 hover:text-[#FFE600] transition-colors bg-white dark:bg-neutral-800 dark:text-white"
                  title={textDict.quickWaTitle}
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
                {textDict.outOfStock}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enlarged image lightbox modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-950/95 p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 border-2 border-black bg-[#FFE600] hover:bg-white text-black p-2 font-black text-xs uppercase flex items-center gap-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5 stroke-[3px]" /> {textDict.closeBtn}
            </button>
            <img 
              src={lightboxImage} 
              alt={product.name} 
              className="max-w-full max-h-[75vh] border-4 border-black object-contain shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-neutral-900"
              referrerPolicy="no-referrer"
            />
            <div className="mt-4 px-4 py-2 bg-black text-white text-center font-bold text-xs uppercase tracking-wider border-2 border-white">
              {product.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
