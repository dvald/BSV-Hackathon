import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, QrCode, CheckCircle, Eye, EyeOff, ExternalLink, Wallet, User, ShieldCheck, AlertCircle } from 'lucide-react';

// --- Componentes UI ---

// Botón Principal
interface PrimaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${className}`}
  >
    {children}
  </button>
);

export { PrimaryButton };

// Tarjeta de Credencial (El resultado final)
interface CredentialData {
  name: string;
  id: string;
  expiry: string;
}

interface CredentialCardProps {
  data: CredentialData;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ data }) => (
  <div className="w-full max-w-sm bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl overflow-hidden text-white transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-10">
    <div className="p-6 relative rounded-xl">
      {/* Patrón de fondo decorativo */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider opacity-70">Documento Oficial</span>
          <h2 className="text-xl font-bold">Tarjeta Ciudadana</h2>
        </div>
        <ShieldCheck size={32} className="opacity-90" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden border-2 border-white/30">
            <User size={32} />
          </div>
          <div>
            <p className="text-xs opacity-70">Titular</p>
            <p className="font-semibold text-lg">{data.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs opacity-70">NIF / ID</p>
            <p className="font-mono">{data.id}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Validez</p>
            <p className="font-mono">{data.expiry}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-end">
        <div>
          <p className="text-[10px] opacity-60">DID Emisor</p>
          <p className="text-xs font-mono opacity-80 truncate w-32">did:bsv:1Gov...</p>
        </div>
        <div className="bg-white p-1 rounded">
          <QrCode size={32} className="text-black" />
        </div>
      </div>
    </div>
  </div>
);

// --- Componente de Cámara Real ---
interface CameraScannerProps {
  onClose: () => void;
  onScanMock: (content: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onScanMock }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  // Ref para evitar múltiples detecciones del mismo QR
  const hasScannedRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        // Solicitamos acceso a la cámara (preferiblemente la trasera 'environment')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accediendo a la cámara:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      }
    };

    const scanQRCode = async () => {
      // Si ya escaneamos un QR, no continuar
      if (hasScannedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        if (!context) {
          // Continuar escaneando si no hay contexto
          animationFrameId = requestAnimationFrame(scanQRCode);
          return;
        }

        // Ajustar canvas al tamaño del video
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;

        // Dibujar frame actual del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Obtener datos de imagen del canvas
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Importar jsQR dinámicamente
        const jsQR = (await import('jsqr')).default;

        // Intentar detectar código QR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          console.log("QR detectado:", code.data);
          // Marcar que ya escaneamos para evitar múltiples detecciones
          hasScannedRef.current = true;
          setScanning(false);

          // Cancelar el siguiente frame antes de llamar al callback
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }

          onScanMock(code.data);
          return;
        }
      }

      // Continuar escaneando solo si no hemos escaneado aún
      if (!hasScannedRef.current) {
        animationFrameId = requestAnimationFrame(scanQRCode);
      }
    };

    startCamera();

    // Esperar a que el video esté listo antes de empezar a escanear
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', () => {
        scanQRCode();
      });
    }

    // Cleanup: Detener la cámara al cerrar el componente
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onScanMock]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-sm hover:bg-white/30 z-20"
      >
        <X size={24} />
      </button>

      {/* Título */}
      <div className="absolute top-10 text-white/80 font-medium z-10 bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm">
        {scanning ? "Escanea el código QR" : "¡QR Detectado!"}
      </div>

      {/* Marco del Scanner */}
      <div className="relative w-72 h-72 border-2 border-blue-500 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] z-10">

        {/* Elemento de Video Real */}
        {!error ? (
          <div className="absolute inset-0 w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Canvas oculto para procesamiento de QR */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gray-900 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Animación de escaneo (Overlay) */}
        {scanning && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_linear_infinite] opacity-70"></div>
        )}
      </div>

      <p className="text-white mt-8 text-sm opacity-60 z-10 max-w-xs text-center">
        Apunta la cámara hacia el código QR proporcionado por el Ayuntamiento.
      </p>
    </div>
  );
};

// --- App Principal ---

export default function WebWalletApp() {
  // Estados de la aplicación
  // 'home' | 'camera' | 'success' | 'credential' | 'share_selection' | 'sharing' | 'share_success'
  const [viewState, setViewState] = useState('home');
  const [showKeys, setShowKeys] = useState(false);

  // Array de credenciales (soporta múltiples credenciales)
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  // Índice de la credencial seleccionada para compartir
  const [selectedCredentialIndex, setSelectedCredentialIndex] = useState<number | null>(null);

  // Datos simulados (Mock Data)
  const walletData = {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    privateKey: "KxFc1... (Clave Privada Oculta)",
    balance: "0.042 BSV"
  };

  // Datos que "aparecerán" tras leer el QR
  const credentialData = {
    name: "JUAN PÉREZ",
    id: "12345678Z",
    expiry: "11/2030"
  };

  // Ref para evitar procesamiento múltiple de escaneos
  const isProcessingScan = useRef(false);

  // Función simulada de lectura de QR
  const handleScanMock = React.useCallback((scannedContent: string) => {
    // Si ya estamos procesando un escaneo, ignorar
    if (isProcessingScan.current) return;

    console.log("Escaneado:", scannedContent);

    // LÓGICA HARDCODEADA SOLICITADA
    if (scannedContent === "http://example.com") {
      // Bloquear procesamiento adicional
      isProcessingScan.current = true;

      // Cerrar la cámara INMEDIATAMENTE
      setViewState('success');
      console.log("QR reconocido. Prueba con 'www.example.com'", scannedContent);

      // Esperar 2 segundos mostrando el tick verde antes de mostrar la tarjeta
      setTimeout(() => {
        // Agregar nueva credencial al array
        setCredentials(prev => [...prev, credentialData]);
        setViewState('credential');

        // Liberar el bloqueo
        isProcessingScan.current = false;
      }, 2000);
    } else if (scannedContent === "https://pollito.com") {
      // Bloquear procesamiento adicional
      isProcessingScan.current = true;

      // Ir a la pantalla de selección de credenciales
      setViewState('share_selection');
      console.log("QR de compartir reconocido.", scannedContent);

      // Liberar el bloqueo inmediatamente ya que cambiamos de vista
      isProcessingScan.current = false;
    } else {
      // Si el QR no es válido, cerrar la cámara y mostrar el error
      setViewState('home');
      alert("QR no reconocido. Prueba con 'www.example.com' o 'https://pollito.com'");
    }
  }, [credentialData]);

  const handleShareCredential = () => {
    if (selectedCredentialIndex === null) return;

    setViewState('sharing');

    // Simular proceso de compartir
    setTimeout(() => {
      setViewState('share_success');

      // Volver a la lista de credenciales después del éxito
      setTimeout(() => {
        setViewState('credential');
        setSelectedCredentialIndex(null);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-100">

      {/* Header Simple */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
          <Wallet size={24} />
          <span>BSV Wallet</span>
        </div>
        <div className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded-md">
          Mainnet
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 flex flex-col items-center min-h-[80vh] relative">

        {/* --- VISTA: HOME --- */}
        {viewState === 'home' && (
          <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">

            {/* Balance Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center mt-4">
              <p className="text-gray-500 text-sm mb-1">Balance Total</p>
              <h1 className="text-4xl font-bold text-gray-900">{walletData.balance}</h1>
            </div>

            {/* Acción Principal */}
            <div className="flex justify-center my-4">
              <button
                onClick={() => setViewState('camera')}
                className="relative group"
              >
                <div className="absolute inset-0 bg-blue-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border-4 border-blue-50 group-hover:scale-105 transition-transform cursor-pointer">
                  <Camera size={48} className="text-blue-600" />
                </div>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-500 w-max">
                  Escanear QR
                </span>
              </button>
            </div>

            {/* Sección de Credenciales */}
            {credentials.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No tienes credenciales activas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Tus Credenciales ({credentials.length})</h2>
                  <button
                    onClick={() => setViewState('credential')}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Ver todas →
                  </button>
                </div>

                {/* Mostrar solo la última credencial en home */}
                <CredentialCard data={credentials[credentials.length - 1]} />
              </div>
            )}

          </div>
        )}

        {/* --- VISTA: CÁMARA (REAL) --- */}
        {viewState === 'camera' && (
          <CameraScanner
            onClose={() => setViewState('home')}
            onScanMock={handleScanMock}
          />
        )}

        {/* --- VISTA: SUCCESS (Tick Verde) --- */}
        {viewState === 'success' && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="transform scale-150 text-green-500 mb-6 animate-bounce">
              <CheckCircle size={80} fill="currentColor" className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Éxito!</h2>
            <p className="text-gray-500">Credencial verificable obtenida</p>
          </div>
        )}

        {/* --- VISTA: CREDENCIAL (Resultado Final) --- */}
        {viewState === 'credential' && (
          <div className="w-full flex flex-col gap-6 items-center animate-in slide-in-from-bottom-20 duration-700">
            <div className="w-full flex justify-start">
              <button onClick={() => setViewState('home')} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
                ← Volver
              </button>
            </div>

            <div className="w-full flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Tus Credenciales ({credentials.length})</h2>
              <PrimaryButton onClick={() => setViewState('camera')} className="!py-2 !px-4 text-sm">
                <Camera size={16} />
                Escanear Otra
              </PrimaryButton>
            </div>

            {/* Lista de todas las credenciales */}
            <div className="w-full flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {credentials.map((credential, index) => (
                <div key={index} className="relative">
                  <CredentialCard data={credential} />
                </div>
              ))}
            </div>

            <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm flex gap-2 items-start w-full">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <p>Estas credenciales han sido firmadas criptográficamente por el Gobierno y ancladas en BSV.</p>
            </div>
          </div>
        )}

        {/* --- VISTA: SELECCIÓN PARA COMPARTIR --- */}
        {viewState === 'share_selection' && (
          <div className="w-full flex flex-col gap-6 items-center animate-in slide-in-from-bottom-20 duration-500">
            <div className="w-full flex justify-start">
              <button onClick={() => setViewState('home')} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
                ← Cancelar
              </button>
            </div>

            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Compartir Credencial</h2>
              <p className="text-sm text-gray-500">Selecciona la credencial que deseas compartir</p>
            </div>

            {/* Lista de credenciales seleccionables */}
            <div className="w-full max-h-[50vh] overflow-y-auto pb-20 px-1">
              {credentials.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No tienes credenciales para compartir</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  {credentials.map((credential, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCredentialIndex(index)}
                      className={`relative cursor-pointer transition-all duration-200 transform rounded-xl border-2 max-w-xs w-full ${selectedCredentialIndex === index
                        ? 'scale-105 border-blue-500 shadow-lg ring-2 ring-blue-200 bg-blue-50'
                        : 'border-transparent hover:scale-102 opacity-80 hover:opacity-100 hover:bg-gray-50'
                        }`}
                    >
                      {selectedCredentialIndex === index && (
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 z-20 shadow-lg animate-in zoom-in">
                          <CheckCircle size={24} />
                        </div>
                      )}
                      <div className="transform scale-95 pointer-events-none">
                        <CredentialCard data={credential} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón de compartir fijo abajo */}
            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-20">
              <PrimaryButton
                onClick={handleShareCredential}
                className={`w-full max-w-md shadow-xl ${selectedCredentialIndex === null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Compartir Credencial
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* --- VISTA: COMPARTIENDO (Loading) --- */}
        {viewState === 'sharing' && (
          <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium text-lg">Compartiendo credencial...</p>
          </div>
        )}

        {/* --- VISTA: SHARE SUCCESS --- */}
        {viewState === 'share_success' && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="transform scale-150 text-green-500 mb-6 animate-bounce">
              <CheckCircle size={80} fill="currentColor" className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Compartido!</h2>
            <p className="text-gray-500">Credencial compartida con éxito</p>
          </div>
        )}

      </main>

      {/* --- SECCIÓN: CLAVES Y EXPLORADOR (Siempre visible abajo en Home/Credential) --- */}
      {(viewState === 'home' || viewState === 'credential') && (
        <section className="border-t bg-gray-100 p-6 mt-auto">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center justify-between w-full text-gray-600 text-sm font-medium hover:text-gray-900 mb-4"
            >
              <span>🔐 Datos Técnicos (Wallet Keys)</span>
              {showKeys ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {showKeys && (
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-4 text-xs font-mono break-all animate-in slide-in-from-top-2">
                <div>
                  <p className="text-gray-400 mb-1">Private Key (WIF)</p>
                  <div className="bg-gray-50 p-2 rounded border flex justify-between gap-2">
                    <span>{walletData.privateKey}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">BSV Address</p>
                  <div className="bg-gray-50 p-2 rounded border text-blue-600">
                    {walletData.address}
                  </div>
                </div>

                <a
                  href={`https://whatsonchain.com/address/${walletData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={14} />
                  Ver en Explorador de Bloques
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Estilos para animaciones custom */}
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}