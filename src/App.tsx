import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  ShoppingCart,
  MessageSquare,
  Gift,
  ArrowRight,
  Info,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
  Lock,
  Compass,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './data';
import ProductCard from './components/ProductCard';
import MysteryBox from './components/MysteryBox';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Catalog State - hydrated from localStorage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('garage_sale_catalog');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Admin WhatsApp custom configuration
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    return localStorage.getItem('garage_sale_wa_num') || '59899123456';
  });

  // Buyer Inquiry Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('garage_sale_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Won Gift from Mystery Box
  const [wonGift, setWonGift] = useState<Product | null>(() => {
    const saved = localStorage.getItem('garage_sale_gift');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // UI Control states
  const [viewMode, setViewMode] = useState<'buyer' | 'admin'>('buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<'all' | 'high' | 'medium' | 'free'>('all');
  const [isMysteryBoxOpen, setIsMysteryBoxOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  // Sync products, cart & gifts to localStorage
  useEffect(() => {
    localStorage.setItem('garage_sale_catalog', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('garage_sale_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('garage_sale_gift', wonGift ? JSON.stringify(wonGift) : '');
  }, [wonGift]);

  useEffect(() => {
    localStorage.setItem('garage_sale_wa_num', whatsappNumber);
  }, [whatsappNumber]);

  // Derived Values
  const availableLowScoreGifts = products.filter(
    (p) => (p.isOfferBonus || p.score <= 2) && p.status === 'disponible'
  );

  const cartHasPremiumItem = cart.some((item) => item.product.score >= 4 && item.product.status === 'disponible');

  // Total sums
  const totalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalUYU = cart.reduce((sum, item) => sum + item.product.priceUYU * item.quantity, 0);

  // Auto forfeit won gift if custom conditions aren't met
  useEffect(() => {
    if (!cartHasPremiumItem && wonGift) {
      setWonGift(null);
    }
  }, [cart, cartHasPremiumItem, wonGift]);

  // Handlers
  const handleAddToCart = (product: Product) => {
    const exists = cart.find((item) => item.product.id === product.id);
    if (exists) {
      // Remove if click on a listed item
      setCart(cart.filter((item) => item.product.id !== product.id));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
      setIsCartOpen(true);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleQuickWhatsApp = (product: Product) => {
    const greeting = `¡Hola Pablo! Me interesa ver o reservar este artículo de tu venta de garage de mudanza:\n\n👉 *${product.name}* (U$S ${product.priceUSD} / $${product.priceUYU} UYU)\n\n¿Es posible pasar a verlo? ¡Gracias!`;
    const encoded = encodeURIComponent(greeting);
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
  };

  const handleClaimGift = (gift: Product) => {
    setWonGift(gift);
  };

  const handleSendFullInquiry = () => {
    if (cart.length === 0) return;

    let itemsText = cart
      .map(
        (item) =>
          `• *${item.product.name}* [Cat: ${item.product.category}] - U$S ${item.product.priceUSD} (~$${item.product.priceUYU} UYU)`
      )
      .join('\n');

    if (wonGift) {
      itemsText += `\n\n🎁 *REGALO DE CAJA SORPRESA GANADO:* ${wonGift.name} (Gratis con mi compra de artículo premium)`;
    }

    const message = `¡Buenas Pablo! Vi tu sitio de mudanza Uruguay 🇺🇾 ➡️ Canadá 🇨🇦 y me interesa reservar lo siguiente:\n\n${itemsText}\n\n*Total estimado:* U$S ${totalUSD} / ~$${totalUYU} UYU\n\n¿Cuándo puedo pasar por Pocitos a retirarlo o coordinar? ¡Abrazo!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
  };

  // Admin callbacks
  const handleAddProduct = (newProd: Product) => {
    setProducts([newProd, ...products]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts(products.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    
    // Automatically update item in cart if status changed to vendido
    if (updatedProd.status === 'vendido') {
      setCart(cart.filter(item => item.product.id !== updatedProd.id));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === updatedProd.id ? { ...item, product: updatedProd } : item
        )
      );
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    setCart(cart.filter((item) => item.product.id !== id));
    if (wonGift?.id === id) {
      setWonGift(null);
    }
  };

  const handleExportCatalog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'productos_mudanza.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportCatalog = (imported: Product[]) => {
    setProducts(imported);
  };

  const handleResetCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    setCart([]);
    setWonGift(null);
  };

  // Filter Catalog
  const filteredProducts = products.filter((p) => {
    // Category match
    if (selectedCategory !== 'Todos' && p.category !== selectedCategory) {
      return false;
    }

    // Score classification
    if (selectedScoreFilter === 'high' && p.score < 4) return false;
    if (selectedScoreFilter === 'medium' && (p.score !== 3)) return false;
    if (selectedScoreFilter === 'free' && (p.score > 2 && !p.isOfferBonus)) return false;

    // Search query match
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  return (
    <div id="main-layout" className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      
      {/* HEADER SECTION WITH THE TRANSITION EMOTION */}
      <header className="relative bg-[#FFE600] border-b-4 border-black text-black overflow-hidden py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🇺🇾</span>
              <div className="h-1 w-12 bg-black relative">
                <span className="absolute -top-1.5 left-4 text-xs">✈️</span>
              </div>
              <span className="text-xl">🇨🇦</span>
              <span className="text-xs font-mono uppercase tracking-widest text-black bg-white px-3 py-1 font-bold border-2 border-black">
                ¡Gran Liquidación de Mudanza!
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-neutral-950 mb-2">
              ¡Vendo todo por mudanza a Canadá!
            </h1>
            <p className="text-neutral-800 max-w-xl text-xs md:text-sm font-bold leading-relaxed">
              Me estoy mudando de Montevideo a Canadá. Para no viajar con sobrepeso, vendo casi todos los artículos del hogar a precios increíbles. Los de puntuación baja se van como regalo o combo si llevas artículos premium. ¡Aprovechá antes de que parta el vuelo!
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setViewMode(viewMode === 'buyer' ? 'admin' : 'buyer');
              }}
              className="flex-1 md:flex-initial px-5 py-3 border-2 border-black bg-black text-white hover:bg-neutral-800 font-bold active:scale-98 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-tight shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
              id="view-mode-toggle-btn"
            >
              {viewMode === 'buyer' ? (
                <>
                  <Lock className="h-4 w-4" /> Administrar Catálogo (Dueño)
                </>
              ) : (
                <>
                  Ver como Comprador
                </>
              )}
            </button>

            <button
              onClick={() => setShowFaq(!showFaq)}
              className="px-4 py-3 border-2 border-black bg-white hover:bg-neutral-100 text-black font-extrabold text-xs transition-colors uppercase tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              id="how-it-works-btn"
            >
              ¿Cómo comprar/Funciona?
            </button>
          </div>
        </div>
      </header>

      {/* QUICK FAQ COLLAPSIBLE WINDOW */}
      <AnimatePresence>
        {showFaq && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black border-b-4 border-black text-white overflow-hidden py-6 px-4"
            id="faq-section"
          >
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1 p-3 border-2 border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-[#3483FA] text-white border border-black font-mono text-xs font-black">1</span>
                  <span className="font-extrabold text-sm uppercase tracking-tight">Explorás y elegís</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                  Agregás los artículos que te interesan. Podes filtrar por categorías, precios o puntuación de calidad.
                </p>
              </div>

              <div className="space-y-1 p-3 border-2 border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-[#FFE600] text-black border border-black font-mono text-xs font-black">2</span>
                  <span className="font-extrabold text-sm uppercase tracking-tight">¡Abrís la Caja Regalo! 🎁</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                  ¿Elegiste algún producto premium (Score 4 y 5)? ¡Te ganás un artículo chico totalmente gratis desde la ruleta!
                </p>
              </div>

              <div className="space-y-1 p-3 border-2 border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-[#00A650] text-white border border-black font-mono text-xs font-black">3</span>
                  <span className="font-extrabold text-sm uppercase tracking-tight">Coordinás por WA</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                  Hacés clic en "Coordinar". Te generará un borrador detallado listo para mandar a Pablo para retirar por Pocitos.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          
          {/* BUYER CATALOG VIEW */}
          {viewMode === 'buyer' ? (
            <motion.div
              key="buyer-catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              
              {/* FILTERS AND SEARCH COMPONENT */}
              <div className="bg-white dark:bg-neutral-900 p-5 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] flex flex-col lg:flex-row gap-4 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="¿Qué estás buscando para tu casa?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 text-xs md:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:bg-white"
                    id="catalog-search-input"
                  />
                </div>

                {/* Score & Category Filters */}
                <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
                  <SlidersHorizontal className="h-4 w-4 text-neutral-400 mr-1 hidden md:inline" />
                  
                  {/* Category Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-[#FFE600] text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-tight">
                    <span>Categoría:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent border-none text-black font-extrabold cursor-pointer focus:outline-none font-sans"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Score Filter Presets */}
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 border-2 border-black dark:border-neutral-700 text-xs font-bold gap-1">
                    <button
                      onClick={() => setSelectedScoreFilter('all')}
                      className={`px-3 py-1.5 transition-all text-[11px] uppercase tracking-wider ${selectedScoreFilter === 'all' ? 'bg-black text-white dark:bg-neutral-700 font-black' : 'text-neutral-500 hover:text-neutral-800'}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedScoreFilter('high')}
                      className={`px-3 py-1.5 transition-all flex items-center gap-0.5 text-[11px] uppercase tracking-wider ${selectedScoreFilter === 'high' ? 'bg-[#FFE600] text-black font-black border border-black' : 'text-neutral-500 hover:text-neutral-[#FFE600]'}`}
                      title="Productos premium de alto valor"
                    >
                      Premium ⭐4-5
                    </button>
                    <button
                      onClick={() => setSelectedScoreFilter('medium')}
                      className={`px-3 py-1.5 transition-all text-[11px] uppercase tracking-wider ${selectedScoreFilter === 'medium' ? 'bg-neutral-300 text-black font-black border border-neutral-400' : 'text-neutral-500 hover:text-neutral-800'}`}
                      title="Artículos en buen estado general"
                    >
                      Medios ⭐3
                    </button>
                    <button
                      onClick={() => setSelectedScoreFilter('free')}
                      className={`px-3 py-1.5 transition-all flex items-center gap-0.5 text-[11px] uppercase tracking-wider ${selectedScoreFilter === 'free' ? 'bg-purple-600 text-white font-black' : 'text-neutral-500 hover:text-neutral-800'}`}
                      title="Saldos, plantas, decorativos listos para regalar"
                    >
                      Oportunidad 🎁
                    </button>
                  </div>

                </div>
              </div>

              {/* DYNAMIC ALERT BANNER REGARDING EXTRA GIFT */}
              {cartHasPremiumItem ? (
                <div className="bg-[#FFE600] border-2 border-black text-black p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="p-4 bg-black text-white border-2 border-white rounded-none animate-bounce">
                      <Gift className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-neutral-900 text-lg uppercase tracking-tight">
                        ¡Habilitaste tu tirada en la Caja Regalo! 🎉
                      </h4>
                      <p className="text-neutral-900 font-bold text-xs md:text-sm mt-0.5">
                        {wonGift ? (
                          <>
                            Te ganaste un/a <strong>{wonGift.name}</strong> para tu combo de mudanza. ¡Felicidades!
                          </>
                        ) : (
                          'Como seleccionaste un artículo de alta gama, tenés un regalo de la ruleta totalmente gratis.'
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMysteryBoxOpen(true)}
                    className="w-full md:w-auto px-6 py-3 border-2 border-black bg-black text-white hover:bg-neutral-850 font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-transform active:translate-x-0.5"
                    id="launch-drawer-mystery-box-btn"
                  >
                    {wonGift ? (
                      <>Ver mi Regalo 🎁</>
                    ) : (
                      <>Elegir mi Regalo Sorpresa 🎲</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 p-5 text-xs text-neutral-800 dark:text-neutral-100 flex items-center gap-3">
                  <Info className="h-5 w-5 text-[#3483FA] flex-shrink-0" />
                  <p className="font-bold">
                    💡 <strong>Consejo del Mudador:</strong> Agrega cualquier artículo calificado como <strong>Premium ⭐4-5</strong> (por ejemplo: Heladera, Bicicleta GT, o Sofá de Living) para desbloquear automáticamente la <strong>Caja de Regalo de mudanza</strong> y llevarte uno de los artículos chicos totalmente gratis.
                  </p>
                </div>
              )}

              {/* GRID OF CATALOGUE ARTICLES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                    <Compass className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                      No encontramos ningún artículo con estos filtros o búsqueda.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('Todos');
                        setSelectedScoreFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-neutral-800 text-indigo-700 dark:text-white rounded-xl text-xs font-semibold"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      isInCart={cart.some((item) => item.product.id === product.id)}
                      onQuickWhatsApp={handleQuickWhatsApp}
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            
            /* ADMINISTRATIVE VIEW */
            <motion.div
              key="admin-dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-indigo-500" /> Panel del Propietario (Pablo)
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Configura tu número de WhatsApp receptor, modifica precios, añade fotos reales y marca artículos vendidos sobre la marcha.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">Celular WhatsApp:</span>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-32 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    placeholder="Ej. 59899123456"
                    title="Ingresa tu celular sin símbolos. Ej: 59899123456"
                    id="admin-wa-input"
                  />
                </div>
              </div>

              <AdminPanel
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onExportCatalog={handleExportCatalog}
                onImportCatalog={handleImportCatalog}
                onResetCatalog={handleResetCatalog}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FLOAT INQUIRY CART DRAWER FLOATER AND TOGGLER */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center gap-2.5 relative"
          id="toggle-cart-drawer-float-btn"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="font-bold text-xs pr-1 md:inline hidden">Mi Consulta</span>
          
          {cart.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-xs font-black rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
              {cart.length}
            </div>
          )}
        </motion.button>
      </div>

      {/* INQUIRY SIDEBAR DRAWER PANEL */}
      <AnimatePresence>
        {isCartOpen && (
          <div id="cart-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                id="cart-drawer-panel"
                className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col justify-between border-l border-neutral-100 dark:border-neutral-800"
              >
                
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Mi Lista de Interés</h3>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Items Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-neutral-400">
                      <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold">Tu lista está vacía.</p>
                      <p className="text-xs text-neutral-400 mt-1">Explora el garage sale y agrega cosas para reservar.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Premium activation mini box */}
                      {cartHasPremiumItem ? (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                          <Gift className="h-5 w-5 text-amber-500 flex-shrink-0 animate-bounce" />
                          <div className="flex-1 text-left">
                            <span className="font-bold text-xs text-neutral-900 dark:text-amber-400 block">¡Tiro de Caja Disponible!</span>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-300">
                              {wonGift 
                                ? `Ganaste: ${wonGift.name} (¡Incluído gratis!)`
                                : 'Hacé click para tirar la tómbola.'}
                            </span>
                          </div>
                          <button
                            onClick={() => setIsMysteryBoxOpen(true)}
                            className="px-2 py-1 bg-amber-500 text-neutral-900 text-[10px] font-bold rounded-lg"
                            id="drawer-open-mystery-box-btn"
                          >
                            {wonGift ? 'Detalle' : 'Abrir'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/35 flex items-start gap-2.5">
                          <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-neutral-600 dark:text-indigo-300">
                            <strong>¿Querés un regalo?</strong> Si agregás un producto de calidad <strong>Premium ⭐4-5</strong>, ¡se te habilita tirar en la Caja de Regalo!
                          </p>
                        </div>
                      )}

                      {/* Items loop */}
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 space-y-3">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex gap-3 pt-3 first:pt-0">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-xs text-neutral-900 dark:text-white line-clamp-1">{item.product.name}</h4>
                              <span className="text-[10px] text-neutral-400 block font-mono">{item.product.category}</span>
                              <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">U$S {item.product.priceUSD}</span>
                                <span className="text-[10px] text-neutral-400">(${item.product.priceUYU} UYU)</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="text-neutral-400 hover:text-rose-500 transition-colors self-center p-1"
                              id={`remove-cart-item-${item.product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        {/* Gift inclusion inside view list */}
                        {wonGift && (
                          <div className="flex gap-3 pt-3 border-t-2 border-dashed border-amber-500/20 bg-amber-500/5 p-2 rounded-xl">
                            <img
                              src={wonGift.imageUrl}
                              alt={wonGift.name}
                              className="w-12 h-12 object-cover rounded-lg border border-amber-500/30"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-1">
                                <span className="bg-amber-500 text-[8px] font-bold text-neutral-900 px-1 py-0.2 rounded">Premio</span>
                                <h4 className="font-bold text-xs text-neutral-900 dark:text-white line-clamp-1">{wonGift.name}</h4>
                              </div>
                              <span className="text-[10px] text-neutral-400 block font-mono">Arreglado de mudanza</span>
                              <span className="text-emerald-500 text-xs font-bold font-mono">¡GRATIS ($0)!</span>
                            </div>
                            <button
                              onClick={() => setWonGift(null)}
                              className="text-neutral-400 hover:text-rose-500 transition-colors self-center p-1"
                              id="discard-gift-btn"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Sums and CTA Actions */}
                <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/20 space-y-4">
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-400 font-medium">Suma Total (Dólares):</span>
                      <span className="text-xl font-bold font-mono text-neutral-950 dark:text-white">U$S {totalUSD}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-400 font-medium">Equivalente Estimado Pesos:</span>
                      <span className="text-sm font-semibold font-mono text-neutral-500">${totalUYU} UYU</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSendFullInquiry}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-colors text-xs md:text-sm uppercase tracking-wide"
                    id="submit-whatsapp-full-cart-btn"
                  >
                    <MessageSquare className="h-4.5 w-4.5" /> Coordinar por WhatsApp
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center">
                    Los pagos se coordinan directo con Pablo (en mano / transferencia bancaria). Retiros en Pocitos, Montevideo.
                  </p>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* BOX GAME LIGHTBOX MODAL OVERLAY */}
      <AnimatePresence>
        {isMysteryBoxOpen && (
          <MysteryBox
            availableGifts={availableLowScoreGifts}
            onSelectGift={handleClaimGift}
            onClose={() => setIsMysteryBoxOpen(false)}
            hasWon={!!wonGift}
            wonGiftProduct={wonGift}
          />
        )}
      </AnimatePresence>

      {/* FOOTER SECTION */}
      <footer className="bg-neutral-900 border-t border-neutral-800 text-neutral-400 py-12 px-4 mt-16 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1 text-white font-extrabold mb-1">
              <span>🇲🇺 Venta de Garage</span> • <span>Montevideo ➡️ Canadá 🍁</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Desarrollado para acelerar la rotación de inventarios domésticos. Retiros coordinados por Pocitos.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setViewMode('admin');
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              Control Dueño
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (confirm('¿Restablecer datos originales del simulador? Se limpiará caché.')) {
                  handleResetCatalog();
                }
              }}
              className="hover:text-white transition-colors"
            >
              Caché por Defecto
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
