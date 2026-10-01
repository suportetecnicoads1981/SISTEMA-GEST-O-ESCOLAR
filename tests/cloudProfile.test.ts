import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { cloudProfileFor, sameCloudProfile } from '../src/services/rbac/cloudProfile';

describe('perfil na nuvem a partir do cadastro de usuários', () => {
  it('Master: ADMIN; lotado numa escola: ESCOLA com a escola; Rede: o papel do cadastro', () => {
    expect(cloudProfileFor({ role: 'ADMIN', sector: 'MASTER', schoolUnitId: 'x' })).toEqual({ role: 'ADMIN' });
    expect(cloudProfileFor({ role: 'ADMIN', sector: 'SECRETARIA', schoolUnitId: 'unit-erminio' })).toEqual({ role: 'ESCOLA', schoolUnitId: 'unit-erminio' });
    expect(cloudProfileFor({ role: 'ADMIN', sector: 'COORDENACAO', schoolUnitId: '' })).toEqual({ role: 'ADMIN' });
    expect(cloudProfileFor({ role: 'TEACHER', sector: 'PROFESSOR', schoolUnitId: null })).toEqual({ role: 'TEACHER' });
  });
  it('mudar a lotação muda o perfil (a nuvem é atualizada ao salvar)', () => {
    const a = cloudProfileFor({ role: 'ADMIN', sector: 'SECRETARIA', schoolUnitId: 'A' });
    const b = cloudProfileFor({ role: 'ADMIN', sector: 'SECRETARIA', schoolUnitId: 'B' });
    expect(sameCloudProfile(a, b)).toBe(false);
    expect(sameCloudProfile(a, { ...a })).toBe(true);
  });
  it('função da nuvem aceita o perfil ESCOLA e nunca dá Master', () => {
    const fn = readFileSync(join(__dirname, '../supabase/functions/gerenciar-conta-nuvem/index.ts'), 'utf8');
    expect(fn).toContain("'ESCOLA'");
    expect(fn).toContain("m.master = base.master === true ? true : null");
    expect(fn).toContain('callerIsMaster');
  });
  it('migração do perfil ESCOLA: só lê e grava a escola e as anexas, sem excluir', () => {
    const sql = readFileSync(join(__dirname, '../supabase/migrations/20261001193755_perfil_escola_restrito_por_escola.sql'), 'utf8');
    expect(sql).toContain("coalesce(u.doc ->> 'parentUnitId', '') = public.current_app_school()");
    expect(sql).not.toMatch(/create policy escola_\w+ on public\.\w+ for delete/);
  });
});
