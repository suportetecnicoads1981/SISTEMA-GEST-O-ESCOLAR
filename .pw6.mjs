import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('init')) {
    localStorage.setItem('sucessoedu_auth_session', 'true');
    localStorage.setItem('sucessoedu_logged_user_id', 'user-master-01');
    sessionStorage.setItem('init', '1');
  }
});
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERR', e.message));
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
await p.evaluate(() => {
  const k = 'sucessoedu_master_store_v5';
  const d = JSON.parse(localStorage.getItem(k));
  d.schoolUnits = [{ id: 'e-iron', name: 'EMEF IRON', type: 'ESCOLA' }, { id: 'e-castro', name: 'EMEF CASTRO ALVES', type: 'ESCOLA' }, { id: 'e-vazia', name: 'EMEF SEM ALUNOS', type: 'ESCOLA' }];
  d.classes = [{ id: 'c1', name: '1º ANO', gradeLevel: '1º Ano', shift: 'MANHA', schoolUnitId: 'e-castro' }];
  const st = (id, name, sc, cls) => ({ id, name, enrollmentNumber: 'RA-'+id, cpf: '000.000.000-00', birthDate: '2018-01-01', gender: 'F', phone: '', guardianName: '', guardianPhone: '', address: 'x', classId: cls||'', schoolUnitId: sc, status: 'ACTIVE', pendingFields: ['CPF / Certidão de Nascimento'], cadastralStatus: 'INCOMPLETE' });
  d.students = [st('a','ANA','e-iron'), st('b','BIA','', 'c1')];
  localStorage.setItem(k, JSON.stringify(d));
});
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
await p.getByText('Pular Tour').click().catch(()=>{});
await p.keyboard.press('Alt+s');
await p.waitForTimeout(1000);
await p.click('#btn-students-complement-sheet');
await p.waitForTimeout(800);
console.log('opções:', await p.locator('[data-testid=complement-school] option').allTextContents());
console.log('motivo:', await p.locator('[data-testid=complement-disabled-reason]').innerText().catch(()=>'-'));
await p.selectOption('[data-testid=complement-school]', 'e-castro');
await p.waitForTimeout(300);
console.log('habilitado (aluno só pela turma):', await p.isEnabled('[data-testid=complement-download]'));
await b.close();
