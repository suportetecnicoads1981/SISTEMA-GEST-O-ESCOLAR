import { describe, it, expect } from 'vitest';
import { hasCadastralPending } from '../src/utils/studentDocuments';

describe('pendência cadastral (regra única dos contadores)', () => {
  const ok = { cadastralStatus: 'OK', pendingFields: [], cpf: '529.982.247-25', medicalClassification: 'Não declarada' };
  it('cadastro completo não tem pendência', () => {
    expect(hasCadastralPending(ok)).toBe(false);
  });
  it('situação Incompleto, Pendência de Documentos ou Necessita Atualização contam', () => {
    for (const st of ['INCOMPLETE', 'PENDING_DOCS', 'NEEDS_UPDATE']) expect(hasCadastralPending({ ...ok, cadastralStatus: st })).toBe(true);
  });
  it('campo pendente na lista conta, mesmo com situação OK', () => {
    expect(hasCadastralPending({ ...ok, pendingFields: ['Endereço / Localidade'] })).toBe(true);
  });
  it('sem CPF (marcador 000.000.000-00 da importação) conta', () => {
    expect(hasCadastralPending({ ...ok, cpf: '000.000.000-00' })).toBe(true);
    expect(hasCadastralPending({ ...ok, cpf: '' })).toBe(true);
  });
  it('PCD sem laudo conta', () => {
    expect(hasCadastralPending({ ...ok, medicalClassification: 'TEA', hasMedicalReport: false })).toBe(true);
    expect(hasCadastralPending({ ...ok, medicalClassification: 'TEA', hasMedicalReport: true })).toBe(false);
  });
});
