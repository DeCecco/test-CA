import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  DollarSign,
  Star,
  Tag,
  Eye,
  EyeOff,
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
  X,
  Shield,
  ShieldAlert,
  Smartphone,
  Key,
  RefreshCw,
  LogOut,
  Check,
  Settings
} from 'lucide-react';
import { Product, ProductStatus } from '../types';
import { CATEGORIES } from '../data';
import {
  verifyTOTP,
  generateRandomBase32Secret,
  getOTPAuthURL,
  generateBackupCodes
} from '../utils/totp';

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onExportCatalog: () => void;
  onImportCatalog: (imported: Product[]) => void;
  onResetCatalog: () => void;
  whatsappNumber: string;
  setWhatsappNumber: (num: string) => void;
  raffleEnabled: boolean;
  setRaffleEnabled: (enabled: boolean) => void;
}

export default function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onExportCatalog,
  onImportCatalog,
  onResetCatalog,
  whatsappNumber,
  setWhatsappNumber,
  raffleEnabled,
  setRaffleEnabled,
}: AdminPanelProps) {
  // Security States
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // 2FA Login States
  const [loginStep, setLoginStep] = useState<'password' | '2fa' | 'recovery'>('password');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Navigation tabs in panel
  const [activeTab, setActiveTab] = useState<'catalog' | 'security'>('catalog');

  // 2FA Setup state variables
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [tempSecret, setTempSecret] = useState('');
  const [tempCode, setTempCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [createdBackupCodes, setCreatedBackupCodes] = useState<string[]>([]);

  // Password modify states
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

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
  const [raffleWeight, setRaffleWeight] = useState<string>('100');
  const [newIsVisible, setNewIsVisible] = useState(true);
  const [newShowOfferBanner, setNewShowOfferBanner] = useState(false);

  // Search in Admin
  const [apiSearch, setApiSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (loginStep === 'password') {
      const storedPwd = localStorage.getItem('admin_pwd') || 'canada2026';
      if (password === storedPwd) {
        const is2fa = localStorage.getItem('admin_2fa_enabled') === 'true';
        if (is2fa) {
          setLoginStep('2fa');
        } else {
          setIsAuthenticated(true);
        }
      } else {
        const hasCustomPwd = !!localStorage.getItem('admin_pwd');
        setAuthError(
          hasCustomPwd
            ? 'Contraseña incorrecta. Utiliza la clave personalizada que guardaste.'
            : 'Contraseña incorrecta. Pista: canada2026'
        );
      }
    } else {
      // 2FA validation step
      const code = totpCode.trim();
      if (!code) {
        setAuthError('Por favor ingresa el código.');
        return;
      }

      // Check if it's an emergency backup code
      const storedCodesStr = localStorage.getItem('admin_backup_codes');
      const backupCodesList: string[] = storedCodesStr ? JSON.parse(storedCodesStr) : [];
      if (backupCodesList.includes(code)) {
        const remaining = backupCodesList.filter((c) => c !== code);
        localStorage.setItem('admin_backup_codes', JSON.stringify(remaining));
        setIsAuthenticated(true);
        setAuthError('');
        alert(`¡Código de emergencia válido! Se ha eliminado de la lista. Te quedan ${remaining.length} códigos de recuperación.`);
        return;
      }

      // Check standard Authenticator time-based token
      const secret = localStorage.getItem('admin_2fa_secret') || '';
      const isValid = await verifyTOTP(code, secret);
      if (isValid) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError('Código inválido o ya expiró. Asegúrate de verificar la hora en tu dispositivo móvil.');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setTotpCode('');
    setLoginStep('password');
    setActiveTab('catalog');
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
    setNewIsVisible(true);
    setNewShowOfferBanner(false);
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
        isOfferBonus: isOfferBonus || newScore <= 2,
        raffleWeight: parseInt(raffleWeight, 10) || 100,
        isVisible: newIsVisible,
        showOfferBanner: newShowOfferBanner
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
        isOfferBonus: isOfferBonus || newScore <= 2,
        raffleWeight: parseInt(raffleWeight, 10) || 100,
        isVisible: newIsVisible,
        showOfferBanner: newShowOfferBanner
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
    setRaffleWeight('100');
    setNewIsVisible(true);
    setNewShowOfferBanner(false);
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
      <div id="admin-auth-panel" className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-neutral-900 rounded-3xl border-2 border-black dark:border-neutral-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex flex-col items-center text-center">
          {loginStep === 'password' ? (
            <>
              <div className="p-3 bg-indigo-150 dark:bg-indigo-950/40 border border-black rounded-full text-indigo-600 dark:text-indigo-400 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black font-sans tracking-tight text-neutral-900 dark:text-white mb-2 uppercase">
                Panel de Gestión
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 font-bold">
                Ingresá la contraseña de administración para actualizar precios, marcar ventas y agregar productos al catálogo.
              </p>

              {localStorage.getItem('admin_2fa_enabled') === 'true' && (
                <div className="mb-4 w-full p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900/30 rounded-xl text-indigo-700 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500 fill-indigo-200/50 animate-pulse" /> Autenticación de Doble Factor (2FA) Habilitada
                </div>
              )}

              <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Contraseña Administrativa
                  </label>
                  <input
                    type="password"
                    placeholder={localStorage.getItem('admin_pwd') ? "Tu clave personalizada" : "Escribe la clave (pista: canada2026)"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    id="admin-pass-input"
                  />
                  <div className="text-right mt-2 mr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('recovery');
                        setAuthError('');
                        setRecoveryPhone('');
                        setRecoveryError('');
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
                    >
                      ¿Problemas para ingresar o clave olvidada?
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-xs font-bold text-rose-500">{authError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white border-2 border-black rounded-xl font-bold transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                  id="admin-auth-submit-btn"
                >
                  <Unlock className="h-4 w-4 stroke-[2.5px]" /> {localStorage.getItem('admin_2fa_enabled') === 'true' ? 'Siguiente Paso' : 'Entrar al Panel'}
                </button>
              </form>
            </>
          ) : loginStep === '2fa' ? (
            <>
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 border border-black rounded-full text-amber-600 dark:text-amber-400 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <Smartphone className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black font-sans tracking-tight text-neutral-900 dark:text-white mb-2 uppercase">
                Verificación de 2 Factores
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 font-bold leading-relaxed">
                Ingresá el código de 6 dígitos de tu aplicación **Google Authenticator** o Microsoft Authenticator, o un **código de emergencia**.
              </p>

              <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>Código de Seguridad (TOTP)</span>
                    <span className="text-[10px] text-amber-500 font-mono">6 dígitos o Código de Emergencia</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="Ej. 123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full px-4 py-3 text-center bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-lg font-mono font-black tracking-widest"
                    id="admin-totp-input"
                    autoFocus
                  />
                  <div className="text-right mt-2 mr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('recovery');
                        setAuthError('');
                        setRecoveryPhone('');
                        setRecoveryError('');
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold hover:underline"
                    >
                      ¿Perdiste acceso al dispositivo 2FA?
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-xs font-bold text-rose-500">{authError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('password');
                      setTotpCode('');
                      setAuthError('');
                    }}
                    className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border-2 border-black rounded-xl font-bold transition-all text-xs text-neutral-700 dark:text-neutral-300 uppercase"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-black border-2 border-black rounded-xl font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs"
                    id="admin-auth-2fa-submit-btn"
                  >
                    <Shield className="h-4 w-4 text-black fill-black/20" /> Verificar Código
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="p-3 bg-rose-100 dark:bg-rose-950/40 border border-black rounded-full text-rose-600 dark:text-rose-400 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black font-sans tracking-tight text-neutral-900 dark:text-white mb-2 uppercase">
                Restablecer Acceso
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 font-bold leading-relaxed">
                Si olvidaste tu clave o perdiste el acceso al sistema 2FA, podés restablecer la contraseña a la original ingresando el número de WhatsApp configurado actualmente.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setRecoveryError('');

                  const entered = recoveryPhone.replace(/[^0-9]/g, '');
                  const savedUnformatted = localStorage.getItem('garage_sale_wa_num') || '59899123456';
                  const savedWa = savedUnformatted.replace(/[^0-9]/g, '');

                  if (!entered) {
                    setRecoveryError('Ingresá un número de WhatsApp de contacto válido.');
                    return;
                  }

                  if (entered === savedWa) {
                    localStorage.removeItem('admin_pwd');
                    localStorage.removeItem('admin_2fa_enabled');
                    localStorage.removeItem('admin_2fa_secret');
                    localStorage.removeItem('admin_backup_codes');
                    alert('¡Acceso Restablecido con Éxito!\n\nLa contraseña volvió a ser "canada2026" y el Doble Factor (2FA) ha sido desactivado.');
                    
                    setPassword('');
                    setLoginStep('password');
                    setRecoveryPhone('');
                    setRecoveryError('');
                  } else {
                    setRecoveryError('El número ingresado no coincide con el WhatsApp configurado en tu tienda.');
                  }
                }}
                className="w-full space-y-4 text-left"
              >
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Número de WhatsApp de la Tienda
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 59899123456"
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold"
                    id="admin-recovery-phone-input"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 font-bold leading-relaxed">
                    Pista: Es el número celular donde recibís las compras. Por defecto es 59899123456.
                  </p>
                </div>

                {recoveryError && (
                  <p className="text-xs font-bold text-rose-500">{recoveryError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('password');
                      setRecoveryPhone('');
                      setRecoveryError('');
                    }}
                    className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border-2 border-black rounded-xl font-bold transition-all text-xs text-neutral-700 dark:text-neutral-300 uppercase"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white border-2 border-black rounded-xl font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Validar y Restablecer
                  </button>
                </div>
              </form>

              {/* Developer Bypass Console tool */}
              <div className="mt-6 pt-5 border-t border-dashed border-neutral-350 dark:border-neutral-800 w-full text-left">
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-450 uppercase tracking-widest block mb-1">💻 Bypass Físico de Consola (100% Infalible)</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3 font-medium">
                  Al tratarse de una base segura local, podés restablecer todo directamente en tu navegador actual abriendo la Consola de Desarrolladores y pegando lo siguiente:
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-2.5 rounded-xl font-mono text-[10px] text-neutral-800 dark:text-neutral-300 select-all font-bold">
                  localStorage.removeItem('admin_pwd'); localStorage.removeItem('admin_2fa_enabled'); location.reload();
                </div>
                <div className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed">
                  Pistas: Clic derecho {"->"} <span className="font-bold">Inspeccionar</span> {"->"} pestaña <span className="font-bold">Consola</span> {"->"} pegar código {"->"} presionar <span className="font-bold">Enter</span>.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-panel" className="space-y-8">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black dark:border-neutral-800 pb-4">
        <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 border-2 border-black dark:border-neutral-700">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 font-bold text-xs uppercase flex items-center gap-1.5 transition-all ${
              activeTab === 'catalog'
                ? 'bg-black text-white dark:bg-white dark:text-black border-2 border-black'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Gestión de Catálogo
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              Sorteo de Caja Regalo:
            </span>
            <button
              onClick={() => setRaffleEnabled(!raffleEnabled)}
              type="button"
              className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all border cursor-pointer ${
                raffleEnabled
                  ? 'bg-amber-500 text-black border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {raffleEnabled ? 'HABILITADO 🎁' : 'DESHABILITADO 🚫'}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/25 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
              WhatsApp Recibe Ventas:
            </span>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-32 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-neutral-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
              placeholder="Ej. 59899123456"
              title="Ingresa tu celular sin símbolos ni espacios. Ej: 59899123456"
              id="admin-secure-wa-input"
            />
          </div>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
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

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="newIsVisibleCheckbox"
                checked={newIsVisible}
                onChange={(e) => setNewIsVisible(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="newIsVisibleCheckbox" className="text-xs text-neutral-600 dark:text-neutral-400 font-bold flex items-center gap-1.5 cursor-pointer">
                👁️ Visible en el Catálogo (Público)
              </label>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="newShowOfferBannerCheckbox"
                checked={newShowOfferBanner}
                onChange={(e) => setNewShowOfferBanner(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="newShowOfferBannerCheckbox" className="text-xs text-neutral-600 dark:text-neutral-400 font-bold flex items-center gap-1.5 cursor-pointer">
                🏷️ Mostrar cinta roja de "OFERTA / OFFER" sobre el artículo
              </label>
            </div>

            {/* Raffle Weight Input */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-250 dark:border-neutral-800 rounded-xl space-y-3">
              <div>
                <label className="block text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-1.5">
                  Peso de Sorteo (Raffle Weight)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Ej. 100"
                    value={raffleWeight}
                    onChange={(e) => setRaffleWeight(e.target.value)}
                    className="w-24 px-3 py-2 bg-white dark:bg-neutral-850 border-2 border-black rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-black"
                  />
                  <div className="flex flex-wrap gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => setRaffleWeight('100')}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border-2 transition-all cursor-pointer ${
                        raffleWeight === '100'
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                      }`}
                      title="Muy común, fácil de ganar"
                    >
                      Común (100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRaffleWeight('50')}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border-2 transition-all cursor-pointer ${
                        raffleWeight === '50'
                          ? 'bg-amber-500 text-black border-black'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                      }`}
                      title="Dificultad media"
                    >
                      Medio (50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRaffleWeight('10')}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border-2 transition-all cursor-pointer ${
                        raffleWeight === '10'
                          ? 'bg-indigo-600 text-white border-black'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                      }`}
                      title="Difícil de ganar"
                    >
                      Raro (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRaffleWeight('1')}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border-2 transition-all cursor-pointer ${
                        raffleWeight === '1'
                          ? 'bg-rose-500 text-white border-black animate-pulse'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                      }`}
                      title="Extremadamente raro (Ej. Bicicletas)"
                    >
                      Ultra Raro (1)
                    </button>
                  </div>
                </div>
              </div>

              {(isOfferBonus || newScore <= 2) ? (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-850/40 rounded-lg flex items-center justify-between">
                  <span>🎯 Probabilidad Estimada en Sorteo:</span>
                  <span className="font-mono text-xs font-black bg-white dark:bg-neutral-800 px-1.5 py-0.5 border border-black rounded">
                    {(() => {
                      const otherGiftsSum = products
                        .filter(p => p.status === 'disponible' && p.id !== editingProduct?.id && (p.isOfferBonus || p.score <= 2))
                        .reduce((sum, p) => sum + (p.raffleWeight ?? 100), 0);
                      const currentFormWeight = parseInt(raffleWeight, 10) || 100;
                      const totalEstimated = otherGiftsSum + currentFormWeight;
                      return totalEstimated > 0 ? ((currentFormWeight / totalEstimated) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-800/50 p-2 border border-dashed rounded-lg">
                  ⚠️ Este artículo no participará en el sorteo de la Caja de Regalos (con puntuación {newScore}⭐ y sin check de regalo). Su peso no influye.
                </div>
              )}
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
                  <th className="py-3 px-2">Cinta Oferta</th>
                  <th className="py-3 px-2">Visibilidad</th>
                  <th className="py-3 px-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 italic">
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
                          <div className="space-y-1">
                            <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-full font-extrabold inline-block">
                              🎁 Premio Caja
                            </span>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                              <div>Peso: <span className="font-bold text-neutral-800 dark:text-neutral-250">{product.raffleWeight ?? 100}</span></div>
                              {product.status === 'disponible' && (
                                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Prob: {(() => {
                                    const activeGifts = products.filter(p => p.status === 'disponible' && (p.isOfferBonus || p.score <= 2));
                                    const totalGiftsWeight = activeGifts.reduce((sum, p) => sum + (p.raffleWeight ?? 100), 0);
                                    return totalGiftsWeight > 0 
                                      ? (((product.raffleWeight ?? 100) / totalGiftsWeight) * 100).toFixed(1) + '%' 
                                      : '0%';
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 block font-medium">
                            Fomenta Rotación
                          </span>
                        )}
                      </td>

                      {/* Ribbon Banner Offer Toggle */}
                      <td className="py-3 px-2">
                        <button
                          onClick={() => {
                            onUpdateProduct({
                              ...product,
                              showOfferBanner: !product.showOfferBanner
                            });
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all border cursor-pointer ${
                            product.showOfferBanner
                              ? 'bg-rose-500 text-white border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                          }`}
                          title={product.showOfferBanner ? "Hacer normal (quitar cinta de oferta)" : "Hacer oferta (mostrar cinta de oferta)"}
                        >
                          {product.showOfferBanner ? 'Sí (OFERTA) 🏷️' : 'No'}
                        </button>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3 px-2">
                        <button
                          onClick={() => {
                            onUpdateProduct({
                              ...product,
                              isVisible: product.isVisible === false ? true : false
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all border cursor-pointer ${
                            product.isVisible !== false
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:border-black'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-black'
                          }`}
                          title={product.isVisible !== false ? "Hacer oculto (no visible para los compradores)" : "Hacer visible (visible para los compradores)"}
                        >
                          {product.isVisible !== false ? (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-neutral-450" /> Oculto
                            </>
                          )}
                        </button>
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
                            setRaffleWeight(product.raffleWeight !== undefined ? product.raffleWeight.toString() : '100');
                            setNewIsVisible(product.isVisible !== false);
                            setNewShowOfferBanner(!!product.showOfferBanner);
                            
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
        </>
      ) : (
        <div id="admin-security-settings" className="space-y-8 animate-fadeIn">
          {/* Header Security State Banner */}
          <div className="p-6 bg-neutral-900 border-2 border-black rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-neutral-800 text-[#FFE600] rounded-2xl border border-neutral-700">
                <Shield className="h-7 w-7 fill-[#FFE600]/10" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-base uppercase tracking-tight">Estado de la Seguridad Administrativa</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Protegé tu panel e impedí cambios no autorizados en los precios de mudanza o el stock de productos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {localStorage.getItem('admin_2fa_enabled') === 'true' ? (
                <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500 font-extrabold text-xs rounded-full uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Máxima Seguridad (Password + 2FA Activo)
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500 font-extrabold text-xs rounded-full uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Seguridad Básica (Sólo Contraseña)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Password section */}
            <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-800 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-black rounded-lg">
                  <Key className="h-4 w-4" />
                </span>
                <h4 className="font-black text-sm uppercase tracking-tight text-neutral-900 dark:text-white">
                  Cambiar Contraseña de Acceso
                </h4>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                Por defecto, la contraseña de tu panel es <span className="font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 border text-neutral-800 dark:text-neutral-200">canada2026</span>. Te recomendamos cambiarla por una personalizada para evitar accesos indebidos.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPwdError('');
                  setPwdSuccess('');

                  const currentSaved = localStorage.getItem('admin_pwd') || 'canada2026';
                  if (pwdCurrent !== currentSaved) {
                    setPwdError('La contraseña actual es incorrecta.');
                    return;
                  }

                  if (pwdNew.trim().length < 4) {
                    setPwdError('La nueva contraseña debe tener al menos 4 caracteres.');
                    return;
                  }

                  if (pwdNew !== pwdConfirm) {
                    setPwdError('Las contraseñas nuevas no coinciden.');
                    return;
                  }

                  localStorage.setItem('admin_pwd', pwdNew.trim());
                  setPwdSuccess('¡Contraseña actualizada con éxito!');
                  setPwdCurrent('');
                  setPwdNew('');
                  setPwdConfirm('');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdCurrent}
                    onChange={(e) => setPwdCurrent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-xs font-mono text-neutral-900 dark:text-white"
                    placeholder="Escribe la clave actual"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-xs font-mono text-neutral-900 dark:text-white"
                    placeholder="Elige una clave fuerte"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdConfirm}
                    onChange={(e) => setPwdConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-black rounded-xl text-xs font-mono text-neutral-900 dark:text-white"
                    placeholder="Repite tu nueva clave"
                  />
                </div>

                {pwdError && <p className="text-xs font-bold text-rose-500">{pwdError}</p>}
                {pwdSuccess && <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="h-4 w-4" /> {pwdSuccess}</p>}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 min-w-[150px] py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold border-2 border-black rounded-xl text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    Guardar nueva contraseña
                  </button>
                  {localStorage.getItem('admin_pwd') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Restablecer el acceso al password por defecto (canada2026)?')) {
                          localStorage.removeItem('admin_pwd');
                          setPwdSuccess('¡Contraseña restablecida a "canada2026" con éxito!');
                        }
                      }}
                      className="px-3.5 py-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-black rounded-xl text-xs font-bold hover:bg-neutral-200 text-neutral-800 dark:text-white"
                    >
                      Restablecer clave inicial
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Google Authenticator Double Factor Section */}
            <div className="bg-white dark:bg-neutral-900 p-6 border-2 border-black dark:border-neutral-800 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-black rounded-lg">
                  <Smartphone className="h-4 w-4" />
                </span>
                <h4 className="font-black text-sm uppercase tracking-tight text-neutral-900 dark:text-white">
                  Doble Factor (2FA - Google Authenticator / Authy)
                </h4>
              </div>

              {localStorage.getItem('admin_2fa_enabled') !== 'true' ? (
                /* Config flow wizard */
                setupStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      La validación de dos factores (2FA) vincula el acceso de este panel administrativo a una aplicación de seguridad móvil en tu teléfono inteligente (como **Google Authenticator**, **Microsoft Authenticator** o **Authy**).
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-bold">
                      Beneficio: Aunque un tercero consiga o adivine tu contraseña escrita, le será imposible acceder ya que obligatoriamente se requiere ingresar el código dinámico de 6 dígitos que genera tu teléfono cada 30 segundos.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const sec = generateRandomBase32Secret(16);
                        setTempSecret(sec);
                        setSetupStep(2);
                        setTempCode('');
                        setSetupError('');
                      }}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black border-2 border-black rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Shield className="h-4 w-4 text-black fill-black/20" /> Activar Doble Factor de Google
                    </button>
                  </div>
                ) : setupStep === 2 ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/30 rounded-xl text-neutral-800 dark:text-neutral-300 text-xs leading-relaxed space-y-1">
                      <p className="font-bold">📱 Sigue estos pasos para configurarlo:</p>
                      <ol className="list-decimal pl-4 space-y-1 mt-1 font-medium text-[11px]">
                        <li>Descargá **Google Authenticator** en tu celular desde el App Store o Play Store.</li>
                        <li>Escaneá el código QR que se muestra abajo usando la opción "Escanear un código QR".</li>
                        <li>Automáticamente se creará la cuenta "Mudanza Pablo" que genera códigos de 6 dígitos.</li>
                      </ol>
                    </div>

                    <div className="flex flex-col items-center justify-center py-4 bg-neutral-100 dark:bg-neutral-950 rounded-2xl border-2 border-black w-full">
                      {/* Generar QR URL */}
                      <img
                        src={`https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${encodeURIComponent(
                          getOTPAuthURL('pablomdececcoriosuy@gmail.com', 'Mudanza Uruguay-Canada', tempSecret)
                        )}&choe=UTF-8`}
                        alt="2FA QR Code"
                        className="border-4 border-black bg-white inline-block shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="mt-4 text-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Clave manual si el QR no escanea:</span>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-xs font-black bg-white dark:bg-neutral-800 px-2.5 py-1 border border-black rounded-md text-neutral-900 dark:text-white select-all">
                            {tempSecret}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(tempSecret);
                              alert('¡Clave manual copiada al portapapeles!');
                            }}
                            className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-white text-[10px] uppercase font-bold px-2 py-1 border border-black rounded-md transition-all active:scale-95"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black/15 dark:border-white/10 pt-4">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white mb-2 uppercase">Comprobemos el funcionamiento:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Ej. 123456"
                          value={tempCode}
                          onChange={(e) => setTempCode(e.target.value)}
                          className="flex-1 w-28 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-2 border-black rounded-xl text-center font-mono font-black text-base tracking-widest text-neutral-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            setSetupError('');
                            const success = await verifyTOTP(tempCode, tempSecret);
                            if (success) {
                              const bCodes = generateBackupCodes(5);
                              localStorage.setItem('admin_2fa_enabled', 'true');
                              localStorage.setItem('admin_2fa_secret', tempSecret);
                              localStorage.setItem('admin_backup_codes', JSON.stringify(bCodes));
                              setCreatedBackupCodes(bCodes);
                              setSetupStep(3);
                            } else {
                              setSetupError('El código es incorrecto o ya expiró. Asegúrate que tenga 6 dígitos y que tu celular tenga la hora en sincronía automática.');
                            }
                          }}
                          className="px-4 py-2 bg-[#FFE600] text-black font-extrabold text-xs uppercase border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Verificar y Guardar
                        </button>
                      </div>
                      {setupError && (
                        <p className="text-xs font-bold text-rose-500 mt-2">{setupError}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep(1);
                        setTempSecret('');
                        setTempCode('');
                        setSetupError('');
                      }}
                      className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 border-2 border-black hover:bg-neutral-200 text-neutral-800 dark:text-white font-extrabold text-xs uppercase rounded-xl mt-2"
                    >
                      Cancelar configuración
                    </button>
                  </div>
                ) : (
                  /* Step 3: Success and Backup codes display */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5">
                      <CheckCircle className="h-6 w-6 stroke-[3px]" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm uppercase">¡Doble factor 2FA Activado!</p>
                        <p className="text-xs font-medium">A partir de ahora, cada vez que inicies sesión se te solicitará la confirmación en tu app móvil.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500 rounded-2xl space-y-2 text-left">
                      <p className="font-bold text-xs uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4 text-amber-600 fill-amber-100" /> Códigos de Emergencia Únicos
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Si pierdes acceso a tu celular, no podrás generar el código TOTP y quedarías fuera de tu panel. **Guarda estos códigos de recuperación ahora mismo** en un block de notas seguro. Cada código sirve una sola vez para saltear el paso de 2FA.
                      </p>
                      <div className="bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-900/30 p-3 rounded-lg flex flex-col items-center">
                        <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-center">
                          {createdBackupCodes.map((code, idx) => (
                            <div key={idx} className="font-mono font-black text-neutral-850 dark:text-neutral-200 text-xs py-1 border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50 dark:bg-neutral-950">
                              {code}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdBackupCodes.join('\n'));
                            alert('¡Códigos de recuperación copiados!');
                          }}
                          className="mt-3 px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-[10px] font-extrabold uppercase border border-black rounded-md tracking-wider transition-all"
                        >
                          Copiar todos los códigos
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep(1);
                        setTempSecret('');
                        setTempCode('');
                        setSetupError('');
                      }}
                      className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase border-2 border-black rounded-xl"
                    >
                      Volver a Configuración de Seguridad
                    </button>
                  </div>
                )
              ) : (
                /* Already enabled block */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-center gap-3 text-left">
                    <Shield className="h-6 w-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-900" />
                    <div>
                      <h5 className="font-extrabold text-xs uppercase">Verificación de 2 factores Activa</h5>
                      <p className="text-[10px] text-neutral-500 dark:text-emerald-400 mt-0.5">Dispositivo móvil sincronizado correctamente.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-black/10 dark:border-white/10">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-extrabold">Códigos de Emergencia restantes:</span>
                      <span className="text-xs font-black font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 border rounded-lg">
                        {localStorage.getItem('admin_backup_codes') ? JSON.parse(localStorage.getItem('admin_backup_codes')!).length : 0} activos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-center max-w-xs mx-auto">
                      {(localStorage.getItem('admin_backup_codes') ? JSON.parse(localStorage.getItem('admin_backup_codes')!) : []).map((code: string, idx: number) => (
                        <div key={idx} className="font-mono font-black text-xs text-neutral-700 dark:text-neutral-400 py-1 border dark:border-neutral-850 rounded bg-white dark:bg-neutral-900 inline-block">
                          {code}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Generar un nuevo lote de 5 códigos de emergencia? Los anteriores dejarán de funcionar.')) {
                          const newCodes = generateBackupCodes(5);
                          localStorage.setItem('admin_backup_codes', JSON.stringify(newCodes));
                          alert('¡Se han generado y guardado 5 códigos de emergencia nuevos! Asegúrate de guardarlos.');
                          window.location.reload();
                        }
                      }}
                      className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border-2 border-black rounded-lg text-[10px] text-neutral-700 dark:text-white font-bold uppercase mt-4 transition-all"
                    >
                      Renovar Códigos de Emergencia
                    </button>
                  </div>

                  <div className="pt-4 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const passConfirm = prompt('Ingresa tu contraseña actual para confirmar la desactivación del Doble Factor (2FA):');
                        if (passConfirm === null) return;
                        const savedPass = localStorage.getItem('admin_pwd') || 'canada2026';
                        if (passConfirm === savedPass) {
                          localStorage.removeItem('admin_2fa_enabled');
                          localStorage.removeItem('admin_2fa_secret');
                          localStorage.removeItem('admin_backup_codes');
                          alert('La protección de Doble Factor (2FA) se ha desactivado con éxito.');
                          window.location.reload();
                        } else {
                          alert('Contraseña incorrecta. No se pudo desactivar el Doble Factor.');
                        }
                      }}
                      className="w-full py-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-500 hover:bg-rose-100 hover:text-rose-700 font-bold text-xs uppercase rounded-xl transition-all"
                    >
                      Desactivar Doble Factor (MFA)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
