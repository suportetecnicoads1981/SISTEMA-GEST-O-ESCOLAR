import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { keepLocalPasswords } from '../src/services/offline/localServerSync';

const ps = readFileSync(join(__dirname, '../public/offline/servidor_sucessoedu.ps1'), 'utf8');

describe('resumos de senha ficam só no servidor da escola', () => {
  it('servidor entrega o banco às estações sem os resumos (o próprio computador do servidor recebe tudo)', () => {
    expect(ps).toContain("if ($null -ne $ctx -and [System.Net.IPAddress]::IsLoopback($ctx.Request.RemoteEndPoint.Address)) { $data = $script:DataText }");
    expect(ps).toContain('else { $data = Get-PublicDataText }');
    expect(ps).toContain("$u['password'] = $null");
    expect(ps).toContain("$u['passwordOnServer'] = $true");
    expect(ps).toContain('(Get-StoreJson $ctx)');
  });

  it('gravação vinda da estação sem senha não apaga a senha do servidor', () => {
    expect(ps).toContain("if ($k -eq 'userAccounts') { Restore-UserPasswords $v (Get-WorkValue $work $db $k) }");
    expect(ps).toContain('Restore-UserPassword $val $prev');
    expect(ps).toContain("Restore-UserPasswords (Get-Val $incoming 'userAccounts') (Get-Val (Get-DbObject) 'userAccounts')");
  });

  it('a estação guarda o resumo só de quem já entrou nela', () => {
    const server = {
      userAccounts: [
        { id: 'davi', name: 'Davi', password: null, passwordOnServer: true },
        { id: 'marcia', name: 'Marcia', password: null, passwordOnServer: true },
        { id: 'novo', name: 'Novo' },
      ],
    };
    const local = {
      userAccounts: [
        { id: 'davi', password: 'sha256$5000$a$b' },
        { id: 'marcia', password: 'sha256$5000$c$d' }, // cópia antiga com o resumo de todos
      ],
    };
    const out = keepLocalPasswords(server, local, new Set(['davi']));
    const byId = new Map<string, any>(out.userAccounts.map((u: any) => [u.id, u]));
    expect(byId.get('davi').password).toBe('sha256$5000$a$b');
    expect(byId.get('marcia').password).toBeNull(); // nunca entrou aqui: some da estação
    expect(byId.get('novo').password).toBeUndefined();
  });

  it('sem cadastro de usuários no pacote, nada muda', () => {
    const data = { students: [] };
    expect(keepLocalPasswords(data, null, new Set())).toBe(data);
  });

  it('a marca passwordOnServer não vai para a nuvem', () => {
    const tables = readFileSync(join(__dirname, '../src/services/sync/syncTables.ts'), 'utf8');
    expect(tables).toContain('const { password, passwordOnServer, isMaster, ...rest } = u || {};');
  });
});
