// Planilha com "1º ANO A, B, C, D" e também alunos só com "1º ANO" (sem letra), como na E.M.E.F Zilda Pereira:
// a turma A não pode perder a letra e os alunos dela não podem ficar sem turma.
import { it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseFileResults, DEFAULT_IMPORT_FILTERS, convertImportedStudentsToOfficial } from '../src/services/dataImportService';

const HEADER = ['Nº', 'NOME COMPLETO DO ALUNO', 'DATA DE NASCIMENTO', 'SEXO', 'RAÇA/COR', 'ENDEREÇO', 'PCD / DEFICIÊNCIA', 'LAUDO', 'SÉRIE E TURMA', 'TURNO'];
const Y = new Date().getFullYear();

function file(): File {
  const linha = (n: number, turma: string, turno: string) => [n, `ALUNO TESTE ${n}`, `10/03/${Y - 7}`, 'M', 'PARDA', 'RUA A', '-', 'NÃO', turma, turno];
  const alunos = [
    linha(1, '1º ANO A', 'MANHÃ'), linha(2, '1º ANO A', 'MANHÃ'),
    linha(3, '1º ANO B', 'MANHÃ'),
    linha(4, '1º ANO', 'TARDE'), linha(5, '1º ANO', 'TARDE'), linha(6, '1º ANO', 'TARDE'),
    linha(7, '1º ANO D', 'TARDE'),
  ];
  const rows = [['LEVANTAMENTO'], ['SEMED'], ['UNIDADE ESCOLAR', '', '', '', '', '', '', '', '', '', '', '', 'ESCOLA: E.M.E.F TESTE'], [], [], [], [], [], [], [], [], HEADER, ...alunos];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'ALUNOS');
  return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], 'teste.xlsx');
}

it('alunos sem letra viram turma própria e a turma A mantém a letra e os alunos', async () => {
  const filters = { ...DEFAULT_IMPORT_FILTERS, autoRegisterSchoolUnit: true };
  const [r] = (await parseFileResults(file(), filters, [], [])) as any[];
  const names = r.suggestedClasses.map((c: any) => c.name).sort();
  expect(names).toEqual(['1º ANO - TARDE', '1º ANO A - MANHÃ', '1º ANO B - MANHÃ', '1º ANO D - TARDE']);
  const ids = new Set(r.suggestedClasses.map((c: any) => c.id));
  expect(ids.size).toBe(4);
  // Ninguém sem turma
  expect(r.students.filter((s: any) => !s.classId)).toEqual([]);
  const turmaDe = (n: number) => r.students.find((s: any) => s.name === `ALUNO TESTE ${n}`).className;
  expect(turmaDe(1)).toBe('1º ANO A - MANHÃ');
  expect(turmaDe(4)).toBe('1º ANO - TARDE');
  // Aviso para a escola informar a letra
  expect(r.warnings.some((w: string) => w.includes('sem letra de turma') && w.includes('1º ANO (3 alunos)'))).toBe(true);
  // Conversão final mantém as turmas
  const off = convertImportedStudentsToOfficial(r.students, filters, [], 0, r.suggestedSchoolUnit, r.suggestedClasses, [], []);
  expect(off.every((s) => s.classId && s.classId !== 'cls-default')).toBe(true);
});
