import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  Bug,
  Lightbulb,
  Heart,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import { DeveloperContact, SchoolSettings, UserAccount } from '../../types';

interface FeedbackSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerContact: DeveloperContact;
  settings?: SchoolSettings;
  currentUser?: UserAccount;
}

export type FeedbackType = 'SUGESTÃO' | 'RECLAMAÇÃO' | 'ELOGIO' | 'DÚVIDA' | 'RELATO_BUG';

export const FeedbackSuggestionsModal: React.FC<FeedbackSuggestionsModalProps> = ({
  isOpen,
  onClose,
  developerContact,
  settings,
  currentUser,
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('SUGESTÃO');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [userContactName, setUserContactName] = useState(currentUser?.name || '');
  const [userContactPhone, setUserContactPhone] = useState(currentUser?.phone || '');
  const [schoolUnitName, setSchoolUnitName] = useState(settings?.name || 'Colégio SucessoEdu');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const targetWhatsApp = (developerContact.whatsapp || developerContact.phone || '5511987654321').replace(/\D/g, '');

  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Por favor, informe a descrição da sua mensagem.');
      return;
    }

    const typeIcons: Record<FeedbackType, string> = {
      SUGESTÃO: '💡 SUGESTÃO DE MELHORIA',
      RECLAMAÇÃO: '⚠️ RECLAMAÇÃO / PONTO DE ATENÇÃO',
      ELOGIO: '⭐ ELOGIO AO SISTEMA',
      DÚVIDA: '❓ DÚVIDA OPERACIONAL',
      RELATO_BUG: '🐛 RELATO DE COMPORTAMENTO / BUG',
    };

    const textPayload = `*🎓 SUCESSOEDU GESTÃO EDUCACIONAL - CENTRAL DE FEEDBACK DIRECTO*
--------------------------------------------------
*Tipo de Mensagem:* ${typeIcons[feedbackType]}
*Assunto:* ${subject || 'Sem assunto específico'}
*Remetente:* ${userContactName || 'Operador do Sistema'} (${currentUser?.sectorTitle || 'Secretaria / Gestão'})
*Escola / Instituição:* ${schoolUnitName}
*Contato:* ${userContactPhone || 'Não informado'}
*Versão do Sistema:* ${developerContact.systemVersion || 'v5.0.0-Enterprise'}
*Data/Hora:* ${new Date().toLocaleString('pt-BR')}

*Mensagem Detalhada:*
${description}

--------------------------------------------------
_Mensagem gerada via Módulo de Feedback e Sugestões do SucessoEdu._`;

    const encoded = encodeURIComponent(textPayload);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetWhatsApp}&text=${encoded}`;

    window.open(whatsappUrl, '_blank');
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/20">
                Canal Direto com o Programador
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Sugestões, Elogios & Reclamações
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        {isSent ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Mensagem Direcionada ao WhatsApp!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Sua solicitação foi formatada e enviada diretamente para o programador responsável (
              {developerContact.name} - {developerContact.phone}).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendToWhatsApp} className="p-5 sm:p-6 space-y-4">
            {/* Feedback Types */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Selecione o Tipo de Mensagem *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType('SUGESTÃO')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    feedbackType === 'SUGESTÃO'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <span>Sugestão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('ELOGIO')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    feedbackType === 'ELOGIO'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                  <span>Elogio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('RECLAMAÇÃO')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    feedbackType === 'RECLAMAÇÃO'
                      ? 'bg-rose-50 text-rose-900 border-rose-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>Reclamação</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('RELATO_BUG')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    feedbackType === 'RELATO_BUG'
                      ? 'bg-purple-50 text-purple-900 border-purple-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bug className="h-4 w-4 text-purple-600" />
                  <span>Relato de Erro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('DÚVIDA')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                    feedbackType === 'DÚVIDA'
                      ? 'bg-cyan-50 text-cyan-900 border-cyan-400 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="h-4 w-4 text-cyan-600" />
                  <span>Dúvida</span>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={userContactName}
                  onChange={(e) => setUserContactName(e.target.value)}
                  placeholder="Ex: Maria Silva (Secretária)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Telefone / WhatsApp de Retorno
                </label>
                <input
                  type="text"
                  value={userContactPhone}
                  onChange={(e) => setUserContactPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assunto Resumido
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Ideia para emissão rápida de boletim por turma"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mensagem / Detalhamento *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva aqui com clareza o que você gostaria de ver melhorado, sua sugestão de nova funcionalidade ou detalhe qualquer dúvida..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Developer Contact Info Banner */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-slate-600">
                  Destino:{' '}
                  <strong className="text-slate-900">
                    {developerContact.name} ({developerContact.phone})
                  </strong>
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                WhatsApp Oficial
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
