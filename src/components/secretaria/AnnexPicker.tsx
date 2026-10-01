import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AnnexOption {
  id: string;
  name: string;
}

interface AnnexPickerProps {
  annexes: AnnexOption[];
  chosen: string[];
  onChange: (ids: string[]) => void;
  /** 'bar': botão na barra de filtros; 'panel': lista de caixas nos painéis de relatório. */
  variant?: 'bar' | 'panel';
}

/**
 * Escolha das escolas anexas que entram junto com a escola sede (relatório conjunto).
 * Com uma anexa só, é uma caixa simples; com várias, cada anexa pode ser marcada à parte.
 */
export const AnnexPicker: React.FC<AnnexPickerProps> = ({ annexes, chosen, onChange, variant = 'bar' }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const chosenSet = new Set(chosen);
  const count = annexes.filter((a) => chosenSet.has(a.id)).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (annexes.length === 0) return null;

  const toggle = (id: string, on: boolean) => {
    const next = new Set(chosenSet);
    if (on) next.add(id);
    else next.delete(id);
    onChange(annexes.filter((a) => next.has(a.id)).map((a) => a.id));
  };
  const setAll = (on: boolean) => onChange(on ? annexes.map((a) => a.id) : []);

  const list = (
    <div className="space-y-1">
      {annexes.map((a) => (
        <label key={a.id} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer hover:bg-violet-50 rounded-lg px-1.5 py-1">
          <input
            type="checkbox"
            checked={chosenSet.has(a.id)}
            onChange={(e) => toggle(a.id, e.target.checked)}
            className="accent-violet-600 mt-0.5"
          />
          <span className="font-semibold">{a.name}</span>
        </label>
      ))}
      {annexes.length > 1 && (
        <div className="flex gap-3 pt-1 pl-1.5 text-[11px] font-bold">
          <button type="button" onClick={() => setAll(true)} className="text-violet-700 hover:underline cursor-pointer">
            Marcar todas
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-slate-500 hover:underline cursor-pointer">
            Desmarcar todas
          </button>
        </div>
      )}
    </div>
  );

  if (variant === 'panel') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-slate-600">Escolas anexas (juntar com a sede)</span>
        <div className="px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white">{list}</div>
        <span className="text-[10px] text-slate-500">
          Cada escola sai em bloco próprio, e no final vem o quadro totalizador com o total geral.
        </span>
      </div>
    );
  }

  const active = count > 0;
  const barClass = `px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shrink-0 ${
    active ? 'bg-violet-100 border-violet-300 text-violet-900' : 'bg-white border-slate-200 text-slate-600'
  }`;

  // Uma anexa só: caixa simples, como antes
  if (annexes.length === 1) {
    return (
      <label className={barClass} title={`Juntar a escola anexa: ${annexes[0].name}`}>
        <input type="checkbox" checked={active} onChange={(e) => setAll(e.target.checked)} className="accent-violet-600" />
        + Anexas (1)
      </label>
    );
  }

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={barClass}
        title={`Escolher as escolas anexas: ${annexes.map((a) => a.name).join(', ')}`}
        aria-expanded={open}
      >
        + Anexas ({count}/{annexes.length})
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 w-72 max-w-[85vw] bg-white border border-slate-200 rounded-xl shadow-lg p-2">
          <p className="text-[11px] text-slate-500 px-1.5 pb-1">Marque as anexas que entram junto com a escola sede:</p>
          {list}
        </div>
      )}
    </div>
  );
};
