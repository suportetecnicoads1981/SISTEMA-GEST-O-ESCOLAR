// Importação: letra da turma (A, B, C...) e nomes de escola por extenso x sigla.
import { it, expect } from 'vitest';
import { extractClassLetter, normalizeSchoolName } from '../src/services/dataImportService';
it('reconhece a letra da turma e unifica as siglas das escolas', () => {
  const cases: [string, string][] = [
    ['PRÉ II\nNº', ''], ['PRÉ II Nº', ''], ['1º ANO A \nNº', 'A'], ['3 ANO B Nº', 'B'], ['1º ANO F\nNº', 'F'],
    ['Pré-Escola I A    DATA 15/09/2026', 'A'], ['PRÉ-ESCOLA I E          DATA: 15/09/2026', 'E'], ['PRÉ I   DATA14/09/2026', ''],
    ['PRÉ I - MANHÃ', ''], ['1º ANO A - MANHÃ', 'A'], ['PRÉ II - MANHÃ', ''], ['PRÉ-ESCOLA II B', 'B'], ['9º ANO \nNº', ''],
    ['1º ANO - ENSINO FUNDAMENTAL', ''], ['5º ANO - TURMA C', 'C'], ['PRÉ I', ''], ['PRÉ II', ''],
  ];
  for (const [t, l] of cases) expect([t, extractClassLetter(t)]).toEqual([t, l]);
  expect(normalizeSchoolName('MUNICIPAL DE ENSINO INFANTIL E FUNDAMENTAL NOVA VIDA')).toBe('EMEIF NOVA VIDA');
  expect(normalizeSchoolName('E.M.E.I.F INDÍGENA KANHÕK')).toBe('EMEIF INDIGENA KANHOK');
  expect(normalizeSchoolName('ESCOLA: EMEIF NOVA VIDA')).toBe('EMEIF NOVA VIDA');
  expect(normalizeSchoolName('EMEF CANAÃ')).toBe('EMEF CANAA');
  expect(normalizeSchoolName('EMIEIF ERMINIO BRITO')).toBe('EMIEIF ERMINIO BRITO');
});
