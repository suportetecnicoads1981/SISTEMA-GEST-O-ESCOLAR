// Escola sede (polo) e escolas anexas: vínculo, relatório conjunto e regras do cadastro.
import { describe, it, expect } from 'vitest';
import { annexesOf, parentOf, schoolGroupIds, unitDisplayName, annexLinkProblem, isAnnexUnit, chosenAnnexIds, totalsBySchool } from '../src/utils/schoolAnnexes';
import { schoolUnitPendings } from '../src/services/dataImportService';

const units = [
  { id: 'erminio', name: 'E.M.I.E.I.F ERMINIO BRITO' },
  { id: 'castro', name: 'E.M.E.F CASTRO ALVES', parentUnitId: 'erminio', isAnnex: true },
  { id: 'kanhok', name: 'E.M.E.I.F INDÍGENA KANHÕK' },
  { id: 'ngonhre', name: 'E.M.E.I.F INDÍGENA NGÔNH-RE', parentUnitId: 'kanhok', isAnnex: true },
  { id: 'zilda', name: 'E.M.E.F ZILDA PEREIRA' },
];

describe('escola sede e anexas', () => {
  it('acha as anexas e a sede', () => {
    expect(annexesOf('erminio', units).map((u) => u.id)).toEqual(['castro']);
    expect(annexesOf('zilda', units)).toEqual([]);
    expect(parentOf(units[1], units)?.id).toBe('erminio');
    expect(isAnnexUnit(units[3])).toBe(true);
    expect(isAnnexUnit(units[0])).toBe(false);
  });

  it('monta o grupo do relatório conjunto', () => {
    expect([...schoolGroupIds('kanhok', units, true)].sort()).toEqual(['kanhok', 'ngonhre']);
    expect([...schoolGroupIds('kanhok', units, false)]).toEqual(['kanhok']);
    expect(unitDisplayName(units[3], units)).toBe('E.M.E.I.F INDÍGENA NGÔNH-RE (anexa de E.M.E.I.F INDÍGENA KANHÕK)');
    expect(unitDisplayName(units[4], units)).toBe('E.M.E.F ZILDA PEREIRA');
  });

  it('valida a junção: sede obrigatória, não ela mesma, não anexa de anexa, sede com anexas não vira anexa', () => {
    expect(annexLinkProblem('zilda', '', units)).toMatch(/Escolha a escola sede/);
    expect(annexLinkProblem('zilda', 'zilda', units)).toMatch(/dela mesma/);
    expect(annexLinkProblem('zilda', 'castro', units)).toMatch(/já é anexa/);
    expect(annexLinkProblem('kanhok', 'erminio', units)).toMatch(/sede de uma anexa/);
    expect(annexLinkProblem('zilda', 'erminio', units)).toBe('');
    expect(annexLinkProblem(undefined, 'apagada', units)).toMatch(/não está mais cadastrada/);
  });

  it('pendências da escola recalculadas ao salvar', () => {
    const ok = { inepCode: '15575160', cnpjOrDecree: 'Decreto 1/2000', directorName: 'DIRETORA', phone: '(94) 99999-0000', address: 'VILA 490' };
    expect(schoolUnitPendings(ok)).toEqual([]);
    expect(schoolUnitPendings({ ...ok, inepCode: '' })).toEqual(['Código INEP Escolar']);
    expect(schoolUnitPendings({ ...ok, isAnnex: true })).toEqual(['Escola sede (escola anexa)']);
    expect(schoolUnitPendings({ ...ok, isAnnex: true, parentUnitId: 'erminio' })).toEqual([]);
  });
});

describe('sede com várias anexas: escolha e quadro totalizador', () => {
  const rede = [
    { id: 'sede', name: 'E.M.I.E.I.F ERMINIO BRITO' },
    { id: 'castro', name: 'E.M.E.F CASTRO ALVES', parentUnitId: 'sede' },
    { id: 'canaa', name: 'E.M.E.F CANAÃ', parentUnitId: 'sede' },
    { id: 'kanhok', name: 'E.M.E.I.F INDÍGENA KANHÕK' },
    { id: 'ngonh', name: 'E.M.E.I.F INDÍGENA NGÔNH-RE', parentUnitId: 'kanhok' },
  ];

  it('entra só a anexa marcada, e anexas de outra sede são ignoradas', () => {
    expect(chosenAnnexIds('sede', rede, ['canaa'])).toEqual(['canaa']);
    expect(chosenAnnexIds('sede', rede, ['canaa', 'castro'])).toEqual(['canaa', 'castro']);
    expect(chosenAnnexIds('sede', rede, ['ngonh'])).toEqual([]);
    expect(chosenAnnexIds('sede', rede, [])).toEqual([]);
    expect(chosenAnnexIds('ALL', rede, ['canaa'])).toEqual([]);
  });

  it('soma cada escola uma vez, na ordem dos blocos, e dá o total geral', () => {
    const conta = (rows: { ativo: boolean }[]) => ({ alunos: rows.length, ativos: rows.filter((r) => r.ativo).length });
    const { lines, total } = totalsBySchool(
      [
        { schoolUnitId: 'sede', rows: [{ ativo: true }, { ativo: true }] }, // turma A da sede
        { schoolUnitId: 'sede', rows: [{ ativo: false }] }, // turma B da sede
        { schoolUnitId: 'castro', rows: [{ ativo: true }] },
        { schoolUnitId: 'canaa', rows: [{ ativo: true }, { ativo: true }] },
      ],
      conta
    );
    expect(lines.map((l) => l.unitId)).toEqual(['sede', 'castro', 'canaa']);
    expect(lines[0].values).toEqual({ alunos: 3, ativos: 2 });
    expect(total).toEqual({ alunos: 6, ativos: 5 });
  });
});
