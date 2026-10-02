import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Varredura de 02/10/2026: textos e números de exemplo que não podem voltar às telas reais.
const DISABLED_DIRS = ['omnideploy', 'nexusbuild', 'nexusdeployer', 'nexusinstall', 'cleanslate', 'instalaflow', 'debugflow', 'datasync', 'architecture'];
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return DISABLED_DIRS.includes(n) ? [] : files(p);
    return /\.(tsx?|ts)$/.test(n) ? [p] : [];
  });
}

// (Placeholders "Ex: ..." e dados do modo DEMO em src/data são permitidos.)
const FORBIDDEN = [
  "|| 'Colégio Horizonte do Saber",
  "|| 'VINC-SEMED-PA-001'",
  'Alternativa A (Gabarito',
  'IDEB Estimado',
  "cnpj: '38.452.190/0001-88'",
  "phone: '+55 (11) 98765-4321'",
  'Dados simulados ativos',
  'Turmas de exemplo ativas',
  'Cloud & Offline Ready',
  "|| 'Pendente de Atualização Cadastral'",
  ": '000.000.000-00';",
  "cpf: cpf || '000.000.000-00'",
  'assinado digitalmente',
  '(Meta Atingida)',
];

describe('sem dados fictícios nas telas', () => {
  const all = [...files('src/components'), 'src/data/defaultData.ts'];
  for (const text of FORBIDDEN) {
    it(`não contém "${text}"`, () => {
      const hits = all.filter((f) => readFileSync(f, 'utf8').includes(text));
      expect(hits).toEqual([]);
    });
  }
  it('sino não mostra número fixo', () => {
    expect(readFileSync('src/components/layout/Header.tsx', 'utf8')).not.toContain(": '6'}");
  });
});

describe('nomes dos módulos iguais aos do menu', () => {
  it('Hub de TI e ajuda não usam nomes inventados', () => {
    for (const f of ['src/components/admin/AdminTIHub.tsx', 'src/services/help/helpContent.ts', 'src/App.tsx']) {
      const s = readFileSync(f, 'utf8');
      for (const bad of ['Central de TI', 'CENTRAL DE TI', 'Central de Instalação', 'Controle de Acesso', 'Atualizações do Sistema']) {
        expect(s.includes(bad), `${f}: ${bad}`).toBe(false);
      }
    }
  });
});
