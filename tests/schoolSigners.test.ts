import { describe, it, expect, beforeEach } from 'vitest';
import {
  splitPersonNames,
  joinPersonNames,
  setDocumentBranding,
  setDocumentSignContext,
  schoolSigners,
  signersForModule,
  issuerFooterHtml,
} from '../src/services/documentBranding';

describe('nomes de vários responsáveis no mesmo campo', () => {
  it('separa duas coordenadoras ligadas por "e" (maiúsculo ou minúsculo)', () => {
    expect(splitPersonNames('Simone Menezes e Wandicleia Mota de Medeiros')).toEqual(['Simone Menezes', 'Wandicleia Mota de Medeiros']);
    expect(splitPersonNames('CLAUDIA HELENA FERREIRA DA S. GAMA E ROSIMAR SALINOS ALVES')).toEqual([
      'CLAUDIA HELENA FERREIRA DA S. GAMA',
      'ROSIMAR SALINOS ALVES',
    ]);
  });
  it('aceita vírgula, ponto e vírgula e barra', () => {
    expect(splitPersonNames('Ana Lima, Bia Souza e Caio Dias')).toEqual(['Ana Lima', 'Bia Souza', 'Caio Dias']);
    expect(splitPersonNames('Ana Lima; Bia Souza')).toEqual(['Ana Lima', 'Bia Souza']);
    expect(splitPersonNames('Ana Lima / Bia Souza')).toEqual(['Ana Lima', 'Bia Souza']);
  });
  it('não quebra um nome só', () => {
    expect(splitPersonNames('Maria do Socorro Borges')).toEqual(['Maria do Socorro Borges']);
    expect(splitPersonNames('')).toEqual([]);
  });
  it('junta para gravar', () => {
    expect(joinPersonNames(['A Silva', 'B Souza'])).toBe('A Silva e B Souza');
    expect(joinPersonNames(['A Silva', ' ', 'B Souza', 'C Dias'])).toBe('A Silva, B Souza e C Dias');
    expect(joinPersonNames(['A Silva'])).toBe('A Silva');
  });
});

describe('assinatura da escola nos documentos', () => {
  beforeEach(() => {
    setDocumentBranding({
      secretary: { secretaryDirector: 'Augusta (Secretária Municipal de Educação)' } as any,
      schoolUnits: [
        {
          id: 'u1',
          name: 'ESCOLA PRISSE',
          directorName: 'Tereza Leal dos Santos Conceição',
          coordinatorName: 'Simone Menezes e Wandicleia Mota de Medeiros',
          secretaryName: 'Ana Maria Alves Lopes Ferreira',
        } as any,
        { id: 'u2', name: 'ESCOLA SEM COORD', directorName: 'Diretora Dois' } as any,
      ],
    });
  });
  it('pedagógico: uma linha para cada coordenadora', () => {
    setDocumentSignContext(signersForModule('PEDAGOGICAL_DASHBOARD'));
    const s = schoolSigners({ schoolUnitId: 'u1' });
    expect(s.map((x) => x.name)).toEqual(['Simone Menezes', 'Wandicleia Mota de Medeiros']);
    expect(s.every((x) => x.role === 'Coordenador(a) Pedagógico(a)')).toBe(true);
  });
  it('Secretaria: secretário(a) escolar e direção', () => {
    setDocumentSignContext(signersForModule('STUDENTS'));
    expect(schoolSigners({ schoolUnitId: 'u1' }).map((x) => x.role)).toEqual(['Secretário(a) Escolar', 'Diretor(a) Escolar']);
  });
  it('sem coordenador cadastrado: assina a direção', () => {
    setDocumentSignContext(['COORDENACAO']);
    expect(schoolSigners({ schoolUnitId: 'u2' })).toEqual([{ name: 'Diretora Dois', role: 'Diretor(a) Escolar' }]);
  });
  it('relatório da rede (sem escola): assina a Secretaria de Educação', () => {
    setDocumentSignContext(['COORDENACAO']);
    expect(schoolSigners({})).toEqual([]);
    expect(issuerFooterHtml(true, {})).toContain('Augusta');
    expect(issuerFooterHtml(true, { schoolUnitId: 'u1' })).toContain('Wandicleia Mota de Medeiros');
    expect(issuerFooterHtml(true, { schoolUnitId: 'u1' })).not.toContain('Augusta');
  });
});
