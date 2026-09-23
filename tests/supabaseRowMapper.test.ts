import { describe, expect, it } from 'vitest';
import {
  camelToSnake,
  fromRemoteRow,
  mergeRemoteIntoLocal,
  snakeToCamel,
  toRemoteRow,
} from '../src/services/datasync/supabaseRowMapper';

describe('conversão de nomes', () => {
  it('camelCase ↔ snake_case', () => {
    expect(camelToSnake('classId')).toBe('class_id');
    expect(camelToSnake('schoolUnitId')).toBe('school_unit_id');
    expect(snakeToCamel('class_id')).toBe('classId');
    expect(snakeToCamel('has_aee')).toBe('hasAee');
  });
});

describe('toRemoteRow', () => {
  it('converte campos, descarta colunas inexistentes e undefined', () => {
    const row = toRemoteRow('students', {
      id: 's1',
      name: 'Ana',
      registrationNumber: 'MAT-001',
      classId: 't1',
      birthDate: '2015-01-01',
      campoSoLocal: 'x',
      email: undefined,
    });
    expect(row).toEqual({ id: 's1', name: 'Ana', registration_number: 'MAT-001', class_id: 't1', birth_date: '2015-01-01' });
  });

  it('recusa aluno sem matrícula (coluna obrigatória)', () => {
    expect(toRemoteRow('students', { id: 's1', name: 'Ana' })).toBeNull();
  });

  it('recusa registro sem coluna obrigatória em vez de derrubar o lote', () => {
    expect(toRemoteRow('attendance_sheets', { id: 'a1', date: '2026-09-01' })).toBeNull();
    expect(toRemoteRow('attendance_sheets', { id: 'a1', classId: '' })).toBeNull();
    expect(toRemoteRow('attendance_sheets', { id: 'a1', classId: 't1' })).not.toBeNull();
  });
});

describe('fromRemoteRow', () => {
  it('converte para camelCase e ignora nulos', () => {
    expect(fromRemoteRow({ id: 's1', class_id: 't1', photo_url: null })).toEqual({ id: 's1', classId: 't1' });
  });
});

describe('mergeRemoteIntoLocal', () => {
  const local = [
    { id: 's1', name: 'Ana', classId: 't1', apelido: 'Aninha' },
    { id: 's2', name: 'Bruno', classId: 't2' },
  ];

  it('lista remota vazia não apaga os dados locais', () => {
    expect(mergeRemoteIntoLocal(local, [])).toBe(local);
    expect(mergeRemoteIntoLocal(local, null)).toBe(local);
  });

  it('atualiza por id, preserva campos só locais e registros só locais', () => {
    const merged = mergeRemoteIntoLocal(local, [
      { id: 's1', name: 'Ana Maria', class_id: null },
      { id: 's3', name: 'Carla', class_id: 't1' },
    ]);
    expect(merged).toHaveLength(3);
    expect(merged[0]).toEqual({ id: 's1', name: 'Ana Maria', classId: 't1', apelido: 'Aninha' });
    expect(merged[1]).toEqual(local[1]);
    expect(merged[2]).toEqual({ id: 's3', name: 'Carla', classId: 't1' });
  });
});
