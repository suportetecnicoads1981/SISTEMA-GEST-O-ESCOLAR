/**
 * Relatórios de habilidades BNCC em HTML com estilos embutidos (servem para imprimir,
 * salvar em PDF pela impressão e baixar como documento do Word).
 */
import type { BnccSkill, BnccSkillAssessment } from '../../types';
import { BNCC_LEVELS, distribution, levelInfo, groupBy } from './bnccAssessmentService';
import { withLetterhead, type LetterheadTarget } from '../documentBranding';

const esc = (v: any) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export interface StudentReportOptions {
  includeDescriptions: boolean;
  includeChart: boolean;
  includeOpinion: boolean;
  includeLegend: boolean;
  includeSignatures: boolean;
  terms: number[]; // bimestres exibidos
  extraOpinion?: string;
}

export interface StudentReportInput {
  schoolName: string;
  schoolYear: number;
  studentName: string;
  enrollmentNumber?: string;
  className: string;
  teacherName?: string;
  assessments: BnccSkillAssessment[]; // todos os lançamentos do aluno no ano
  skills: Map<string, BnccSkill>;
}

const badge = (level?: number) => {
  const info = levelInfo(level);
  if (!info) return '<span style="color:#94a3b8">—</span>';
  return `<span style="display:inline-block;min-width:28px;text-align:center;padding:1px 6px;border-radius:6px;font-weight:700;font-size:10px;color:#fff;background:${info.color}">${info.sigla}</span>`;
};

/** Barras horizontais simples em SVG (funciona na impressão e no Word). */
export function svgBars(items: Array<{ label: string; value: number; color: string }>, max = 100, suffix = '%'): string {
  const rowH = 22;
  const w = 520;
  const labelW = 170;
  const h = items.length * rowH + 6;
  const bars = items
    .map((it, i) => {
      const bw = Math.max(0, Math.min(1, it.value / (max || 1))) * (w - labelW - 50);
      const y = i * rowH + 4;
      return `<text x="0" y="${y + 13}" font-size="10" fill="#334155">${esc(it.label.slice(0, 30))}</text>
<rect x="${labelW}" y="${y}" width="${bw.toFixed(1)}" height="15" rx="3" fill="${it.color}"/>
<text x="${labelW + bw + 4}" y="${y + 12}" font-size="10" fill="#0f172a" font-weight="bold">${Number.isInteger(it.value) ? it.value : it.value.toFixed(1)}${suffix}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

export function legendHtml(): string {
  return `<p style="font-size:10px;color:#475569;margin:6px 0">Legenda: ${BNCC_LEVELS.map((l) => `${badge(l.level)} ${esc(l.label)}`).join(' &nbsp; ')}</p>`;
}

/** Texto do parecer gerado a partir da situação atual das habilidades. */
export function autoOpinion(studentName: string, current: BnccSkillAssessment[], skills: Map<string, BnccSkill>): string {
  if (!current.length) return `Ainda não há habilidades lançadas para ${studentName} neste período.`;
  const d = distribution(current);
  const first = studentName.split(' ')[0];
  const need = current.filter((a) => a.level === 1).map((a) => a.skillCode);
  const dev = current.filter((a) => a.level === 2).map((a) => a.skillCode);
  const parts = [
    `${first} teve ${d.total} habilidade(s) da BNCC avaliada(s): ${d.counts[4]} plenamente desenvolvida(s), ${d.counts[3]} desenvolvida(s), ${d.counts[2]} em desenvolvimento e ${d.counts[1]} não desenvolvida(s), com ${d.achievedPct}% das habilidades já consolidadas.`,
  ];
  if (d.achievedPct >= 80) parts.push('O desempenho demonstra ótima apropriação dos objetos de conhecimento trabalhados.');
  else if (d.achievedPct >= 50) parts.push('O desempenho é satisfatório, com pontos que ainda merecem acompanhamento.');
  else parts.push('Recomenda-se acompanhamento pedagógico e atividades de recomposição da aprendizagem.');
  if (dev.length) parts.push(`Habilidades em desenvolvimento: ${dev.join(', ')}.`);
  if (need.length) {
    const desc = need
      .slice(0, 3)
      .map((c) => skills.get(c.toUpperCase())?.knowledgeObject || skills.get(c.toUpperCase())?.fieldOfExperience)
      .filter(Boolean);
    parts.push(
      `Precisam de intervenção prioritária: ${need.join(', ')}${desc.length ? ` (${desc.join('; ')})` : ''}.`
    );
  }
  return parts.join(' ');
}

export function studentReportHtml(input: StudentReportInput, opts: StudentReportOptions): string {
  const terms = opts.terms.length ? opts.terms : [1, 2, 3, 4];
  const byComponent = groupBy(input.assessments, (a) => a.subject || 'Outros');
  const lastTerm = Math.max(...terms);
  // situação atual: último bimestre lançado até o último bimestre exibido
  const currentMap = new Map<string, BnccSkillAssessment>();
  for (const a of input.assessments) {
    if (a.term > lastTerm) continue;
    const cur = currentMap.get(a.skillCode);
    if (!cur || a.term > cur.term) currentMap.set(a.skillCode, a);
  }
  const current = Array.from(currentMap.values());
  const d = distribution(current);

  const sections = Array.from(byComponent.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([component, list]) => {
      const codes = Array.from(new Set(list.map((a) => a.skillCode))).sort();
      const rows = codes
        .map((code) => {
          const sk = input.skills.get(code.toUpperCase());
          const cells = terms
            .map((t) => `<td style="text-align:center">${badge(list.find((a) => a.skillCode === code && a.term === t)?.level)}</td>`)
            .join('');
          const obs = list.filter((a) => a.skillCode === code && a.notes).map((a) => a.notes).pop();
          return `<tr>
<td style="font-family:monospace;font-weight:700;white-space:nowrap">${esc(code)}</td>
${opts.includeDescriptions ? `<td>${esc(sk?.description || '')}${obs ? `<br><i style="color:#64748b">Obs.: ${esc(obs)}</i>` : ''}</td>` : ''}
${cells}
<td style="text-align:center">${badge(currentMap.get(code)?.level)}</td>
</tr>`;
        })
        .join('');
      return `<h3 style="font-size:12px;margin:14px 0 4px;color:#312e81;border-bottom:1px solid #c7d2fe;padding-bottom:2px">${esc(component)}</h3>
<table style="width:100%;border-collapse:collapse;font-size:10.5px" border="1" cellpadding="4">
<thead style="background:#eef2ff"><tr><th>Código</th>${opts.includeDescriptions ? '<th>Habilidade</th>' : ''}${terms
        .map((t) => `<th>${t}º Bim.</th>`)
        .join('')}<th>Situação</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join('');

  const chart = opts.includeChart
    ? `<div style="margin-top:12px"><b style="font-size:11px">Situação das habilidades (${d.total})</b><br>${svgBars(
        BNCC_LEVELS.slice()
          .reverse()
          .map((l) => ({ label: l.label, value: d.total ? Math.round((d.counts[l.level] / d.total) * 1000) / 10 : 0, color: l.color }))
      )}</div>`
    : '';

  const opinion = opts.includeOpinion
    ? `<div style="margin-top:12px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-size:11px;line-height:1.5">
<b>Parecer descritivo</b><br>${esc(autoOpinion(input.studentName, current, input.skills))}${
        opts.extraOpinion ? `<br><br>${esc(opts.extraOpinion).replace(/\n/g, '<br>')}` : ''
      }</div>`
    : '';

  const signatures = opts.includeSignatures
    ? `<table style="width:100%;margin-top:36px;font-size:10px;text-align:center" border="0"><tr>
<td style="border:0">______________________________<br>Professor(a)${input.teacherName ? `: ${esc(input.teacherName)}` : ''}</td>
<td style="border:0">______________________________<br>Coordenação pedagógica</td>
<td style="border:0">______________________________<br>Responsável</td></tr></table>`
    : '';

  return `<div class="print-page-break" style="font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="border:2px solid #312e81;border-radius:10px;padding:8px 12px;margin-bottom:8px">
<div style="font-size:14px;font-weight:800;color:#312e81">${esc(input.schoolName)}</div>
<div style="font-size:12px;font-weight:700">Relatório de Habilidades BNCC — Ano letivo ${input.schoolYear}</div>
<div style="font-size:11px;margin-top:4px"><b>Aluno(a):</b> ${esc(input.studentName)}${
    input.enrollmentNumber ? ` &nbsp; <b>Matrícula:</b> ${esc(input.enrollmentNumber)}` : ''
  } &nbsp; <b>Turma:</b> ${esc(input.className)} &nbsp; <b>Bimestres:</b> ${terms.map((t) => `${t}º`).join(', ')}</div>
</div>
${opts.includeLegend ? legendHtml() : ''}
${sections || '<p style="font-size:11px;color:#64748b">Nenhuma habilidade lançada para este aluno nos filtros escolhidos.</p>'}
${chart}
${opinion}
${signatures}
</div>`;
}

export interface ClassReportInput {
  schoolName: string;
  schoolYear: number;
  className: string;
  subject: string;
  term: number;
  students: Array<{ id: string; name: string }>;
  assessments: BnccSkillAssessment[]; // do bimestre/filtro
  skills: Map<string, BnccSkill>;
}

export function classReportHtml(input: ClassReportInput): string {
  const codes = Array.from(new Set(input.assessments.map((a) => a.skillCode))).sort();
  const byStudent = groupBy(input.assessments, (a) => a.studentId);
  const header = codes.map((c) => `<th style="font-family:monospace;font-size:9px">${esc(c)}</th>`).join('');
  const rows = input.students
    .map((s, i) => {
      const list = byStudent.get(s.id) || [];
      const cells = codes.map((c) => `<td style="text-align:center">${badge(list.find((a) => a.skillCode === c)?.level)}</td>`).join('');
      const d = distribution(list);
      return `<tr><td>${i + 1}</td><td>${esc(s.name)}</td>${cells}<td style="text-align:center;font-weight:700">${d.total ? d.achievedPct + '%' : '—'}</td></tr>`;
    })
    .join('');
  const perSkill = codes.map((c) => {
    const d = distribution(input.assessments.filter((a) => a.skillCode === c));
    return { label: c, value: d.achievedPct, color: d.achievedPct >= 70 ? '#10b981' : d.achievedPct >= 50 ? '#f59e0b' : '#ef4444' };
  });
  const skillList = codes
    .map((c) => `<li><b style="font-family:monospace">${esc(c)}</b> — ${esc(input.skills.get(c.toUpperCase())?.description || '')}</li>`)
    .join('');
  const need = input.students
    .filter((s) => (byStudent.get(s.id) || []).some((a) => a.level === 1))
    .map((s) => esc(s.name));

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="border:2px solid #312e81;border-radius:10px;padding:8px 12px;margin-bottom:8px">
<div style="font-size:14px;font-weight:800;color:#312e81">${esc(input.schoolName)}</div>
<div style="font-size:12px;font-weight:700">Mapa de Habilidades BNCC da Turma — ${esc(input.className)}</div>
<div style="font-size:11px">Ano letivo ${input.schoolYear} · ${input.term ? `${input.term}º bimestre` : 'Todos os bimestres'} · ${esc(input.subject || 'Todos os componentes')}</div>
</div>
${legendHtml()}
<table style="width:100%;border-collapse:collapse;font-size:10px" border="1" cellpadding="3">
<thead style="background:#eef2ff"><tr><th>Nº</th><th>Aluno(a)</th>${header}<th>% D+PD</th></tr></thead><tbody>${rows}</tbody></table>
${codes.length ? `<div style="margin-top:12px"><b style="font-size:11px">% de alunos com a habilidade desenvolvida (D + PD)</b><br>${svgBars(perSkill)}</div>` : ''}
${need.length ? `<p style="font-size:11px;margin-top:8px"><b>Alunos com habilidade não desenvolvida (intervenção):</b> ${need.join(', ')}.</p>` : ''}
<ol style="font-size:10px;margin-top:10px">${skillList}</ol>
</div>`;
}

/** Baixa o HTML como documento que o Word abre (.doc). */
export function downloadWordDoc(filename: string, bodyHtml: string, letterhead?: LetterheadTarget) {
  // Mesmo timbre (logos da Gestão, SEMED e escola) da impressão.
  bodyHtml = withLetterhead(bodyHtml, letterhead);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(
    filename
  )}</title></head><body>${bodyHtml}</body></html>`;
  const blob = new Blob(['﻿' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
