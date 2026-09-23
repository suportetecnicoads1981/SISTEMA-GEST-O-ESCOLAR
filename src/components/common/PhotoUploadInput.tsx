import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, User, Sparkles, Check, AlertCircle } from 'lucide-react';
import { notify } from '../../utils/dialogs';

interface PhotoUploadInputProps {
  photoUrl?: string;
  onPhotoChange: (base64OrUrl: string) => void;
  label?: string;
  sublabel?: string;
  shape?: 'circle' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
  allowCamera?: boolean;
}

export const PhotoUploadInput: React.FC<PhotoUploadInputProps> = ({
  photoUrl,
  onPhotoChange,
  label = 'Foto de Perfil / Documento',
  sublabel = 'Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)',
  shape = 'rounded',
  size = 'md',
  allowCamera = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const sizeDimensions = {
    sm: 'h-16 w-16 min-w-16 text-xs',
    md: 'h-24 w-24 min-w-24 text-sm',
    lg: 'h-32 w-32 min-w-32 text-base',
  }[size];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify('O arquivo selecionado é muito grande. Escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onPhotoChange(base64);
        setUploadFeedback('Foto carregada com sucesso!');
        setTimeout(() => setUploadFeedback(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      notify('Não foi possível acessar a câmera do dispositivo. Verifique as permissões de vídeo.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onPhotoChange(dataUrl);
        stopCamera();
        setUploadFeedback('Foto capturada pela câmera com sucesso!');
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-3 bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[11px] text-slate-500">{sublabel}</span>
        </div>
        {uploadFeedback && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Check className="h-3 w-3" />
            {uploadFeedback}
          </span>
        )}
      </div>

      {isCameraActive ? (
        <div className="space-y-3 bg-slate-900 p-4 rounded-2xl text-white">
          <div className="relative aspect-square max-w-[240px] mx-auto rounded-xl overflow-hidden border-2 border-indigo-500 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Camera className="h-4 w-4" />
              <span>Capturar Foto</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Visual Container */}
          <div
            className={`relative flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 bg-white text-slate-400 shadow-2xs group transition-all shrink-0 ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } ${sizeDimensions}`}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                <User className="h-8 w-8 mb-0.5 text-slate-300" />
                <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Sem Foto</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-1 space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Carregar Imagem</span>
              </button>

              {allowCamera && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-600" />
                  <span>Usar Câmera</span>
                </button>
              )}

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Remover foto atual"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>Remover</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {photoUrl
                ? 'Foto vinculada ao cadastro escolar oficial e documentos com foto.'
                : 'Adicione uma foto nítida para carteirinha estudantil, relatórios e controle de acesso.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
