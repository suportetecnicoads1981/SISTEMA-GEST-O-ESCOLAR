import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  COMPLEMENT_COLUMNS,
  buildComplementRows,
  missingList,
  parseComplementMatrix,
  planComplement,
} from '../src/services/students/complementSheet';
import { buildStyledXlsx } from '../src/services/styledXlsx';
import { hasCadastralPending } from '../src/utils/studentDocuments';
import type { SchoolClass, Student } from '../src/types';

const cls: SchoolClass = { id: 'c1', name: '2º Ano A', gradeLevel: '2º Ano', shift: 'MANHA' } as any;

const base = (over: Partial<Student>): Student =>
  ({
    id: 's1',
    name: 'ANA LIMA',
    enrollmentNumber: 'RA-001',
    cpf: '000.000.000-00',
    birthDate: '2020-01-01',
    gender: 'OTHER',
    raceColor: 'NAO_DECLARADA',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    address: 'Endereço pendente de cadastro',
    classId: 'c1',
    schoolUnitId: 'e1',
    status: 'ACTIVE',
    medicalClassification: 'Não declarada',
    hasMedicalReport: false,
    medicalReportText: 'NÃO INFORMADO',
    cadastralStatus: 'INCOMPLETE',
    pendingFields: [
      'Data de Nascimento',
      'Endereço / Localidade',
      'Raça/Cor (Censo Escolar)',
      'Sexo',
      'Avaliação de Laudo (SIM/NÃO)',
      'CPF / Certidão de Nascimento',
    ],
    ...over,
  }) as Student;

const ana = base({});
const beto = base({
  id: 's2',
  name: 'BETO SOUZA',
  enrollmentNumber: 'RA-002',
  cpf: '529.982.247-25',
  birthDate: '2018-03-10',
  gender: 'M',
  raceColor: 'PARDA',
  address: 'Rua A, 10',
  guardianName: 'Maria',
  guardianPhone: '(98) 99999-0000',
  medicalReportText: 'NÃO',
  cadastralStatus: 'OK',
  pendingFields: [],
});

/** Matriz como o Excel devolveria: timbre, cabeçalho e linhas. */
const matrixOf = (rows: Record<string, unknown>[]) => [
  ['PREFEITURA'],
  ['PLANILHA'],
  COMPLEMENT_COLUMNS.map((c) => c.label),
  ...rows.map((r) => COMPLEMENT_COLUMNS.map((c) => r[c.key] ?? '')),
  ['Total de alunos nesta planilha: 2'],
];

describe('geração da planilha', () => {
  it('mostra vazio o que falta (marcadores da importação não contam) e lista as pendências', () => {
    const rows = buildComplementRows([beto, ana], [cls]);
    expect(rows.map((r) => r.name)).toEqual(['ANA LIMA', 'BETO SOUZA']);
    const a = rows[0];
    expect(a.cpf).toBe('');
    expect(a.birthDate).toBe('');
    expect(a.address).toBe('');
    expect(a.gender).toBe('');
    expect(a.raceColor).toBe('');
    expect(a.className).toBe('2º Ano A');
    expect(a.missing).toMatch(/CPF/);
    expect(a.missing).toMatch(/Laudo/);
    expect(rows[1].birthDate).toBe('10/03/2018');
    expect(rows[1].cpf).toBe('529.982.247-25');
    expect(rows[1].missing).toMatch(/completo/);
  });
  it('"só com pendência" deixa de fora quem está completo', () => {
    expect(buildComplementRows([ana, beto], [cls], true).map((r) => r.id)).toEqual(['s1']);
    expect(missingList(beto)).toEqual([]);
  });
  it('gera o xlsx com as células vazias de preenchimento em amarelo e formato texto', async () => {
    const rows = buildComplementRows([ana], [cls]);
    const blob = await buildStyledXlsx({
      title: 'x',
      columns: COMPLEMENT_COLUMNS.map((c) => ({ label: c.label })),
      sections: [{ rows: rows.map((r) => COMPLEMENT_COLUMNS.map((c) => r[c.key])), inputCols: [4, 5] }],
    });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    const styles = await zip.file('xl/styles.xml')!.async('string');
    expect(sheet).toMatch(/s="15"\/>/); // célula vazia para preencher
    expect(styles).toMatch(/FFFEF08A/);
    expect(styles).toMatch(/cellXfs count="16"/);
  });
});

describe('importação da planilha preenchida', () => {
  it('acha o cabeçalho e ignora rodapé', () => {
    const p = parseComplementMatrix(matrixOf([{ ra: 'RA-001', name: 'ANA LIMA', id: 's1' }]));
    expect(p.error).toBeUndefined();
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].line).toBe(4);
    expect(parseComplementMatrix([['qualquer'], ['coisa']]).error).toMatch(/cabeçalho/);
  });

  it('grava só o preenchido, resolve as pendências e fecha o cadastro', () => {
    const parsed = parseComplementMatrix(
      matrixOf([
        {
          ra: 'RA-001',
          name: 'ANA LIMA',
          id: 's1',
          cpf: '11144477735',
          birthDate: '15/06/2018',
          gender: 'f',
          raceColor: 'parda',
          address: 'Rua das Flores, 20',
          guardianName: 'Joana Lima',
          guardianPhone: '98988887777',
          laudo: 'não',
        },
        { ra: 'RA-002', name: 'BETO SOUZA', id: 's2' },
      ])
    );
    const plan = planComplement(parsed, [ana, beto], [cls], [ana, beto], new Date(2026, 9, 3));
    expect(plan.problems).toEqual([]);
    expect(plan.unchanged).toBe(1);
    expect(plan.items).toHaveLength(1);
    const u = plan.items[0].updated;
    expect(u.cpf).toBe('111.444.777-35');
    expect(u.birthDate).toBe('2018-06-15');
    expect(u.gender).toBe('F');
    expect(u.raceColor).toBe('PARDA');
    expect(u.address).toBe('Rua das Flores, 20');
    expect(u.medicalReportText).toBe('NÃO');
    expect(u.pendingFields).toEqual([]);
    expect(u.cadastralStatus).toBe('OK');
    expect(u.updatedAt).toBeTruthy();
    expect(hasCadastralPending(u)).toBe(false);
    expect(u.name).toBe('ANA LIMA');
    expect(u.classId).toBe('c1');
    expect(plan.resolvedCount).toBe(6);
    expect(ana.cpf).toBe('000.000.000-00'); // o original não muda
  });

  it('célula vazia não apaga; CPF inválido ou repetido fica de fora', () => {
    const parsed = parseComplementMatrix(
      matrixOf([
        { ra: 'RA-001', name: 'ANA LIMA', id: 's1', cpf: '123.456.789-00', address: 'Rua X' },
        { ra: 'RA-002', name: 'BETO SOUZA', id: 's2', cpf: '', address: '' },
      ])
    );
    const plan = planComplement(parsed, [ana, beto], [cls]);
    const u = plan.items[0].updated;
    expect(u.cpf).toBe('000.000.000-00');
    expect(u.address).toBe('Rua X');
    expect(plan.items[0].warnings[0]).toMatch(/inválido/);
    expect(u.pendingFields).toContain('CPF / Certidão de Nascimento');
    expect(u.cadastralStatus).toBe('INCOMPLETE');

    // CPF que já é de outro aluno
    const dup = planComplement(parseComplementMatrix(matrixOf([{ ra: 'RA-001', name: 'ANA LIMA', id: 's1', cpf: '529.982.247-25' }])), [ana, beto], [cls]);
    expect(dup.items).toHaveLength(0);
    expect(dup.problems[0].message).toMatch(/BETO SOUZA/);
  });

  it('acha pelo RA quando falta o código; RA de outro aluno não grava', () => {
    const ok = planComplement(parseComplementMatrix(matrixOf([{ ra: 'RA-001', name: 'Ana Lima', gender: 'F' }])), [ana, beto], [cls]);
    expect(ok.items[0].student.id).toBe('s1');
    const wrong = planComplement(parseComplementMatrix(matrixOf([{ ra: 'RA-002', name: 'ANA LIMA', gender: 'F' }])), [ana, beto], [cls]);
    expect(wrong.items).toHaveLength(0);
    expect(wrong.problems[0].message).toMatch(/RA-002/);
    const none = planComplement(parseComplementMatrix(matrixOf([{ ra: 'RA-999', name: 'ZÉ' }])), [ana, beto], [cls]);
    expect(none.problems[0].message).toMatch(/não encontrado/);
  });

  it('CPF que o Excel virou número volta com os zeros; data serial do Excel funciona; idade fora da série gera conferência', () => {
    const parsed = parseComplementMatrix(
      matrixOf([{ id: 's1', ra: 'RA-001', name: 'ANA LIMA', cpf: 1144477735 /* 01144477735? */, birthDate: 36892 /* 01/01/2001 */ }])
    );
    const plan = planComplement(parsed, [ana], [cls], [ana], new Date(2026, 9, 3));
    const it0 = plan.items[0];
    expect(it0.updated.birthDate).toBe('2001-01-01');
    expect(it0.updated.pendingFields).toContain('Conferir data de nascimento / série');
    // 01144477735 não é CPF válido: fica de fora com aviso, mas o zero à esquerda foi recolocado
    expect(it0.warnings.join(' ')).toMatch(/01144477735/);
  });

  it('laudo SIM resolve a comprovação do PCD; PCD sem laudo continua pendente', () => {
    const pcd = base({ id: 's3', name: 'CAIO', enrollmentNumber: 'RA-003', medicalClassification: 'TEA', pendingFields: ['Comprovação de Laudo Médico (PCD)', 'Avaliação de Laudo (SIM/NÃO)'] });
    const yes = planComplement(parseComplementMatrix(matrixOf([{ id: 's3', ra: 'RA-003', name: 'CAIO', laudo: 'SIM' }])), [pcd], [cls]);
    expect(yes.items[0].updated.hasMedicalReport).toBe(true);
    expect(yes.items[0].updated.pendingFields).not.toContain('Comprovação de Laudo Médico (PCD)');
    const no = planComplement(parseComplementMatrix(matrixOf([{ id: 's3', ra: 'RA-003', name: 'CAIO', laudo: 'NÃO' }])), [pcd], [cls]);
    expect(no.items[0].updated.pendingFields).toContain('Comprovação de Laudo Médico (PCD)');
    expect(no.items[0].updated.pendingFields).not.toContain('Avaliação de Laudo (SIM/NÃO)');
  });
});
