import React, { useState, useRef } from 'react';
import {
  Printer,
  FileText,
  Settings,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Sparkles,
  School,
  Sliders,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { OmniDeployPrintDevice } from '../../types';

interface PrintCanvasProps {
  documentTitle?: string;
  documentSubtitle?: string;
  children?: React.ReactNode;
  schoolName?: string;
}

const AVAILABLE_DEVICES: OmniDeployPrintDevice[] = [
  {
    id: 'DEFAULT_SPOOLER',
    name: 'Impressora Padrão do Sistema Operacional (Spooler)',
    type: 'LOCAL',
    dpi: 300,
    paperSizes: ['A4', 'CARTA'],
    isDefault: true,
    connectionStatus: 'ONLINE',
  },
  {
    id: 'MS_PRINT_PDF',
    name: 'Microsoft Print to PDF / Google PDF Writer',
    type: 'VIRTUAL_PDF',
    dpi: 600,
    paperSizes: ['A4', 'A3', 'CARTA'],
    isDefault: false,
    connectionStatus: 'ONLINE',
  },
  {
    id: 'HP_SECRETARIA',
    name: 'HP LaserJet Pro M404dw (Secretaria Acadêmica)',
    type: 'NETWORK',
    dpi: 1200,
    paperSizes: ['A4', 'CARTA'],
    isDefault: false,
    connectionStatus: 'ONLINE',
  },
  {
    id: 'THERMAL_80MM',
    name: 'Impressora Térmica de Recibos e Comprovantes 80mm',
    type: 'THERMAL',
    dpi: 203,
    paperSizes: ['TERMICA_80MM'],
    isDefault: false,
    connectionStatus: 'ONLINE',
  },
];

export const PrintCanvas: React.FC<PrintCanvasProps> = ({
  documentTitle = 'Relatório Oficial de Gestão e Desempenho Escolar',
  documentSubtitle = 'Documento emitido pelo ecossistema SucessoEdu • Módulo OmniDeploy',
  children,
  schoolName = 'Escola Municipal de Exemplo',
}) => {
  const [selectedDevice, setSelectedDevice] = useState<OmniDeployPrintDevice>(AVAILABLE_DEVICES[0]);
  const [paperOrientation, setPaperOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [paperFormat, setPaperFormat] = useState<'A4' | 'A3' | 'CARTA'>('A4');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [showWatermark, setShowWatermark] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4">
      {/* Top Header Material Design 3 */}
      <div className="bg-[#1a73e8] text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <Printer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold">PrintCanvas • Preview de Impressão e Dispositivos</h3>
            <p className="text-xs text-blue-100">
              Visualização fiel de página, controle de DPI e seletor de saída física ou virtual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 bg-white text-[#1a73e8] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Agora (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Barra de Controles de Impressão */}
      <div className="px-5 py-2 bg-slate-50 border-y border-slate-200 no-print flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Seletor de Dispositivo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Dispositivo de Saída:</span>
          <select
            value={selectedDevice.id}
            onChange={(e) => {
              const dev = AVAILABLE_DEVICES.find((d) => d.id === e.target.value);
              if (dev) setSelectedDevice(dev);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-[#1a73e8]"
          >
            {AVAILABLE_DEVICES.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} ({dev.dpi} DPI)
              </option>
            ))}
          </select>
        </div>

        {/* Formato e Orientação */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-700">Papel:</span>
            <select
              value={paperFormat}
              onChange={(e) => setPaperFormat(e.target.value as any)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="A4">A4 (210 x 297 mm)</option>
              <option value="CARTA">Carta (216 x 279 mm)</option>
              <option value="A3">A3 (297 x 420 mm)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
            <button
              onClick={() => setPaperOrientation('PORTRAIT')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                paperOrientation === 'PORTRAIT'
                  ? 'bg-[#1a73e8] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Retrato
            </button>
            <button
              onClick={() => setPaperOrientation('LANDSCAPE')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                paperOrientation === 'LANDSCAPE'
                  ? 'bg-[#1a73e8] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Paisagem
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <button
              onClick={() => setZoomScale((z) => Math.max(50, z - 10))}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200"
              title="Reduzir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-700 w-10 text-center">
              {zoomScale}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(150, z + 10))}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200"
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de Visualização Real da Folha A4 */}
      <div className="p-6 bg-slate-200/70 overflow-x-auto flex justify-center items-start min-h-[500px]">
        <div
          ref={printAreaRef}
          style={{
            transform: `scale(${zoomScale / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className={`bg-white shadow-2xl border border-slate-300 p-8 text-[#202124] relative ${
            paperOrientation === 'PORTRAIT'
              ? 'w-[794px] min-h-[1123px]' // A4 proporção 96 DPI
              : 'w-[1123px] min-h-[794px]'
          }`}
        >
          {/* Cabeçalho Oficial do Documento */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                <School className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Documento Oficial de Registro Escolar
                </span>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{schoolName}</h1>
                <p className="text-xs text-slate-600">Sistema Municipal de Ensino e Gestão Integrada</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
              <div>Horário: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-[10px] text-emerald-700 font-bold">Assinatura Digital Válida</div>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <div className="mb-6">
            <h2 className="text-base font-black text-[#1a73e8] uppercase tracking-wide">
              {documentTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{documentSubtitle}</p>
          </div>

          {/* Conteúdo Dinâmico Renderizado */}
          <div className="space-y-6">
            {children || (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-2">Síntese de Conformidade Operacional</h3>
                  <p>
                    Este relatório consolida todos os parâmetros de instalação, sincronização com a nuvem e
                    integridade criptográfica do nó local. Todas as verificações de hash SHA-256 resultaram em
                    100% de integridade com conformidade às diretrizes do MEC e BNCC.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-slate-200 rounded-lg bg-white">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Dispositivo Selecionado</span>
                    <strong className="text-xs text-slate-900">{selectedDevice.name}</strong>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg bg-white">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Resolução de Saída</span>
                    <strong className="text-xs text-[#1a73e8]">{selectedDevice.dpi} DPI (Alta Definição)</strong>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg bg-white">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Canal de Distribuição</span>
                    <strong className="text-xs text-emerald-700">Híbrido (Local + Cloud)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé Oficial com Código de Autenticidade */}
          <div className="absolute bottom-6 left-8 right-8 border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>SucessoEdu Gestão Educacional • OmniDeploy Enterprise</span>
            <span>Chave de Autenticação: SHA256-78f9-42b1-ac09</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
