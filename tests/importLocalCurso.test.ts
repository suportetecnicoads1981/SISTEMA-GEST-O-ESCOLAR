import { describe, it, expect } from 'vitest';
import { courseIdForSeries, studentLocationFromUnit } from '../src/services/dataImportService';

describe('Importador: cidade/CEP do aluno vêm da escola', () => {
  const escola = { city: 'CUMARU DO NORTE', state: 'pa', zipCode: '68398-000' };
  it('usa cidade, UF e CEP da escola quando a planilha não traz', () => {
    expect(studentLocationFromUnit(undefined, escola)).toEqual({ city: 'CUMARU DO NORTE', state: 'PA', zipCode: '68398-000' });
  });
  it('mantém a cidade da planilha quando informada', () => {
    expect(studentLocationFromUnit('Redenção', escola).city).toBe('Redenção');
  });
  it('nunca grava Belém/66000-000 fixos', () => {
    const r = studentLocationFromUnit('', undefined);
    expect(r.city).toBe('');
    expect(r.zipCode).toBe('');
  });
});

describe('Importador: curso pela série', () => {
  it.each([
    ['PRÉ-ESCOLA I', 'course-ei'],
    ['Pré II', 'course-ei'],
    ['MATERNAL', 'course-ei'],
    ['1º ANO', 'course-ef1'],
    ['5º ANO', 'course-ef1'],
    ['6º ANO', 'course-ef2'],
    ['9º ANO', 'course-ef2'],
    ['9 ANO', 'course-ef2'],
    ['1ª SÉRIE ENSINO MÉDIO', 'course-em'],
  ])('%s → %s', (serie, curso) => {
    expect(courseIdForSeries(serie)).toBe(curso);
  });
});
