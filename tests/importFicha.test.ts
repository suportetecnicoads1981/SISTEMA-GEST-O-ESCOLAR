// Importação pela planilha padrão: ficha da escola (aba "DADOS DA ESCOLA"), escola anexa,
// deficiências adicionais e as pendências novas (data impossível, idade x série, aluno repetido).
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseFileResults,
  DEFAULT_IMPORT_FILTERS,
  isImpossibleBirthDate,
  isAgeFarFromGrade,
  AGE_GRADE_PENDING,
  DUPLICATE_PENDING_PREFIX,
  convertImportedStudentsToOfficial,
  distinctSchoolName,
} from '../src/services/dataImportService';
import { withoutReviewPendings, isTooOldBirthDate } from '../src/utils/studentDocuments';
import type { SchoolUnit } from '../src/types';

const HEADER = ['Nº', 'NOME COMPLETO DO ALUNO', 'DATA DE NASCIMENTO', 'SEXO', 'RAÇA/COR', 'ENDEREÇO', 'PCD / DEFICIÊNCIA', 'LAUDO', 'SÉRIE E TURMA', 'TURNO', 'DEFICIÊNCIA ADICIONAL 1', 'DEFICIÊNCIA ADICIONAL 2'];

/** Monta uma planilha no formato do modelo padrão. escolaLinha = '' simula a fórmula "ESCOLA:" sem valor salvo. */
function workbook(alunos: any[][], ficha: Record<string, any>, escolaLinha: string, extras: Record<string, string> = {}): File {
  const alunosRows: any[][] = [
    ['LEVANTAMENTO DE ALUNOS POR UNIDADE ESCOLAR'],
    ['SEMED'],
    ['UNIDADE ESCOLAR', '', '', '', '', '', '', '', '', '', '', '', escolaLinha],
    [], [], [], [], [], [], [], [],
    HEADER,
    ...alunos,
  ];
  const fichaRows: any[][] = [
    ['FICHA DE CADASTRO DA UNIDADE ESCOLAR'],
    ['SEMED'],
    [''],
    ['IDENTIFICAÇÃO'],
    ['Nome oficial da escola *', '', ficha.nome, '', '', 'Escolha na lista.'],
    ['Nome como a escola é conhecida', '', ficha.conhecida || ''],
    ['Código INEP *', '', ficha.inep || ''],
    ['CNPJ ou decreto de criação *', '', ficha.decreto || ''],
    ['Tipo da unidade *', '', ficha.tipo || ''],
    ['Escola sede (se for anexa)', '', ficha.sede || ''],
    [],
    ['LOCALIZAÇÃO'],
    ['Localização *', '', 'RURAL'],
    ['Endereço *', '', ficha.endereco || ''],
    ['Bairro / localidade *', '', 'ALDEIA'],
    ['CEP', '', '68398000'],
    ['Município', '', 'CUMARU DO NORTE'],
    ['UF', '', 'PA'],
    [],
    ['CONTATO E EQUIPE GESTORA'],
    ['Telefone *', '', '(94) 98414-6130'],
    ['E-mail', '', 'escola@gmail.com'],
    ['Diretor(a) *', '', ficha.diretor || ''],
    ['Coordenador(a) pedagógico(a)', '', 'COORD'],
    ['Secretário(a) escolar', '', 'SEC'],
    [],
    ['ESTRUTURA'],
    ['Salas de aula', '', 4],
    ['Horário de funcionamento', '', '07:00 às 17:00'],
    ['Internet na escola', '', 'SIM'],
    [],
    ['TURNOS OFERECIDOS'],
    ['MANHÃ', '', 'SIM'],
    ['TARDE', '', 'SIM'],
    ['NOITE', '', ''],
    ['INTEGRAL', '', 'NÃO'],
    [],
    ['SÉRIES ATENDIDAS'],
    ['PRÉ I', '', 'SIM'],
    ['PRÉ II', '', 'SIM'],
    ['1º ANO', '', 'SIM'],
    ['2º ANO', '', ''],
    ['3º ANO', '', 'SIM'],
  ];
  Object.entries(extras).forEach(([k, v]) => fichaRows.push([k, '', v]));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(alunosRows), 'ALUNOS');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fichaRows), 'DADOS DA ESCOLA');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'escola.xlsx');
}

const filters = { ...DEFAULT_IMPORT_FILTERS, autoRegisterSchoolUnit: true };
const Y = new Date().getFullYear();

describe('importação pela planilha padrão', () => {
  it('lê a ficha da escola, as turmas no turno dos alunos e as novas pendências', async () => {
    const file = workbook(
      [
        [1, 'ANA KAYAPO', `12/07/${Y - 5}`, 'F', 'INDÍGENA', 'ALDEIA', '-', 'NÃO', 'PRÉ I', 'TARDE', '', ''],
        [2, 'ANA KAYAPO', `12/07/${Y - 5}`, 'F', 'INDÍGENA', 'ALDEIA', '-', 'NÃO', 'PRÉ II', 'MANHÃ', '', ''],
        [3, 'BEP KAYAPO', '14/11/1018', 'M', 'INDÍGENA', 'ALDEIA', '-', 'NÃO', '1º ANO', 'TARDE', '', ''],
        [4, 'IRE KAYAPO', `19/09/${Y - 5}`, 'F', 'INDÍGENA', 'ALDEIA', '-', 'NÃO', '3º ANO', 'TARDE', '', ''],
        [5, 'KOKO KAYAPO', `10/05/${Y - 9}`, 'F', 'INDÍGENA', 'ALDEIA', 'DEFICIÊNCIA FÍSICA', 'SIM', '3º ANO', 'TARDE', 'BAIXA VISÃO', '-'],
      ],
      { nome: 'E.M.E.I.F INDÍGENA KANHÕK', conhecida: 'ESCOLA KANHÕK', inep: '15522385', decreto: 'Decreto 009/1999', tipo: 'ESCOLA RURAL', endereco: 'Aldeia Gorotire', diretor: 'DIRETOR X' },
      '' // fórmula "ESCOLA:" sem valor: o nome vem da ficha
    );
    const [r] = (await parseFileResults(file, filters, [], [])) as any[];
    expect(r.errors).toEqual([]);
    const u = r.suggestedSchoolUnit as SchoolUnit;
    expect(u.name).toBe('E.M.E.I.F INDÍGENA KANHÕK');
    expect(u.inepCode).toBe('15522385');
    expect(u.cnpjOrDecree).toBe('Decreto 009/1999');
    expect(u.type).toBe('ESCOLA_RURAL');
    expect(u.directorName).toBe('DIRETOR X');
    expect(u.zipCode).toBe('68398-000');
    expect(u.offeredShifts).toEqual(['MANHÃ', 'TARDE']);
    expect(u.gradesServed).toEqual(['PRÉ I', 'PRÉ II', '1º ANO', '3º ANO']);
    expect(u.totalClassrooms).toBe(4);
    expect(u.cadastralStatus).toBe('OK');
    expect(u.pendingFields).toEqual([]);

    // Turma com o turno dos alunos (PRÉ I - TARDE), não o padrão MANHÃ
    const names = r.suggestedClasses.map((c: any) => c.name);
    expect(names).toContain('PRÉ I - TARDE');
    expect(names).toContain('3º ANO - TARDE');

    const byName = (n: string) => r.students.filter((s: any) => s.name === n);
    // Aluno repetido: entra uma vez, com pendência de possível duplicado
    const ana = byName('ANA KAYAPO');
    expect(ana[0].pendingFields.some((p: string) => p.startsWith(DUPLICATE_PENDING_PREFIX) && p.includes('PRÉ II'))).toBe(true);
    const official = convertImportedStudentsToOfficial(r.students, filters, [], 0, undefined, r.suggestedClasses, [u], []);
    expect(official.filter((s) => s.name === 'ANA KAYAPO')).toHaveLength(1);
    // Data impossível (1018)
    expect(byName('BEP KAYAPO')[0].pendingFields).toContain('Data de Nascimento');
    // 5 anos no 3º ano
    expect(byName('IRE KAYAPO')[0].pendingFields).toContain(AGE_GRADE_PENDING);
    // Deficiência principal + adicional
    const koko = byName('KOKO KAYAPO')[0];
    expect(koko.medicalClassification).toBe('DEFICIÊNCIA FÍSICA + BAIXA VISÃO');
    expect(koko.pendingFields).not.toContain(AGE_GRADE_PENDING);
    const kokoOfficial = official.find((s) => s.name === 'KOKO KAYAPO')!;
    expect(kokoOfficial.specialNeeds).toEqual(['DEFICIÊNCIA FÍSICA', 'BAIXA VISÃO']);
    // A ficha não vira aluno
    expect(r.students.some((s: any) => /NOME OFICIAL|TELEFONE|MANH/i.test(s.name))).toBe(false);
  });

  it('escola anexa: liga à escola sede já cadastrada', async () => {
    const sede = { id: 'unit-imp-emeif-indigena-kanhok', name: 'E.M.E.I.F INDÍGENA KANHÕK', gradesServed: [] } as unknown as SchoolUnit;
    const file = workbook(
      [[1, 'TAKAK KAYAPO', `18/06/${Y - 5}`, 'M', 'INDÍGENA', 'MOMOKRE', '-', 'NÃO', 'PRÉ I', 'MANHÃ', '', '']],
      { nome: 'E.M.E.I.F INDÍGENA NGÔNH-RE', inep: '15522385', decreto: 'Decreto 009/1999', tipo: 'ESCOLA ANEXA', sede: 'E.M.E.I.F INDÍGENA KANHÕK', endereco: 'Momokre', diretor: 'DIRETOR X' },
      'ESCOLA: E.M.E.I.F INDÍGENA NGÔNH-RE'
    );
    const [r] = (await parseFileResults(file, filters, [], [sede])) as any[];
    const u = r.suggestedSchoolUnit as SchoolUnit;
    expect(u.isAnnex).toBe(true);
    expect(u.type).toBe('ESCOLA_SATELITE');
    expect(u.parentUnitId).toBe(sede.id);
    expect(r.schoolCheck.isAnnex).toBe(true);
    expect(r.schoolCheck.parentUnitName).toBe('E.M.E.I.F INDÍGENA KANHÕK');
  });

  it('escola já cadastrada: a ficha só completa o que estiver vazio ou provisório', async () => {
    const existing = {
      id: 'unit-imp-emef-castro-alves',
      name: 'EMEF CASTRO ALVES',
      inepCode: 'Pendente de Regularização Censo',
      cnpjOrDecree: 'Pendente de Decreto / Ato de Criação',
      directorName: 'MARIA (corrigido à mão)',
      phone: '',
      address: 'Aguardando Informações Complementares da Secretaria',
      type: 'ESCOLA_POLO',
      createdViaImport: true,
      gradesServed: ['1º ANO'],
    } as unknown as SchoolUnit;
    const file = workbook(
      [[1, 'JOAO SILVA', `16/02/${Y - 9}`, 'M', 'PARDA', 'VILA', '-', 'NÃO', '4º ANO', 'INTEGRAL', '', '']],
      { nome: 'E.M.E.F CASTRO ALVES', inep: '15575160', tipo: 'ESCOLA RURAL', sede: 'E.M.I.E.I.F ERMINIO BRITO', endereco: 'ZONA RURAL', diretor: 'OUTRO NOME' },
      'ESCOLA: E.M.E.F CASTRO ALVES'
    );
    const [r] = (await parseFileResults(file, filters, [], [existing])) as any[];
    expect(r.schoolCheck.status).toBe('CADASTRADA');
    expect(r.fichaUpdatesRegisteredUnit).toBe(true);
    const u = r.suggestedSchoolUnit as SchoolUnit;
    expect(u.inepCode).toBe('15575160');
    expect(u.directorName).toBe('MARIA (corrigido à mão)'); // não sobrescreve o que foi corrigido
    expect(u.address).toBe('ZONA RURAL');
    expect(u.pendingFields).toContain('Ato de Autorização / Decreto');
    // Sede preenchida com tipo diferente de anexa: aviso, sem vínculo
    expect(u.isAnnex).toBeFalsy();
    expect(r.warnings.some((w: string) => w.includes('ESCOLA ANEXA'))).toBe(true);
  });
});

describe('duas anexas com o mesmo nome oficial', () => {
  const sede = { id: 'unit-imp-emieif-erminio-brito', name: 'E.M.I.E.I.F ERMINIO BRITO', gradesServed: [] } as unknown as SchoolUnit;
  const castro = {
    id: 'unit-imp-emef-castro-alves',
    name: 'E.M.E.F CASTRO ALVES',
    tradeName: 'ESCOLA CASTRO',
    inepCode: '15575160',
    type: 'ESCOLA_SATELITE',
    isAnnex: true,
    parentUnitId: sede.id,
    gradesServed: ['1º ANO', '2º ANO', '3º ANO'],
  } as unknown as SchoolUnit;
  const planilhaCanaa = () =>
    workbook(
      [[1, 'MARIA REBECA SILVA SOUSA', `05/09/${Y - 7}`, 'F', 'PARDA', 'VILA 490', '-', 'NÃO', '1º ANO', 'INTEGRAL', '', '']],
      { nome: 'E.M.E.F CASTRO ALVES', conhecida: 'ESCOLA CASTRO ALVES CANAÃ', inep: '15575160', tipo: 'ESCOLA ANEXA', sede: 'E.M.I.E.I.F ERMINIO BRITO', endereco: 'ZONA RURAL', diretor: 'CLEILDES' },
      'ESCOLA: E.M.E.F CASTRO ALVES'
    );

  it('nome de cadastro pelo nome conhecido', () => {
    expect(distinctSchoolName('E.M.E.F CASTRO ALVES', 'ESCOLA CASTRO ALVES CANAÃ')).toBe('E.M.E.F CASTRO ALVES CANAÃ');
    expect(distinctSchoolName('E.M.E.F CASTRO ALVES', 'ESCOLA CASTRO')).toBe('');
    expect(distinctSchoolName('E.M.E.F CASTRO ALVES', 'Escola Municipal Castro Alves')).toBe('');
  });

  it('a segunda anexa vira outra escola, ligada à mesma sede, sem juntar os alunos', async () => {
    const [r] = (await parseFileResults(planilhaCanaa(), filters, [], [sede, castro])) as any[];
    expect(r.errors).toEqual([]);
    const u = r.suggestedSchoolUnit as SchoolUnit;
    expect(u.id).not.toBe(castro.id);
    expect(u.name).toBe('E.M.E.F CASTRO ALVES CANAÃ');
    expect(u.tradeName).toBe('ESCOLA CASTRO ALVES CANAÃ');
    expect(u.parentUnitId).toBe(sede.id);
    expect(r.warnings.some((w: string) => w.includes('outra escola'))).toBe(true);
  });

  it('reimportar a mesma planilha usa a escola já separada', async () => {
    const canaa = { ...castro, id: 'unit-imp-emef-castro-alves-canaa', name: 'E.M.E.F CASTRO ALVES CANAÃ', tradeName: 'ESCOLA CASTRO ALVES CANAÃ' } as SchoolUnit;
    const [r] = (await parseFileResults(planilhaCanaa(), filters, [], [sede, castro, canaa])) as any[];
    expect(r.schoolCheck.status).toBe('CADASTRADA');
    expect((r.suggestedSchoolUnit as SchoolUnit).id).toBe(canaa.id);
  });

  it('a planilha da própria Castro Alves continua indo para ela', async () => {
    const file = workbook(
      [[1, 'ESTHER SILVERIO DIAS CHAGA', `10/03/${Y - 7}`, 'F', 'PARDA', 'VICINAL SILVANO', '-', 'NÃO', '1º ANO', 'INTEGRAL', '', '']],
      { nome: 'E.M.E.F CASTRO ALVES', conhecida: 'ESCOLA CASTRO', inep: '15575160', tipo: 'ESCOLA ANEXA', sede: 'E.M.I.E.I.F ERMINIO BRITO', endereco: 'ZONA RURAL', diretor: 'CLEILDES' },
      'ESCOLA: E.M.E.F CASTRO ALVES'
    );
    const [r] = (await parseFileResults(file, filters, [], [sede, castro])) as any[];
    expect((r.suggestedSchoolUnit as SchoolUnit).id).toBe(castro.id);
  });
});

describe('conferências da data de nascimento', () => {
  it('data impossível e idade fora da série', () => {
    expect(isImpossibleBirthDate('1018-11-14')).toBe(true);
    expect(isImpossibleBirthDate('2019-02-31')).toBe(true);
    expect(isImpossibleBirthDate(`${Y + 1}-01-01`)).toBe(true);
    expect(isImpossibleBirthDate('2018-11-14')).toBe(false);
    expect(isAgeFarFromGrade(`${Y - 5}-09-19`, '3º ANO', Y)).toBe(true); // 4 anos no 3º ano
    expect(isAgeFarFromGrade(`${Y - 34}-03-11`, '9º ANO', Y)).toBe(true); // adulto no 9º ano
    expect(isAgeFarFromGrade(`${Y - 11}-10-15`, '3º ANO', Y)).toBe(false); // atraso comum
    expect(isAgeFarFromGrade(`${Y - 5}-01-01`, 'MATERNAL', Y)).toBe(false);
  });

  it('salvar o cadastro tira as pendências de conferência', () => {
    const pend = ['CPF do Aluno', AGE_GRADE_PENDING, `${DUPLICATE_PENDING_PREFIX}: aparece também no PRÉ II (conferir a turma)`, 'Data de Nascimento'];
    expect(withoutReviewPendings(pend, '2018-11-14')).toEqual(['CPF do Aluno']);
    expect(withoutReviewPendings(pend, '1018-11-14')).toEqual(['CPF do Aluno', 'Data de Nascimento']);
    expect(isTooOldBirthDate('1018-11-14')).toBe(true);
    expect(isTooOldBirthDate('2018-11-14')).toBe(false);
  });
});
