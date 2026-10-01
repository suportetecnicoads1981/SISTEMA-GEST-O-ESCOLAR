// Aluno que já está matriculado numa escola e aparece na planilha de OUTRA escola:
// a importação não transfere sozinha; ele fica onde está, com pendência para a Secretaria conferir.
import { it, expect } from 'vitest';
import {
  convertImportedStudentsToOfficial,
  DEFAULT_IMPORT_FILTERS,
  isEnrolledInOtherSchool,
  OTHER_SCHOOL_PENDING_PREFIX,
} from '../src/services/dataImportService';
import { withoutReviewPendings } from '../src/utils/studentDocuments';
import type { SchoolUnit, Student } from '../src/types';

const ruth = { id: 'unit-ruth', name: 'E.M.E.I RUTH' } as SchoolUnit;
const prisse = { id: 'unit-prisse', name: 'E.M.I.E.I PRISSE', city: 'CUMARU DO NORTE', state: 'PA', zipCode: '68398-000' } as SchoolUnit;
const existente = {
  id: 'std-1', name: 'LAVINIA TESTE', birthDate: '2021-02-05', enrollmentNumber: 'RA-2026-0867',
  schoolUnitId: 'unit-ruth', classId: 'class-ruth-pre-2-c', series: 'PRÉ II', pendingFields: ['CPF / Certidão de Nascimento'], cadastralStatus: 'INCOMPLETE',
} as unknown as Student;
const item = (unit: string) => ({
  name: 'LAVINIA TESTE', birthDate: '2021-02-05', series: 'PRÉ II', shift: 'INTEGRAL', schoolUnitId: unit, schoolName: 'E.M.I.E.I PRISSE',
  pendingFields: [], cadastralStatus: 'INCOMPLETE', selectedForImport: true, sourceFileName: 'prisse.xlsx',
}) as any;

it('não transfere aluno de outra escola e deixa pendência para conferir', () => {
  expect(isEnrolledInOtherSchool(existente, 'unit-prisse')).toBe(true);
  expect(isEnrolledInOtherSchool(existente, 'unit-ruth')).toBe(false);
  const [s] = convertImportedStudentsToOfficial([item('unit-prisse')], DEFAULT_IMPORT_FILTERS, [], 0, prisse, [], [ruth, prisse], [existente]);
  expect(s.id).toBe('std-1');
  expect(s.schoolUnitId).toBe('unit-ruth');
  expect(s.classId).toBe('class-ruth-pre-2-c');
  expect(s.enrollmentNumber).toBe('RA-2026-0867');
  const p = s.pendingFields!.find((f) => f.startsWith(OTHER_SCHOOL_PENDING_PREFIX))!;
  expect(p).toContain('E.M.I.E.I PRISSE');
  expect(p).toContain('PRÉ II');
  // Importar de novo não repete a pendência
  const [s2] = convertImportedStudentsToOfficial([item('unit-prisse')], DEFAULT_IMPORT_FILTERS, [], 0, prisse, [], [ruth, prisse], [s]);
  expect(s2.pendingFields!.filter((f) => f.startsWith(OTHER_SCHOOL_PENDING_PREFIX))).toHaveLength(1);
  // Ao salvar o cadastro conferido, a pendência sai
  expect(withoutReviewPendings(s.pendingFields, s.birthDate).some((f) => f.startsWith(OTHER_SCHOOL_PENDING_PREFIX))).toBe(false);
});

it('reimportar a planilha da própria escola continua atualizando o aluno', () => {
  const [s] = convertImportedStudentsToOfficial([item('unit-ruth')], DEFAULT_IMPORT_FILTERS, [], 0, ruth, [], [ruth, prisse], [existente]);
  expect(s.id).toBe('std-1');
  expect(s.pendingFields!.some((f) => f.startsWith(OTHER_SCHOOL_PENDING_PREFIX))).toBe(false);
});
