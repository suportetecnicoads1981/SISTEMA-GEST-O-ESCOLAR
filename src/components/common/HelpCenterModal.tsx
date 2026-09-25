/**
 * Tira-dúvidas: abre nas perguntas do módulo atual; busca em todos os módulos.
 * Conteúdo em src/services/help/helpContent.ts.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, LifeBuoy, ChevronDown, ChevronRight, Lightbulb, ArrowLeft } from 'lucide-react';
import { HELP_GENERAL, HELP_MODULES, helpForTab, searchHelp, HelpItem, HelpModule } from '../../services/help/helpContent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
}

const Answer: React.FC<{ item: HelpItem }> = ({ item }) => (
  <div className="space-y-2 text-[13px] text-slate-700 leading-relaxed">
    {item.a && <p>{item.a}</p>}
    {item.steps && item.steps.length > 0 && (
      <ol className="list-decimal pl-5 space-y-1">
        {item.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    )}
    {item.tip && (
      <p className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{item.tip}</span>
      </p>
    )}
  </div>
);

const FaqList: React.FC<{ items: HelpItem[]; openFirst?: boolean; prefix: string }> = ({ items, openFirst, prefix }) => {
  const [open, setOpen] = useState<number | null>(openFirst ? 0 : null);
  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
      {items.map((it, i) => (
        <div key={`${prefix}-${i}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <span>{it.q}</span>
            {open === i ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
          </button>
          {open === i && (
            <div className="px-3 pb-3">
              <Answer item={it} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const HelpCenterModal: React.FC<Props> = ({ isOpen, onClose, activeTab }) => {
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<HelpModule | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTerm('');
      setPicked(null);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const current = useMemo(() => helpForTab(activeTab), [activeTab]);
  const results = useMemo(() => searchHelp(term), [term]);
  const shown = picked || current;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3" onClick={onClose}>
      <div
        className="bg-slate-50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Tira-dúvidas"
      >
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Tira-dúvidas</h2>
              <p className="text-xs text-slate-500">Como fazer cada tarefa, passo a passo. Atalho: F1.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" title="Fechar (Esc)">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-3 bg-white border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Escreva sua dúvida (ex.: matricular aluno, lançar respostas, imprimir boletim)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {term.trim().length >= 2 ? (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-500">
                {results.length ? `${results.length} resposta(s) para "${term}"` : `Nada encontrado para "${term}"`}
              </h3>
              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="text-[11px] font-bold text-sky-700">{r.module.title}</div>
                      <div className="text-sm font-bold text-slate-900">{r.item.q}</div>
                      <Answer item={r.item} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Tente outras palavras ou escolha o módulo na lista abaixo. Se a dúvida continuar, fale com o suporte (módulo "Sobre o Sistema & Dev").</p>
              )}
            </section>
          ) : (
            <>
              {shown ? (
                <section className="space-y-2">
                  {picked && (
                    <button onClick={() => setPicked(null)} className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline cursor-pointer">
                      <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao módulo atual
                    </button>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{shown.title}</h3>
                    <p className="text-[11px] text-slate-500">{shown.where}</p>
                    <p className="text-sm text-slate-700 mt-1">{shown.summary}</p>
                  </div>
                  <FaqList items={shown.faq} openFirst prefix={shown.id} />
                </section>
              ) : (
                <p className="text-sm text-slate-600">Escolha um módulo abaixo ou escreva sua dúvida na busca.</p>
              )}

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-500">{HELP_GENERAL.title}</h3>
                <FaqList items={HELP_GENERAL.faq} prefix="geral" />
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-500">Outros módulos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HELP_MODULES.filter((m) => m.id !== shown?.id).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPicked(m)}
                      className="text-left p-2.5 bg-white border border-slate-200 hover:border-sky-400 rounded-xl cursor-pointer"
                    >
                      <div className="text-sm font-bold text-slate-800">{m.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2">{m.summary}</div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
