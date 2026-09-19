import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsService, RanchConfig, DEFAULT_CONFIG } from '../services/settingsService';
import { subscribeToFirestoreStatus, FirestoreConnectionStatus } from '../services/firestoreHelper';
import {
  Settings,
  Building2,
  Coins,
  Scale,
  Database,
  Save,
  CheckCircle2,
  ShieldAlert,
  Server,
  Code,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [config, setConfig] = useState<RanchConfig>(DEFAULT_CONFIG);
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreConnectionStatus>('connected');
  const [copiedRules, setCopiedRules] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const loaded = await settingsService.getConfig();
        setConfig(loaded);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    const unsubscribe = subscribeToFirestoreStatus((status) => {
      setFirestoreStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    try {
      const result = await settingsService.saveConfig(
        config,
        user?.fullName || 'Rodrigo Caballero'
      );

      if (result.fromFirestore) {
        setSaveStatus({
          type: 'success',
          message:
            '¡Configuración guardada y sincronizada correctamente en la web y en Firebase Firestore!',
        });
      } else {
        setSaveStatus({
          type: 'warning',
          message:
            'Configuración guardada en la web local. Para sincronizar también en la nube Firestore, actualice las reglas de seguridad en su consola Firebase (ver guía abajo).',
        });
      }
    } catch {
      setSaveStatus({
        type: 'error',
        message: 'Ocurrió un error al guardar la configuración.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaveStatus(null);
      }, 7000);
    }
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D0D] border border-[#222222] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
              Configuración Operacional del Rancho
            </h2>
          </div>
          <p className="text-xs text-[#8E8E8E] mt-1">
            Parámetros de la hacienda, datos del propietario, moneda y persistencia en la nube
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#A0A0A0]">Estado Firestore:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono ${
              firestoreStatus === 'connected'
                ? 'bg-[#122316] text-[#81C784] border border-[#25462A]'
                : firestoreStatus === 'rules-blocked'
                ? 'bg-[#2A1212] text-[#E57373] border border-[#522222]'
                : 'bg-[#261E0A] text-[#FFB74D] border border-[#4E3D15]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                firestoreStatus === 'connected'
                  ? 'bg-[#81C784]'
                  : firestoreStatus === 'rules-blocked'
                  ? 'bg-[#E57373]'
                  : 'bg-[#FFB74D]'
              }`}
            />
            {firestoreStatus === 'connected'
              ? 'Conectado / Permisos OK'
              : firestoreStatus === 'rules-blocked'
              ? 'Reglas bloquean escritura'
              : 'Sincronizando'}
          </span>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            saveStatus.type === 'success'
              ? 'bg-[#121E14] border-[#25462A] text-[#81C784]'
              : saveStatus.type === 'warning'
              ? 'bg-[#261E0A] border-[#5E4A19] text-[#FFD54F]'
              : 'bg-[#201111] border-[#441818] text-[#FF9999]'
          }`}
        >
          {saveStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#81C784]" />}
          {saveStatus.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#FFD54F]" />}
          {saveStatus.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[#FF9999]" />}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-[#888888]">
          <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Cargando parámetros de configuración...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Ranch Information Section */}
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E1E1E]">
              <Building2 className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Identidad de la Operación Ganadera
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Nombre del Rancho / Hacienda *
                </label>
                <input
                  type="text"
                  value={config.ranchName}
                  onChange={(e) => setConfig({ ...config, ranchName: e.target.value })}
                  required
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Nombre del Propietario / Administrador *
                </label>
                <input
                  type="text"
                  value={config.ownerName}
                  onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                  required
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Identificación Tributaria / RIF / NIT
                </label>
                <input
                  type="text"
                  value={config.taxId}
                  onChange={(e) => setConfig({ ...config, taxId: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Extensión Territorial (Hectáreas)
                </label>
                <input
                  type="number"
                  value={config.totalHectares}
                  onChange={(e) => setConfig({ ...config, totalHectares: Number(e.target.value) })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Ubicación Geográfica y Sector
                </label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Correo Electrónico de Notificaciones
                </label>
                <input
                  type="email"
                  value={config.notificationEmail}
                  onChange={(e) => setConfig({ ...config, notificationEmail: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Currency & Units Section */}
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E1E1E]">
              <Coins className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Moneda y Estándares de Medición
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Moneda de Transacción
                </label>
                <select
                  value={config.currencySymbol}
                  onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                >
                  <option value="USD ($)">Dólares Americanos (USD $)</option>
                  <option value="EUR (€)">Euros (EUR €)</option>
                  <option value="COP ($)">Pesos Colombianos (COP $)</option>
                  <option value="MXN ($)">Pesos Mexicanos (MXN $)</option>
                  <option value="VES (Bs)">Bolívares (VES Bs)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Unidad de Masa / Peso
                </label>
                <select
                  value={config.weightUnit}
                  onChange={(e) => setConfig({ ...config, weightUnit: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                >
                  <option value="Kilogramos (kg)">Kilogramos (kg)</option>
                  <option value="Libras (lb)">Libras (lb)</option>
                  <option value="Arrobas (@)">Arrobas (@)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A0A0A0] uppercase mb-1">
                  Unidad de Volumen Líquido
                </label>
                <select
                  value={config.volumeUnit}
                  onChange={(e) => setConfig({ ...config, volumeUnit: e.target.value })}
                  className="w-full py-2 px-3 bg-[#141414] border border-[#282828] focus:border-[#C9A227] rounded-lg text-xs text-[#FFFFFF] outline-none"
                >
                  <option value="Litros (L)">Litros (L)</option>
                  <option value="Galones (gal)">Galones (gal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {user?.role === 'ADMINISTRADOR' && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#E0C15A] text-[#0A0A0A] font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md shadow-[#C9A227]/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                    <span>GUARDANDO CAMBIOS...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración en la Web</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* REGLAS DE SEGURIDAD FIRESTORE (INSTRUCCIONES DIRECTAS) */}
      <div className="bg-[#0A0A0A] border border-[#C9A227]/40 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#C9A227]" />
            <h3 className="text-xs font-bold text-[#E0C15A] uppercase tracking-wider">
              ¿Tienes que cambiar las reglas de Firestore? (Guía Paso a Paso)
            </h3>
          </div>
          <button
            type="button"
            onClick={copyRulesToClipboard}
            className="px-3 py-1.5 rounded bg-[#1C170A] hover:bg-[#2A230F] border border-[#443818] text-[#E0C15A] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {copiedRules ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#81C784]" />
                <span className="text-[#81C784]">¡Reglas Copiadas!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código de Reglas</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#A0A0A0] leading-relaxed">
          <p>
            <strong>Sí, para que los datos se guarden en la nube en Firebase Firestore</strong> y no solo en la memoria local de tu navegador, necesitas permitir la lectura y escritura en la consola de Firebase.
          </p>

          <div className="p-3 bg-[#141414] border border-[#252525] rounded-lg space-y-1.5">
            <p className="text-[#FFFFFF] font-semibold">Pasos para actualizar las reglas en tu consola de Firebase:</p>
            <ol className="list-decimal list-inside space-y-1 text-[#CCCCCC] pl-1">
              <li>Ingresa a tu proyecto en <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-[#C9A227] underline">console.firebase.google.com</a></li>
              <li>En el menú lateral izquierdo ve a <strong>Compilación &gt; Firestore Database</strong>.</li>
              <li>Haz clic en la pestaña superior que dice <strong>Reglas (Rules)</strong>.</li>
              <li>Reemplaza el texto por las siguientes reglas y haz clic en el botón azul <strong>Publicar (Publish)</strong>:</li>
            </ol>
          </div>

          <pre className="p-4 bg-[#050505] border border-[#2A2A2A] rounded-lg font-mono text-[12px] text-[#E0C15A] overflow-x-auto">
{firestoreRulesCode}
          </pre>

          <p className="text-[11px] text-[#777777]">
            💡 <em>Nota: La aplicación guarda todo inmediatamente en el almacenamiento local del navegador (localStorage), por lo que tus cambios nunca se borran al recargar. Cuando publiques las reglas en Firebase, la luz de estado se pondrá en verde y todo se sincronizará automáticamente con la nube.</em>
          </p>
        </div>
      </div>
    </div>
  );
};
