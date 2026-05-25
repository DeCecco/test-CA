import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  DollarSign,
  Star,
  Tag,
  Eye,
  FileDown,
  Upload,
  Lock,
  Unlock,
  CheckCircle,
  FileUp,
  RotateCcw,
  BookOpen,
  Image as ImageIcon,
  Pencil,
  Video,
  X
} from 'lucide-react';
import { Product, ProductStatus } from '../types';
import { CATEGORIES } from '../data';

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onExportCatalog: () => void;
  onImportCatalog: (imported: Product[]) => void;
  onResetCatalog: () => void;
}

export default function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onExportCatalog,
  onImportCatalog,
  onResetCatalog,
}: AdminPanelProps) {
  // Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[1] || 'Cocina y Electrodomésticos');
  const [newPriceUSD, setNewPriceUSD] = useState('');
  const [newPriceUYU, setNewPriceUYU] = useState('');
  const [newScore, setNewScore] = useState(5);
  const [imageType, setImageType] = useState<'url' | 'upload'>('upload');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [isOfferBonus, setIsOfferBonus] = useState(false);
  const [extraImagesText, setExtraImagesText] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Search in Admin
  const [apiSearch, setApiSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'canada2026') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. Pista: canada2026');
    }
  };

  // Turn image upload into base64
  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const autofillExchangeRate = () => {
    const usd = parseFloat(newPriceUSD);
    if (!isNaN(usd)) {
      setNewPriceUYU((usd * 40).toString()); // 1 USD = 40 UYU approx
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewName('');
    setNewDesc('');
    setNewPriceUSD('');
    setNewPriceUYU('');
    setNewScore(5);
    setNewImageUrl('');
    setUploadedBase64('');
    setExtraImagesText('');
    setVideoUrlInput('');
    setIsOfferBonus(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCategory) {
      alert('Por favor completa el nombre y la categoría.');
      return;
    }

    const usd = parseFloat(newPriceUSD) || 0;
    const uyu = parseFloat(newPriceUYU) || (usd * 40);

    const defaultUnsplash = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600';
    const finalImage = imageType === 'url' ? (newImageUrl || defaultUnsplash) : (uploadedBase64 || defaultUnsplash);

    // Parse extra images (comma or newline separated, filter out blanks)
    const extraImagesList = extraImagesText
      .split(/[\n,]+/)
      .map(img => img.trim())
      .filter(img => img.length > 0 && (img.startsWith('http') || img.startsWith('data:')));

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name: newName,
        description: newDesc,
        category: newCategory,
        priceUSD: usd,
        priceUYU: uyu,
        score: newScore,
        imageUrl: finalImage,
        images: extraImagesList.length > 0 ? extraImagesList : undefined,
        videoUrl: videoUrlInput.trim() || undefined,
        isOfferBonus: isOfferBonus || newScore <= 2
      };
      onUpdateProduct(updatedProduct);
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: newName,
        description: newDesc,
        category: newCategory,
        priceUSD: usd,
        priceUYU: uyu,
        score: newScore,
        imageUrl: finalImage,
        images: extraImagesList.length > 0 ? extraImagesList : undefined,
        videoUrl: videoUrlInput.trim() || undefined,
        status: 'disponible',
        isOfferBonus: isOfferBonus || newScore <= 2
      };
      onAddProduct(newProduct);
    }

    // Reset Form
    setNewName('');
    setNewDesc('');
    setNewPriceUSD('');
    setNewPriceUYU('');
    setNewScore(5);
    setNewImageUrl('');
    setUploadedBase64('');
    setExtraImagesText('');
    setVideoUrlInput('');
    setIsOfferBonus(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportCatalog(parsed);
            alert(`¡Se cargaron ${parsed.length} productos con éxito!`);
          } else {
            alert('Formato JSON no válido. Debe ser una lista de artículos.');
          }
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(apiSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(apiSearch.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div id="admin-auth-panel" className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400 mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-neutral-900 dark:text-white mb-2">
            Panel de Gestión - Mudanza
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Ingresá la contraseña de administración para actualizar precios, marcar ventas y agregar productos al catálogo.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Contraseña Administrativa
              </label>
              <input
                type="password"
                placeholder="Escribe la clave (pista: canada2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                id="admin-pass-input"
              />
            </div>

            {authError && (
              <p className="text-xs font-medium text-rose-500 text-left">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              id="admin-auth-submit-btn"
            >
              <Unlock className="h-4 w-4" /> Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-panel" className="space-y-8">
      {/* Overview stats and controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)]">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Total Artículos</span>
          <div className="text-3xl font-black text-neutral-950 dark:text-white">{products.length}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)]">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Disponibles</span>
          <div className="text-3xl font-black text-[#00A650]">
            {products.filter(p => p.status === 'disponible').length}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)]">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Reservados</span>
          <div className="text-3xl font-black text-amber-500">
            {products.filter(p => p.status === 'reservado').length}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)]">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-1">Vendidos 🎉</span>
          <div className="text-3xl font-black text-rose-500">
            {products.filter(p => p.status === 'vendido').length}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFE600] text-black p-4 border-2 border-black">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-black text-white"><BookOpen className="h-4 w-4" /></span>
          <div>
            <h4 className="font-extrabold text-sm uppercase">¿Cómo guardar cambios?</h4>
            <p className="text-xs font-bold">Modifica lo que quieras, exporta el JSON y guárdalo para no perder tus datos.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExportCatalog}
            className="px-4 py-2 bg-white text-black border-2 border-black hover:bg-neutral-100 font-extrabold text-xs flex items-center gap-1.5 uppercase"
            id="export-catalog-btn"
          >
            <FileDown className="h-4 w-4 text-[#3483FA] stroke-[3px]" /> Exportar JSON
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="px-4 py-2 bg-white text-black border-2 border-black hover:bg-neutral-100 font-extrabold text-xs flex items-center gap-1.5 uppercase"
            id="import-catalog-btn"
          >
            <FileUp className="h-4 w-4 text-purple-600 stroke-[3px]" /> Importar JSON
          </button>
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => {
              if (confirm('¿Estás seguro de restablecer el catálogo original? Perderás tus cambios no exportados.')) {
                onResetCatalog();
              }
            }}
            className="px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 border-2 border-black font-extrabold text-xs flex items-center gap-1.5 uppercase"
            id="reset-catalog-btn"
          >
            <RotateCcw className="h-4 w-4" /> Reestablecer Original
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-2 bg-black text-white hover:bg-neutral-800 border-2 border-black font-extrabold text-xs flex items-center gap-1 uppercase"
            id="logout-btn"
          >
            <Lock className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form to ADD or EDIT product */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              {editingProduct ? <Pencil className="h-5 w-5 text-amber-500 animate-pulse" /> : <Plus className="h-5 w-5 text-indigo-500" />}
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                {editingProduct ? 'Editar Artículo' : 'Agregar Nuevo Artículo'}
              </h3>
            </div>
            {editingProduct && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-rose-550 hover:text-rose-500 rounded-md flex items-center gap-1 transition-colors font-bold"
                title="Cancelar edición"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Nombre del artículo</label>
              <input
                type="text"
                placeholder="Ej. Mesa ratona de pino"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Descripción</label>
              <textarea
                placeholder="Detalles sobre estado, medidas, retiro, etc."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Puntuación (1-5)</label>
                <select
                  value={newScore}
                  onChange={(e) => setNewScore(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value={5}>5 - Premium / Alto Valor ⭐⭐⭐⭐⭐</option>
                  <option value={4}>4 - Muy Bueno / Alto Valor ⭐⭐⭐⭐</option>
                  <option value={3}>3 - Buen Estado ⭐⭐⭐</option>
                  <option value={2}>2 - Bajo Valor ⭐⭐</option>
                  <option value={1}>1 - Saldo / Regalo ⭐</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Precio USD</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    placeholder="U$S"
                    value={newPriceUSD}
                    onChange={(e) => setNewPriceUSD(e.target.value)}
                    onBlur={autofillExchangeRate}
                    className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Precio UYU ($ Pesos)</label>
                <input
                  type="number"
                  placeholder="UYU"
                  value={newPriceUYU}
                  onChange={(e) => setNewPriceUYU(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Image choosing layout */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Imagen del producto</label>
              <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImageType('upload')}
                  className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${imageType === 'upload' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-950'}`}
                >
                  <span className="flex items-center justify-center gap-1"><Upload className="h-3 w-3" /> Subir Archivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageType('url')}
                  className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${imageType === 'url' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-950'}`}
                >
                  <span className="flex items-center justify-center gap-1"><ImageIcon className="h-3 w-3" /> Enlace URL</span>
                </button>
              </div>

              {imageType === 'url' ? (
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUploaded}
                    className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-neutral-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {uploadedBase64 && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200">
                      <img src={uploadedBase64} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multiple extra images */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Imágenes adicionales (Opcional)
              </label>
              <textarea
                placeholder="https://link-imagen1.jpg&#10;https://link-imagen2.jpg&#10;(Una URL por línea, o separadas por comas)"
                value={extraImagesText}
                onChange={(e) => setExtraImagesText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5 leading-relaxed">
                Agrega fotos adicionales para que el comprador las vea en un carrusel interactivo táctil. Se abrirán en tamaño grande al tocarlas.
              </span>
            </div>

            {/* Video Url Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> URL de Video del Producto (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. https://www.youtube.com/watch?v=... o archivo mp4"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5 leading-relaxed">
                Enlaces de YouTube, Shorts, o videos MP4 directos. Se reproducirán directamente en el carrusel para el comprador.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isOfferBonusCheckbox"
                checked={isOfferBonus}
                onChange={(e) => setIsOfferBonus(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isOfferBonusCheckbox" className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                Marcar como artículo elegible para regalo (Score ≤ 2 por defecto)
              </label>
            </div>

            <button
              type="submit"
              className={`w-full mt-4 py-3 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                editingProduct 
                  ? 'bg-amber-500 hover:bg-amber-600 border-2 border-black text-black font-black' 
                  : 'bg-indigo-600 hover:bg-indigo-750'
              }`}
              id="submit-product-btn"
            >
              {editingProduct ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Registrar Artículo
                </>
              )}
            </button>
          </form>
        </div>

        {/* List of articles with quick actions (Change Price, Change Status, Delete) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-500" /> Lista de Artículos y Control de Precios
            </h3>
            <input
              type="text"
              placeholder="Buscar artículo..."
              value={apiSearch}
              onChange={(e) => setApiSearch(e.target.value)}
              className="px-3 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-mono uppercase tracking-wider">
                  <th className="py-3 px-2">Artículo</th>
                  <th className="py-3 px-2">Categoría / Est.</th>
                  <th className="py-3 px-2">Precios (USD / UYU)</th>
                  <th className="py-3 px-2">Peticiones</th>
                  <th className="py-3 px-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500 italic">
                      No se encontraron artículos que coincidan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      {/* Name & Thumb */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 max-w-xs">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white block line-clamp-1">
                              {product.name}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                              {Array.from({ length: product.score }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-500 stroke-amber-500" />
                              ))}
                              <span className="ml-1 text-neutral-400 font-mono">({product.score}⭐)</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Status dropdown */}
                      <td className="py-3 px-2">
                        <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-600 dark:text-neutral-400 block w-fit mb-1 max-w-[120px] truncate">
                          {product.category}
                        </span>
                        <select
                          value={product.status}
                          onChange={(e) => {
                            onUpdateProduct({
                              ...product,
                              status: e.target.value as ProductStatus
                            });
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border-0 focus:ring-1 ${
                            product.status === 'disponible' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                              : product.status === 'reservado'
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <option value="disponible">🟢 Disponible</option>
                          <option value="reservado">🟡 Reservado</option>
                          <option value="vendido">🔴 Vendido</option>
                        </select>
                      </td>

                      {/* Prices editor inside grid */}
                      <td className="py-3 px-2">
                        <div className="space-y-1 w-24">
                          <div className="flex items-center gap-0.5">
                            <span className="text-neutral-400 text-[10px]">U$S:</span>
                            <input
                              type="number"
                              value={product.priceUSD}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateProduct({
                                  ...product,
                                  priceUSD: val,
                                  priceUYU: val * 40
                                });
                              }}
                              className="w-16 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm font-mono text-[11px] text-neutral-900 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-0.5 font-mono text-[10px] text-neutral-400">
                            <span>$:</span>
                            <input
                              type="number"
                              value={product.priceUYU}
                              onChange={(e) => {
                                onUpdateProduct({
                                  ...product,
                                  priceUYU: parseFloat(e.target.value) || 0
                                });
                              }}
                              className="w-16 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-[10px] text-neutral-500"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Score rules */}
                      <td className="py-3 px-2">
                        {product.isOfferBonus || product.score <= 2 ? (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-full font-medium">
                            Premio Caja
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400">
                            Fomenta Rotación
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setNewName(product.name);
                            setNewDesc(product.description || '');
                            setNewCategory(product.category);
                            setNewPriceUSD(product.priceUSD.toString());
                            setNewPriceUYU(product.priceUYU.toString());
                            setNewScore(product.score);
                            setImageType('url');
                            setNewImageUrl(product.imageUrl);
                            setUploadedBase64('');
                            setIsOfferBonus(!!product.isOfferBonus);
                            setExtraImagesText(product.images ? product.images.join('\n') : '');
                            setVideoUrlInput(product.videoUrl || '');
                            
                            // Scroll up smoothly to the form
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-800 rounded-lg transition-colors mr-1"
                          title="Editar artículo del garage sale"
                          id={`edit-prod-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`¿Sacar del catálogo '${product.name}'?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                          title="Eliminar artículo del garage sale"
                          id={`delete-prod-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
