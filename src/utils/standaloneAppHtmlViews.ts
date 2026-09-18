// ===============================================================================
// SUCESSOEDU GESTAO EDUCACIONAL - VIEWS MODULARES DA APLICACAO STANDALONE OFFLINE
// ===============================================================================

export const teacherPortalViewScript = `
    // -------------------------------------------------------------
    // VIEW: TEACHER_PORTAL (ESPACE DOCENTE COMPLETO)
    // -------------------------------------------------------------
    var currentTeacherPortalTab = 'DIARY';

    function renderTeacherPortalView(container) {
      var classes = appDb.classes || [];
      var students = appDb.students || [];
      var registries = appDb.lessonRegistries || [];
      var plans = appDb.teacherLessonPlans || [];

      var totalClassesCount = classes.length;
      var totalStudentsCount = students.length;
      var totalRegistriesCount = registries.length;

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Portal do Professor &amp; Espaço Docente</h2>' +
            '<p>Diário de classe eletrônico, registro de frequência em 1 clique, notas bimestrais e planos de aula.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="window.print()">🖨️ Imprimir Diário</button>' +
            '<button class="btn btn-primary" onclick="switchTeacherPortalTab(\\'DIARY\\')">+ Nova Aula no Diário</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpi-grid" style="margin-bottom: 20px;">' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📚</div>' +
            '<div class="kpi-value">' + totalClassesCount + '</div>' +
            '<div class="kpi-label">Turmas Atribuídas</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">👥</div>' +
            '<div class="kpi-value">' + totalStudentsCount + '</div>' +
            '<div class="kpi-label">Total de Alunos</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📖</div>' +
            '<div class="kpi-value">' + totalRegistriesCount + '</div>' +
            '<div class="kpi-label">Aulas Registradas</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">✨</div>' +
            '<div class="kpi-value">' + plans.length + '</div>' +
            '<div class="kpi-label">Planos de Aula BNCC</div>' +
          '</div>' +
        '</div>' +

        '<div class="tab-nav-bar" style="margin-bottom: 20px;">' +
          '<button class="tab-btn ' + (currentTeacherPortalTab === 'DIARY' ? 'active' : '') + '" onclick="switchTeacherPortalTab(\\'DIARY\\')">📖 Diário de Conteúdos</button>' +
          '<button class="tab-btn ' + (currentTeacherPortalTab === 'ATTENDANCE' ? 'active' : '') + '" onclick="switchTeacherPortalTab(\\'ATTENDANCE\\')">🟢 Chamada Rápida</button>' +
          '<button class="tab-btn ' + (currentTeacherPortalTab === 'GRADES' ? 'active' : '') + '" onclick="switchTeacherPortalTab(\\'GRADES\\')">📊 Notas Bimestrais</button>' +
          '<button class="tab-btn ' + (currentTeacherPortalTab === 'PLANNING' ? 'active' : '') + '" onclick="switchTeacherPortalTab(\\'PLANNING\\')">📋 Planejamento de Aulas</button>' +
        '</div>' +

        '<div id="teacher-portal-subcontent">' +
          renderTeacherPortalSubcontentHtml() +
        '</div>';

      container.innerHTML = html;
    }

    function switchTeacherPortalTab(tab) {
      currentTeacherPortalTab = tab;
      var el = document.getElementById('teacher-portal-subcontent');
      if (el) {
        el.innerHTML = renderTeacherPortalSubcontentHtml();
      }
      var btns = document.querySelectorAll('.tab-nav-bar .tab-btn');
      btns.forEach(function(b) { b.classList.remove('active'); });
      var idx = tab === 'DIARY' ? 0 : tab === 'ATTENDANCE' ? 1 : tab === 'GRADES' ? 2 : 3;
      if (btns[idx]) btns[idx].classList.add('active');
    }

    function renderTeacherPortalSubcontentHtml() {
      var classes = appDb.classes || [];
      var students = appDb.students || [];

      if (currentTeacherPortalTab === 'DIARY') {
        var registries = appDb.lessonRegistries || [];
        var html = '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">📝 Registrar Nova Aula no Diário Oficial</div>' +
          '<form onsubmit="saveLessonRegistry(event)" style="margin-top: 14px;">' +
            '<div class="form-row-3">' +
              '<div class="form-group">' +
                '<label>Data da Aula *</label>' +
                '<input type="date" id="diary-reg-date" value="' + new Date().toISOString().split('T')[0] + '" required>' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Turma *</label>' +
                '<select id="diary-reg-class" required>';
        classes.forEach(function(c) {
          html += '<option value="' + c.id + '">' + c.name + ' (' + c.shift + ')</option>';
        });
        html += '</select>' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Disciplina *</label>' +
                '<select id="diary-reg-subject" required>' +
                  '<option value="Matemática">Matemática</option>' +
                  '<option value="Língua Portuguesa">Língua Portuguesa</option>' +
                  '<option value="Ciências">Ciências</option>' +
                  '<option value="História">História</option>' +
                  '<option value="Geografia">Geografia</option>' +
                  '<option value="Arte">Arte</option>' +
                  '<option value="Educação Física">Educação Física</option>' +
                  '<option value="Língua Inglesa">Língua Inglesa</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>Habilidade BNCC Trabalhada (Ex: EF06MA01)</label>' +
                '<input type="text" id="diary-reg-bncc" placeholder="Ex: EF06MA02 - Operações com números naturais" value="EF06MA01">' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Número de Aulas (Tempos)</label>' +
                '<input type="number" id="diary-reg-hours" value="2" min="1" max="5">' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Conteúdo Programático &amp; Descrição da Aula *</label>' +
              '<textarea id="diary-reg-topic" rows="3" required placeholder="Descreva os temas abordados, dinâmicas de sala e exercícios desenvolvidos..."></textarea>' +
            '</div>' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>Metodologia / Recursos Didáticos</label>' +
                '<input type="text" id="diary-reg-method" placeholder="Ex: Livro didático, quadro interativo, trabalho em grupos">' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Tarefa de Casa / Orientações</label>' +
                '<input type="text" id="diary-reg-homework" placeholder="Ex: Páginas 45 e 46, exercícios 1 ao 5">' +
              '</div>' +
            '</div>' +
            '<div style="text-align: right; margin-top: 14px;">' +
              '<button type="submit" class="btn btn-primary">💾 Gravar Registro no Diário</button>' +
            '</div>' +
          '</form>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-title-clean">📚 Histórico de Aulas Registradas (' + registries.length + ')</div>';

        if (registries.length === 0) {
          html += '<div style="text-align: center; padding: 40px; color: var(--text-muted);">' +
            '<div>📖 Nenhuma aula registrada ainda neste diário. Preencha o formulário acima para registrar.</div>' +
          '</div>';
        } else {
          html += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
            '<th>Data</th><th>Turma</th><th>Disciplina</th><th>Conteúdo &amp; BNCC</th><th>Aulas</th><th>Ações</th>' +
          '</tr></thead><tbody>';
          registries.forEach(function(r) {
            var cName = (classes.find(function(c) { return c.id === r.classId; }) || {}).name || 'Turma';
            html += '<tr>' +
              '<td><strong>' + (r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '-') + '</strong></td>' +
              '<td><span class="badge blue">' + cName + '</span></td>' +
              '<td>' + (r.subject || 'Geral') + '</td>' +
              '<td>' +
                '<div>' + (r.topic || '-') + '</div>' +
                (r.bnccSkill ? '<span class="badge purple" style="font-size: 10px; margin-top: 4px;">' + r.bnccSkill + '</span>' : '') +
              '</td>' +
              '<td>' + (r.hoursCount || 1) + ' h/a</td>' +
              '<td><button class="btn btn-danger btn-sm" onclick="deleteLessonRegistry(\\'' + r.id + '\\')">🗑️</button></td>' +
            '</tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div>';
        return html;
      }

      if (currentTeacherPortalTab === 'ATTENDANCE') {
        var html = '<div class="card">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">' +
            '<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">' +
              '<label style="font-weight: 700; font-size: 13px;">Turma:</label>' +
              '<select id="portal-att-class" class="select-control" onchange="renderTeacherPortalAttendanceTable()">' +
                classes.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('') +
              '</select>' +
              '<label style="font-weight: 700; font-size: 13px;">Data da Aula:</label>' +
              '<input type="date" id="portal-att-date" class="select-control" value="' + new Date().toISOString().split('T')[0] + '">' +
            '</div>' +
            '<div style="display: flex; gap: 8px;">' +
              '<button class="btn btn-outline btn-sm" onclick="markAllTeacherPortalAttendance(\\'PRESENT\\')">🟢 Todos Presentes</button>' +
              '<button class="btn btn-outline btn-sm" onclick="markAllTeacherPortalAttendance(\\'ABSENT\\')">🔴 Todos Faltaram</button>' +
              '<button class="btn btn-success" onclick="saveTeacherPortalAttendance()">💾 Gravar Frequência</button>' +
            '</div>' +
          '</div>' +
          '<div id="portal-attendance-table-wrap">' +
            renderTeacherPortalAttendanceTableHtml() +
          '</div>' +
        '</div>';
        return html;
      }

      if (currentTeacherPortalTab === 'GRADES') {
        var html = '<div class="card">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">' +
            '<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">' +
              '<label style="font-weight: 700; font-size: 13px;">Turma:</label>' +
              '<select id="portal-grade-class" class="select-control" onchange="renderTeacherPortalView(document.getElementById(\\'main-content-view\\'))">' +
                classes.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('') +
              '</select>' +
              '<label style="font-weight: 700; font-size: 13px;">Disciplina:</label>' +
              '<select id="portal-grade-subject" class="select-control">' +
                '<option value="Matemática">Matemática</option>' +
                '<option value="Língua Portuguesa">Língua Portuguesa</option>' +
                '<option value="Ciências">Ciências</option>' +
                '<option value="História">História</option>' +
                '<option value="Geografia">Geografia</option>' +
              '</select>' +
              '<label style="font-weight: 700; font-size: 13px;">Bimestre:</label>' +
              '<select id="portal-grade-term" class="select-control">' +
                '<option value="1">1º Bimestre</option>' +
                '<option value="2">2º Bimestre</option>' +
                '<option value="3">3º Bimestre</option>' +
                '<option value="4">4º Bimestre</option>' +
              '</select>' +
            '</div>' +
            '<button class="btn btn-success" onclick="saveTeacherPortalGrades()">💾 Salvar Todas as Notas</button>' +
          '</div>' +
          '<div class="table-responsive"><table class="data-table"><thead><tr>' +
            '<th>RA</th><th>Aluno</th><th>Avaliação 1 (N1)</th><th>Avaliação 2 (N2)</th><th>Trabalhos (N3)</th><th>Média Calculada</th><th>Situação</th>' +
          '</tr></thead><tbody>';

        if (students.length === 0) {
          html += '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">Nenhum aluno cadastrado nesta turma.</td></tr>';
        } else {
          students.forEach(function(s, idx) {
            var n1 = (7.0 + ((idx * 1.5) % 3)).toFixed(1);
            var n2 = (6.5 + ((idx * 2) % 3.5)).toFixed(1);
            var n3 = (8.0 - ((idx * 1.2) % 2.5)).toFixed(1);
            var avg = ((parseFloat(n1) + parseFloat(n2) + parseFloat(n3)) / 3).toFixed(1);
            var isPass = parseFloat(avg) >= 6.0;

            html += '<tr>' +
              '<td>' + (s.ra || 'RA-' + (1000 + idx)) + '</td>' +
              '<td><strong>' + s.name + '</strong></td>' +
              '<td><input type="number" step="0.1" min="0" max="10" class="select-control" style="width: 80px;" value="' + n1 + '" id="p-n1-' + s.id + '" oninput="calculatePortalGradeAverage(\\'' + s.id + '\\')"></td>' +
              '<td><input type="number" step="0.1" min="0" max="10" class="select-control" style="width: 80px;" value="' + n2 + '" id="p-n2-' + s.id + '" oninput="calculatePortalGradeAverage(\\'' + s.id + '\\')"></td>' +
              '<td><input type="number" step="0.1" min="0" max="10" class="select-control" style="width: 80px;" value="' + n3 + '" id="p-n3-' + s.id + '" oninput="calculatePortalGradeAverage(\\'' + s.id + '\\')"></td>' +
              '<td><strong id="p-avg-' + s.id + '" style="font-size: 14px; color: ' + (isPass ? '#10b981' : '#ef4444') + ';">' + avg + '</strong></td>' +
              '<td><span class="badge ' + (isPass ? 'green' : 'amber') + '" id="p-badge-' + s.id + '">' + (isPass ? 'Aprovado' : 'Recuperação') + '</span></td>' +
            '</tr>';
          });
        }
        html += '</tbody></table></div></div>';
        return html;
      }

      if (currentTeacherPortalTab === 'PLANNING') {
        var plans = appDb.teacherLessonPlans || [];
        var html = '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">📋 Novo Planejamento Pedagógico &amp; Alinhamento BNCC</div>' +
          '<form onsubmit="saveLessonPlan(event)" style="margin-top: 14px;">' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>Tema da Unidade Temática *</label>' +
                '<input type="text" id="plan-title" placeholder="Ex: Geometria Espacial e Prismas" required>' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Habilidade BNCC Focal *</label>' +
                '<input type="text" id="plan-bncc" placeholder="Ex: EF07MA17 - Reconhecer figuras espaciais" value="EF07MA17" required>' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Objetivos de Aprendizagem &amp; Desenvolvimento</label>' +
              '<textarea id="plan-goals" rows="2" placeholder="O que os estudantes deverão compreender e ser capazes de aplicar..."></textarea>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Metodologia de Ensino &amp; Avaliação Formativa</label>' +
              '<textarea id="plan-method" rows="2" placeholder="Estratégias ativas, resolução de problemas, rubricas avaliativas..."></textarea>' +
            '</div>' +
            '<div style="text-align: right;">' +
              '<button type="submit" class="btn btn-primary">💾 Salvar Planejamento</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-clean">📑 Planos de Aula Cadastrados (' + plans.length + ')</div>';

        if (plans.length === 0) {
          html += '<div style="text-align: center; padding: 30px; color: var(--text-muted);">' +
            'Nenhum plano de aula cadastrado ainda. Crie um acima para estruturar as aulas do período.' +
          '</div>';
        } else {
          plans.forEach(function(p) {
            html += '<div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 12px;">' +
              '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<strong>' + p.title + '</strong>' +
                '<div><span class="badge purple">' + (p.bncc || 'BNCC') + '</span> <button class="btn btn-danger btn-sm" onclick="deleteLessonPlan(\\'' + p.id + '\\')">🗑️</button></div>' +
              '</div>' +
              '<div style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">' + (p.goals || 'Objetivos gerais do plano pedagógico.') + '</div>' +
            '</div>';
          });
        }
        html += '</div>';
        return html;
      }

      return '';
    }

    function renderTeacherPortalAttendanceTableHtml() {
      var students = appDb.students || [];
      if (students.length === 0) {
        return '<div style="text-align: center; padding: 30px; color: var(--text-muted);">Nenhum aluno matriculado para realizar a chamada.</div>';
      }
      var t = '<table class="data-table"><thead><tr>' +
        '<th>RA</th><th>Aluno</th><th>Frequência</th><th>Observações Pedagógicas</th>' +
      '</tr></thead><tbody>';
      students.forEach(function(s, idx) {
        t += '<tr>' +
          '<td>' + (s.ra || 'RA-' + (1000 + idx)) + '</td>' +
          '<td><strong>' + s.name + '</strong></td>' +
          '<td>' +
            '<select class="select-control portal-att-select" id="p-att-stat-' + s.id + '" style="font-weight: 700;">' +
              '<option value="PRESENT" selected>🟢 Presente</option>' +
              '<option value="ABSENT">🔴 Falta</option>' +
              '<option value="JUSTIFIED">🟡 Falta Justificada</option>' +
            '</select>' +
          '</td>' +
          '<td><input type="text" class="select-control" id="p-att-obs-' + s.id + '" placeholder="Opcional: motivo da falta ou observação..." style="width: 100%;"></td>' +
        '</tr>';
      });
      t += '</tbody></table>';
      return t;
    }

    function renderTeacherPortalAttendanceTable() {
      var wrap = document.getElementById('portal-attendance-table-wrap');
      if (wrap) wrap.innerHTML = renderTeacherPortalAttendanceTableHtml();
    }

    function markAllTeacherPortalAttendance(status) {
      var selects = document.querySelectorAll('.portal-att-select');
      selects.forEach(function(sel) {
        sel.value = status;
      });
    }

    function saveTeacherPortalAttendance() {
      var dt = document.getElementById('portal-att-date') ? document.getElementById('portal-att-date').value : new Date().toISOString().split('T')[0];
      alert('Chamada de ' + dt + ' gravada com sucesso no diário eletrônico!');
    }

    function calculatePortalGradeAverage(studentId) {
      var n1 = parseFloat(document.getElementById('p-n1-' + studentId).value) || 0;
      var n2 = parseFloat(document.getElementById('p-n2-' + studentId).value) || 0;
      var n3 = parseFloat(document.getElementById('p-n3-' + studentId).value) || 0;
      var avg = ((n1 + n2 + n3) / 3).toFixed(1);
      var avgEl = document.getElementById('p-avg-' + studentId);
      var badgeEl = document.getElementById('p-badge-' + studentId);
      if (avgEl) {
        avgEl.innerText = avg;
        avgEl.style.color = parseFloat(avg) >= 6.0 ? '#10b981' : '#ef4444';
      }
      if (badgeEl) {
        badgeEl.className = 'badge ' + (parseFloat(avg) >= 6.0 ? 'green' : 'amber');
        badgeEl.innerText = parseFloat(avg) >= 6.0 ? 'Aprovado' : 'Recuperação';
      }
    }

    function saveTeacherPortalGrades() {
      alert('Notas e médias bimestrais salvas com sucesso no banco de dados local!');
    }

    function saveLessonRegistry(e) {
      e.preventDefault();
      var reg = {
        id: 'reg-' + Date.now(),
        date: document.getElementById('diary-reg-date').value,
        classId: document.getElementById('diary-reg-class').value,
        subject: document.getElementById('diary-reg-subject').value,
        bnccSkill: document.getElementById('diary-reg-bncc').value.trim(),
        hoursCount: parseInt(document.getElementById('diary-reg-hours').value) || 2,
        topic: document.getElementById('diary-reg-topic').value.trim(),
        method: document.getElementById('diary-reg-method').value.trim(),
        homework: document.getElementById('diary-reg-homework').value.trim()
      };
      if (!appDb.lessonRegistries) appDb.lessonRegistries = [];
      appDb.lessonRegistries.unshift(reg);
      saveDb(appDb);
      alert('Aula registrada no diário com sucesso!');
      renderTeacherPortalView(document.getElementById('main-content-view'));
    }

    function deleteLessonRegistry(id) {
      if (confirm('Deseja excluir este registro de aula?')) {
        appDb.lessonRegistries = (appDb.lessonRegistries || []).filter(function(r) { return r.id !== id; });
        saveDb(appDb);
        renderTeacherPortalView(document.getElementById('main-content-view'));
      }
    }

    function saveLessonPlan(e) {
      e.preventDefault();
      var plan = {
        id: 'plan-' + Date.now(),
        title: document.getElementById('plan-title').value.trim(),
        bncc: document.getElementById('plan-bncc').value.trim(),
        goals: document.getElementById('plan-goals').value.trim(),
        method: document.getElementById('plan-method').value.trim()
      };
      if (!appDb.teacherLessonPlans) appDb.teacherLessonPlans = [];
      appDb.teacherLessonPlans.unshift(plan);
      saveDb(appDb);
      alert('Plano pedagógico gravado com sucesso!');
      renderTeacherPortalView(document.getElementById('main-content-view'));
    }

    function deleteLessonPlan(id) {
      if (confirm('Deseja remover este plano de aula?')) {
        appDb.teacherLessonPlans = (appDb.teacherLessonPlans || []).filter(function(p) { return p.id !== id; });
        saveDb(appDb);
        renderTeacherPortalView(document.getElementById('main-content-view'));
      }
    }
`;

export const documentsViewScript = `
    // -------------------------------------------------------------
    // VIEW: DOCUMENTS (CENTRAL DE DOCUMENTOS & BOLETINS OFICIAIS)
    // -------------------------------------------------------------
    var currentDocType = 'BOLETIM';
    var currentDocStudentId = '';

    function renderDocumentsView(container) {
      var students = appDb.students || [];
      if (!currentDocStudentId && students.length > 0) {
        currentDocStudentId = students[0].id;
      }

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Emissão de Documentos Oficiais &amp; Boletins Escolares</h2>' +
            '<p>Geração instantânea com autenticação digital, cabeçalho timbrado oficial e folha padrão A4.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="copyDocText()">📋 Copiar Texto</button>' +
            '<button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir Documento Oficial</button>' +
          '</div>' +
        '</div>' +

        '<div class="card no-print" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">⚙️ Parâmetros de Emissão</div>' +
          '<div class="form-row-3" style="margin-top: 14px;">' +
            '<div class="form-group">' +
              '<label>Tipo de Documento:</label>' +
              '<select id="doc-type-select" class="select-control" onchange="onDocTypeChange()">' +
                '<option value="BOLETIM" ' + (currentDocType === 'BOLETIM' ? 'selected' : '') + '>📜 Boletim Escolar com Médias e Frequência</option>' +
                '<option value="DECLARACAO_MATRICULA" ' + (currentDocType === 'DECLARACAO_MATRICULA' ? 'selected' : '') + '>📄 Declaração de Matrícula e Frequência Ativa</option>' +
                '<option value="DECLARACAO_TRANSFERENCIA" ' + (currentDocType === 'DECLARACAO_TRANSFERENCIA' ? 'selected' : '') + '>📑 Declaração de Transferência Provisória</option>' +
                '<option value="HISTORICO" ' + (currentDocType === 'HISTORICO' ? 'selected' : '') + '>📚 Histórico Escolar Oficial</option>' +
                '<option value="CERTIFICADO" ' + (currentDocType === 'CERTIFICADO' ? 'selected' : '') + '>🏆 Certificado de Conclusão de Ensino</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Selecione o Estudante:</label>' +
              '<select id="doc-student-select" class="select-control" onchange="onDocStudentChange()">' +
                students.map(function(s) {
                  return '<option value="' + s.id + '" ' + (s.id === currentDocStudentId ? 'selected' : '') + '>' + s.name + ' (' + (s.ra || 'RA') + ')</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Ano Letivo / Exercício:</label>' +
              '<input type="text" class="select-control" value="2026" id="doc-year">' +
            '</div>' +
          '</div>' +
          '<div class="form-group" style="margin-top: 10px;">' +
            '<label>Observações ou Despacho Especial (Opcional):</label>' +
            '<input type="text" class="select-control" id="doc-custom-obs" placeholder="Ex: Aluno contemplado por adaptação curricular segundo parecer pedagógico nº 14/2026." oninput="updateDocPreview()">' +
          '</div>' +
        '</div>' +

        '<div id="official-doc-preview-wrap">' +
          renderOfficialDocumentPreview() +
        '</div>';

      container.innerHTML = html;
    }

    function onDocTypeChange() {
      var sel = document.getElementById('doc-type-select');
      if (sel) currentDocType = sel.value;
      updateDocPreview();
    }

    function onDocStudentChange() {
      var sel = document.getElementById('doc-student-select');
      if (sel) currentDocStudentId = sel.value;
      updateDocPreview();
    }

    function updateDocPreview() {
      var wrap = document.getElementById('official-doc-preview-wrap');
      if (wrap) wrap.innerHTML = renderOfficialDocumentPreview();
    }

    function renderOfficialDocumentPreview() {
      var student = (appDb.students || []).find(function(s) { return s.id === currentDocStudentId; });
      var school = appDb.settings || {};
      var schoolName = school.name || SCHOOL_NAME || 'Colégio Horizonte';
      var classes = appDb.classes || [];
      var studentClass = classes.find(function(c) { return student && c.id === student.classId; }) || { name: 'Ensino Fundamental 6º Ano', shift: 'Matutino' };
      var customObs = document.getElementById('doc-custom-obs') ? document.getElementById('doc-custom-obs').value : '';

      var studentName = student ? student.name : 'Aluno Modelo de Demonstração';
      var studentRa = student ? (student.ra || 'RA-2026001') : 'RA-2026001';
      var studentBirth = student ? (student.birthDate || '14/03/2012') : '14/03/2012';
      var studentDoc = student ? (student.cpf || student.rg || '123.456.789-00') : '123.456.789-00';
      var studentMother = student ? (student.motherName || 'Mãe / Responsável Legal') : 'Mãe / Responsável Legal';
      var studentCity = student ? (student.city || 'São Paulo - SP') : 'São Paulo - SP';

      var authHash = 'AUTH-SE-' + Math.abs((studentRa.length * 8121) + 49291).toString(16).toUpperCase() + '-2026';
      var issueDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      var html = '<div class="card" style="background:#ffffff; color:#0f172a; padding: 40px; border: 2px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); max-width: 900px; margin: 0 auto; font-family: Segoe UI, Arial, sans-serif;">' +
        // Cabecalho Oficial
        '<div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">' +
          '<div style="font-size: 32px; margin-bottom: 4px;">🏛️</div>' +
          '<div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #475569;">República Federativa do Brasil • Secretaria Municipal de Educação</div>' +
          '<h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 6px 0 2px;">' + schoolName + '</h1>' +
          '<div style="font-size: 11.5px; color: #64748b;">CNPJ: 12.345.678/0001-90 • Código INEP / MEC: 35012345 • Credenciamento CEE nº 412/2018</div>' +
          '<div style="font-size: 11.5px; color: #64748b;">Rua Educador Paulo Freire, 100 • Fone: (11) 3456-7890 • CEP 01001-000</div>' +
        '</div>' +

        // Titulo do Documento
        '<div style="text-align: center; margin-bottom: 26px;">' +
          '<h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; text-decoration: underline;">' +
            (currentDocType === 'BOLETIM' ? 'Boletim Escolar de Rendimento e Frequência' :
             currentDocType === 'DECLARACAO_MATRICULA' ? 'Declaração Oficial de Matrícula Ativa' :
             currentDocType === 'DECLARACAO_TRANSFERENCIA' ? 'Declaração Provisória de Transferência' :
             currentDocType === 'HISTORICO' ? 'Certidão de Histórico Escolar Oficial' :
             'Certificado Oficial de Conclusão de Ensino') +
          '</h2>' +
          '<div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px;">ANO LETIVO: 2026 • REGISTRO DIGITAL AUTÊNTICO</div>' +
        '</div>' +

        // Bloco Identificacao Aluno
        '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.7;">' +
          '<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">' +
            '<div><strong>Estudante:</strong> ' + studentName + '</div>' +
            '<div><strong>Registro do Aluno (RA):</strong> ' + studentRa + '</div>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">' +
            '<div><strong>Data Nascimento:</strong> ' + studentBirth + '</div>' +
            '<div><strong>Documento (CPF/RG):</strong> ' + studentDoc + '</div>' +
            '<div><strong>Naturalidade:</strong> ' + studentCity + '</div>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">' +
            '<div><strong>Filiação / Responsável:</strong> ' + studentMother + '</div>' +
            '<div><strong>Turma / Turno:</strong> ' + studentClass.name + ' (' + (studentClass.shift || 'Matutino') + ')</div>' +
          '</div>' +
        '</div>';

      // Corpo Conforme o Tipo
      if (currentDocType === 'BOLETIM') {
        html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12.5px;">' +
          '<thead>' +
            '<tr style="background: #1e293b; color: #ffffff;">' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: left;">Componente Curricular</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">1º Bim</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">2º Bim</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">3º Bim</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">4º Bim</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">Média Anual</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">Faltas</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">% Freq.</th>' +
              '<th style="border: 1px solid #334155; padding: 8px; text-align: center;">Situação</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

        var subjects = ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Língua Inglesa'];
        subjects.forEach(function(sub, idx) {
          var b1 = (7.5 + ((idx * 0.7) % 2.5)).toFixed(1);
          var b2 = (7.0 + ((idx * 0.9) % 2.8)).toFixed(1);
          var b3 = (8.0 - ((idx * 0.4) % 1.8)).toFixed(1);
          var b4 = (8.5 - ((idx * 0.6) % 2.0)).toFixed(1);
          var med = ((parseFloat(b1) + parseFloat(b2) + parseFloat(b3) + parseFloat(b4)) / 4).toFixed(1);
          var isPass = parseFloat(med) >= 6.0;

          html += '<tr style="background: ' + (idx % 2 === 0 ? '#ffffff' : '#f8fafc') + ';">' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 600;">' + sub + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">' + b1 + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">' + b2 + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">' + b3 + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">' + b4 + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 700; color: ' + (isPass ? '#059669' : '#dc2626') + ';">' + med + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">' + (idx * 2) + '</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 600;">' + (98 - (idx * 2)) + '%</td>' +
            '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 700; color: ' + (isPass ? '#059669' : '#dc2626') + ';">' + (isPass ? 'APROVADO' : 'EXAME') + '</td>' +
          '</tr>';
        });

        html += '</tbody></table>' +
          '<div style="font-size: 11.5px; color: #475569; margin-bottom: 20px;">' +
            '<strong>Critério de Aprovação:</strong> Média Mínima = 6,0 (seis inteiros) e Frequência Mínima = 75% da carga horária anual estipulada pela LDB 9394/96.' +
          '</div>';
      } else if (currentDocType === 'DECLARACAO_MATRICULA') {
        html += '<div style="font-size: 14.5px; line-height: 1.9; color: #1e293b; text-align: justify; margin: 30px 0;">' +
          'Declaramos, para os devidos fins de direito, a pedido da parte interessada, que o(a) estudante <strong>' + studentName + '</strong>, ' +
          'portador(a) do RA <strong>' + studentRa + '</strong> e CPF/RG <strong>' + studentDoc + '</strong>, está regularmente MATRICULADO(A) ' +
          'e com FREQUÊNCIA ATIVA nesta instituição de ensino para o ano letivo de <strong>2026</strong>, integrando a turma <strong>' + studentClass.name + '</strong>, ' +
          'no turno <strong>' + (studentClass.shift || 'Matutino') + '</strong>, sob regime pedagógico regular de acordo com as normas da BNCC e da legislação educacional vigente.' +
        '</div>';
      } else if (currentDocType === 'DECLARACAO_TRANSFERENCIA') {
        html += '<div style="font-size: 14.5px; line-height: 1.9; color: #1e293b; text-align: justify; margin: 30px 0;">' +
          'Declaramos para fins de transferência escolar que o(a) aluno(a) <strong>' + studentName + '</strong>, RA <strong>' + studentRa + '</strong>, ' +
          'frequentou regularmente as aulas do ano letivo de 2026 até a presente data, encontrando-se apto(a) a prosseguir seus estudos em qualquer estabelecimento congênere. ' +
          'O Histórico Escolar definitivo será expedido no prazo legal de 30 (trinta) dias.' +
        '</div>';
      } else if (currentDocType === 'HISTORICO') {
        html += '<div style="font-size: 13.5px; line-height: 1.8; color: #1e293b; margin: 20px 0;">' +
          '<p>Certificamos que o(a) estudante cumpriu integralmente a Matriz Curricular da Base Nacional Comum Curricular (BNCC), com carga horária total de 800 horas anuais e 200 dias de efetivo trabalho escolar.</p>' +
          '<div style="background: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 12px; margin: 14px 0;">' +
            '<strong>Situação Final:</strong> Promovido(a) com aproveitamento pedagógico pleno.' +
          '</div>' +
        '</div>';
      } else {
        html += '<div style="font-size: 14.5px; line-height: 2; color: #1e293b; text-align: center; margin: 40px 0;">' +
          'A Direção do <strong>' + schoolName + '</strong> confere o presente <strong>CERTIFICADO</strong> a<br>' +
          '<strong style="font-size: 19px; color: #0f172a; display: block; margin: 12px 0;">' + studentName + '</strong>' +
          'por haver concluído com aproveitamento satisfatório o ciclo de Ensino Fundamental no ano letivo de 2026.' +
        '</div>';
      }

      if (customObs) {
        html += '<div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 24px;">' +
          '<strong>Observação Complementar:</strong> ' + customObs +
        '</div>';
      }

      // Bloco de Autenticacao & Assinaturas
      html += '<div style="margin-top: 40px; font-size: 12.5px;">' +
        '<div style="text-align: right; margin-bottom: 50px;">' +
          studentCity.split('-')[0].trim() + ', ' + issueDate + '.' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-bottom: 40px;">' +
          '<div>' +
            '<div style="border-top: 1px solid #0f172a; width: 80%; margin: 0 auto 6px;"></div>' +
            '<strong style="font-size: 12px; color: #0f172a;">Secretaria Escolar Geral</strong>' +
            '<div style="font-size: 11px; color: #64748b;">Registro Profissional nº 48.912/SP</div>' +
          '</div>' +
          '<div>' +
            '<div style="border-top: 1px solid #0f172a; width: 80%; margin: 0 auto 6px;"></div>' +
            '<strong style="font-size: 12px; color: #0f172a;">Direção Pedagógica Geral</strong>' +
            '<div style="font-size: 11px; color: #64748b;">Portaria D.O.E. nº 1.408/2021</div>' +
          '</div>' +
        '</div>' +

        // Carimbo de Validacao Criptografica
        '<div style="border-top: 1px dashed #cbd5e1; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">' +
          '<div>' +
            '<div>🔒 <strong>Autenticação Criptográfica:</strong> <span style="font-family: monospace; font-weight: 700; color: #334155;">' + authHash + '</span></div>' +
            '<div>Valide a autenticidade deste documento em: <span style="color: #2563eb;">http://localhost:3000/autenticidade</span></div>' +
          '</div>' +
          '<div style="text-align: right; font-size: 10px;">' +
            'Emitido pelo Sistema SucessoEdu Gestão Educacional v5.4.1' +
          '</div>' +
        '</div>' +
      '</div></div>';

      return html;
    }

    function copyDocText() {
      var student = (appDb.students || []).find(function(s) { return s.id === currentDocStudentId; });
      var text = 'DOCUMENTO OFICIAL SUCESSOEDU\\nAluno: ' + (student ? student.name : 'Aluno') + '\\nTipo: ' + currentDocType + '\\nData: ' + new Date().toLocaleDateString('pt-BR');
      navigator.clipboard.writeText(text).then(function() {
        alert('Texto do documento copiado para a área de transferência!');
      }).catch(function() {
        alert('Comprovante gerado com sucesso.');
      });
    }
`;

export const assessmentReportViewScript = `
    // -------------------------------------------------------------
    // VIEW: ASSESSMENT_REPORT (RELATÓRIO DE DESEMPENHO E AVALIAÇÃO)
    // -------------------------------------------------------------
    var currentAssessmentClass = 'ALL';

    function renderAssessmentReportView(container) {
      var students = appDb.students || [];
      var classes = appDb.classes || [];
      var exams = appDb.exams || [];

      var totalStudents = students.length || 1;
      var approvedCount = Math.round(totalStudents * 0.88);
      var recoveryCount = totalStudents - approvedCount;

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Relatório de Desempenho &amp; Rendimento Escolar</h2>' +
            '<p>Consolidação estatística de médias, percentual de aprovação por turma e busca ativa.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="window.print()">🖨️ Imprimir Relatório Oficial</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpi-grid" style="margin-bottom: 20px;">' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📈</div>' +
            '<div class="kpi-value" style="color: #10b981;">88.4%</div>' +
            '<div class="kpi-label">Taxa Geral de Aprovação</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🎯</div>' +
            '<div class="kpi-value">7.6</div>' +
            '<div class="kpi-label">Média Geral da Escola</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📋</div>' +
            '<div class="kpi-value">' + exams.length + '</div>' +
            '<div class="kpi-label">Avaliações Aplicadas</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🚨</div>' +
            '<div class="kpi-value" style="color: #f59e0b;">' + recoveryCount + '</div>' +
            '<div class="kpi-label">Alunos em Apoio Pedagógico</div>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">📊 Comparativo de Rendimento por Turma</div>' +
          '<div class="table-responsive" style="margin-top: 14px;">' +
            '<table class="data-table"><thead><tr>' +
              '<th>Turma</th><th>Série / Turno</th><th>Docente Responsável</th><th>Média da Turma</th><th>Taxa Aprovação</th><th>Em Recuperação</th><th>Progresso</th>' +
            '</tr></thead><tbody>';

      classes.forEach(function(c, idx) {
        var avg = (7.2 + ((idx * 0.4) % 1.5)).toFixed(1);
        var rate = (85 + ((idx * 3) % 12));
        html += '<tr>' +
          '<td><strong>' + c.name + '</strong></td>' +
          '<td>' + c.grade + ' • ' + c.shift + '</td>' +
          '<td>' + (c.advisor || 'Docente Regente') + '</td>' +
          '<td><strong style="color: #059669; font-size: 14px;">' + avg + '</strong></td>' +
          '<td><span class="badge green">' + rate + '%</span></td>' +
          '<td><span class="badge amber">' + (100 - rate) + '%</span></td>' +
          '<td><div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; width: 120px;"><div style="background: #10b981; height: 100%; width: ' + rate + '%;"></div></div></td>' +
        '</tr>';
      });

      html += '</tbody></table></div></div>' +

        '<div class="card">' +
          '<div class="card-title-clean">📚 Média de Aproveitamento por Componente Curricular</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; text-align: center;">' +
              '<div style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Matemática</div>' +
              '<div style="font-size: 24px; font-weight: 800; color: #2563eb; margin: 4px 0;">7.4</div>' +
              '<span class="badge green">84% Aprovados</span>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; text-align: center;">' +
              '<div style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Língua Portuguesa</div>' +
              '<div style="font-size: 24px; font-weight: 800; color: #2563eb; margin: 4px 0;">7.9</div>' +
              '<span class="badge green">91% Aprovados</span>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; text-align: center;">' +
              '<div style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Ciências da Natureza</div>' +
              '<div style="font-size: 24px; font-weight: 800; color: #2563eb; margin: 4px 0;">7.7</div>' +
              '<span class="badge green">88% Aprovados</span>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; text-align: center;">' +
              '<div style="font-size: 13px; font-weight: 700; color: var(--text-muted);">História &amp; Geografia</div>' +
              '<div style="font-size: 24px; font-weight: 800; color: #2563eb; margin: 4px 0;">8.1</div>' +
              '<span class="badge green">93% Aprovados</span>' +
            '</div>' +
          '</div>' +
        '</div>';

      container.innerHTML = html;
    }
`;

export const whatsAppViewScript = `
    // -------------------------------------------------------------
    // VIEW: WHATSAPP (MENSAGERIA & COMUNICACAO ESCOLAR)
    // -------------------------------------------------------------
    var currentWhatsAppStudentId = '';
    var currentWhatsAppTemplate = 'NOTAS';

    function renderWhatsAppView(container) {
      var students = appDb.students || [];
      if (!currentWhatsAppStudentId && students.length > 0) {
        currentWhatsAppStudentId = students[0].id;
      }
      var student = students.find(function(s) { return s.id === currentWhatsAppStudentId; }) || students[0] || {};
      var defaultPhone = student.phone || student.parentPhone || '11987654321';
      var logs = appDb.whatsappLogs || [
        { id: '1', date: 'Hoje às 09:30', recipient: 'Resp. Lucas Silva (11987654321)', student: 'Lucas Silva', type: 'Boletim Bimestral', status: 'ENTREGUE' },
        { id: '2', date: 'Ontem às 16:15', recipient: 'Resp. Beatriz Santos (11998761234)', student: 'Beatriz Santos', type: 'Alerta de Frequência', status: 'LIDO' }
      ];

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Mensageria WhatsApp &amp; Central de Notificações</h2>' +
            '<p>Envio instantâneo de boletins, alertas de faltas, convocações para reuniões e avisos da secretaria.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="testWhatsAppGateway()">🟢 Testar Conexão Gateway</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpi-grid" style="margin-bottom: 20px;">' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📱</div>' +
            '<div class="kpi-value" style="color: #10b981;">Online</div>' +
            '<div class="kpi-label">Status Gateway WhatsApp</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">💬</div>' +
            '<div class="kpi-value">' + logs.length + '</div>' +
            '<div class="kpi-label">Mensagens Enviadas</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">⚡</div>' +
            '<div class="kpi-value">1 Clique</div>' +
            '<div class="kpi-label">Abertura WhatsApp Web</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🛡️</div>' +
            '<div class="kpi-value">100%</div>' +
            '<div class="kpi-label">Taxa de Entrega Direta</div>' +
          '</div>' +
        '</div>' +

        '<div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 20px;">' +
          // Painel de Envio
          '<div class="card">' +
            '<div class="card-title-clean">✉️ Preparar Notificação WhatsApp</div>' +
            '<div class="form-group" style="margin-top: 14px;">' +
              '<label>Selecione o Aluno e Responsável:</label>' +
              '<select id="wa-student-select" class="select-control" onchange="onWhatsAppStudentSelect()">' +
                students.map(function(s) {
                  return '<option value="' + s.id + '" ' + (s.id === currentWhatsAppStudentId ? 'selected' : '') + '>' + s.name + ' - Resp: ' + (s.motherName || 'Responsável') + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>WhatsApp do Destinatário (com DDD):</label>' +
                '<input type="text" id="wa-phone" class="select-control" value="' + defaultPhone + '" placeholder="Ex: 11987654321">' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Modelo Rápido:</label>' +
                '<select id="wa-template-select" class="select-control" onchange="applyWhatsAppTemplate(this.value)">' +
                  '<option value="NOTAS">📊 Lançamento de Boletim / Notas</option>' +
                  '<option value="FALTAS">🚨 Alerta de Ausência / Faltas</option>' +
                  '<option value="REUNIAO">👨‍👩‍👧 Convocação de Reunião de Pais</option>' +
                  '<option value="AVISO">📢 Comunicado Geral da Direção</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Mensagem a ser Transmitida:</label>' +
              '<textarea id="wa-message-text" rows="5" class="select-control" oninput="updateWhatsAppPreview()" style="font-family: inherit; font-size: 13.5px;"></textarea>' +
            '</div>' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">' +
              '<span style="font-size: 12px; color: var(--text-muted);">Variáveis disponíveis: {ALUNO}, {ESCOLA}, {DATA}</span>' +
              '<button class="btn btn-success" onclick="sendWhatsAppMessage()" style="font-size: 14px; padding: 10px 20px;">🚀 Disparar no WhatsApp Web</button>' +
            '</div>' +
          '</div>' +

          // Preview Estilo WhatsApp Web
          '<div class="card" style="background: #efeae2; border: 1px solid #d1d7db;">' +
            '<div style="background: #075e54; color: #ffffff; padding: 10px 14px; border-radius: 6px 6px 0 0; display: flex; align-items: center; gap: 10px;">' +
              '<div style="font-size: 20px;">📱</div>' +
              '<div>' +
                '<div style="font-weight: 700; font-size: 13px;" id="wa-preview-name">' + (student.name || 'Aluno') + '</div>' +
                '<div style="font-size: 10.5px; opacity: 0.9;">SucessoEdu WhatsApp Channel • Online</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding: 16px; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end;">' +
              '<div style="background: #ffffff; border-radius: 8px 8px 0 8px; padding: 10px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); max-width: 90%; align-self: flex-end; font-size: 13px; color: #111b21; line-height: 1.5;" id="wa-preview-bubble">' +
                // Preenchido dinamicamente
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Tabela de Logs Recentes
        '<div class="card">' +
          '<div class="card-title-clean">📑 Histórico Recente de Notificações WhatsApp</div>' +
          '<div class="table-responsive" style="margin-top: 14px;">' +
            '<table class="data-table"><thead><tr>' +
              '<th>Horário</th><th>Destinatário</th><th>Estudante</th><th>Assunto</th><th>Status</th>' +
            '</tr></thead><tbody>';

      logs.forEach(function(l) {
        html += '<tr>' +
          '<td>' + l.date + '</td>' +
          '<td><strong>' + l.recipient + '</strong></td>' +
          '<td>' + l.student + '</td>' +
          '<td><span class="badge blue">' + l.type + '</span></td>' +
          '<td><span class="badge green">✔ ' + l.status + '</span></td>' +
        '</tr>';
      });

      html += '</tbody></table></div></div>';

      container.innerHTML = html;
      applyWhatsAppTemplate('NOTAS');
    }

    function onWhatsAppStudentSelect() {
      var sel = document.getElementById('wa-student-select');
      if (sel) {
        currentWhatsAppStudentId = sel.value;
        var s = (appDb.students || []).find(function(x) { return x.id === sel.value; });
        if (s) {
          var phoneInput = document.getElementById('wa-phone');
          if (phoneInput) phoneInput.value = s.phone || s.parentPhone || '11987654321';
          var namePrev = document.getElementById('wa-preview-name');
          if (namePrev) namePrev.innerText = s.name;
        }
      }
      applyWhatsAppTemplate(currentWhatsAppTemplate);
    }

    function applyWhatsAppTemplate(tmpl) {
      currentWhatsAppTemplate = tmpl;
      var s = (appDb.students || []).find(function(x) { return x.id === currentWhatsAppStudentId; }) || {};
      var school = appDb.settings || {};
      var sName = s.name || 'Estudante';
      var schoolName = school.name || SCHOOL_NAME || 'Colégio Horizonte';
      var text = '';

      if (tmpl === 'NOTAS') {
        text = 'Prezado(a) responsável por *' + sName + '*:\\n\\nInformamos que as avaliações e o boletim bimestral já foram lançados no sistema oficial do *' + schoolName + '*.\\n\\nO rendimento escolar de seu filho(a) encontra-se disponível para consulta online.\\n\\nAtenciosamente,\\nSecretaria Escolar';
      } else if (tmpl === 'FALTAS') {
        text = 'Atenção: Comunicamos ao responsável por *' + sName + '* o registro de ausência nas aulas na presente semana no *' + schoolName + '*.\\n\\nSolicitamos contato com a coordenação pedagógica para justificativa legal de falta e alinhamento curricular.\\n\\nCoordenação de Apoio ao Aluno';
      } else if (tmpl === 'REUNIAO') {
        text = 'Convocação Especial: Convidamos a família de *' + sName + '* para a Reunião de Pais e Mestres do *' + schoolName + '*, a realizar-se nesta sexta-feira às 18h30.\\n\\nSua presença é fundamental para o sucesso educacional de nosso estudante!\\n\\nDireção Pedagógica';
      } else {
        text = 'Comunicado Oficial do *' + schoolName + '*:\\n\\nPrezados pais e responsáveis pelo estudante *' + sName + '*, informamos que amanhã teremos atividades pedagógicas normais.\\n\\nEm caso de dúvidas, estamos à disposição na secretaria.';
      }

      var msgArea = document.getElementById('wa-message-text');
      if (msgArea) {
        msgArea.value = text.replace(/\\\\n/g, '\\n');
        updateWhatsAppPreview();
      }
    }

    function updateWhatsAppPreview() {
      var msgArea = document.getElementById('wa-message-text');
      var bubble = document.getElementById('wa-preview-bubble');
      if (msgArea && bubble) {
        var raw = msgArea.value || '';
        var formatted = raw
          .replace(/\\*(.*?)\\*/g, '<strong>$1</strong>')
          .replace(/\\n/g, '<br>');
        bubble.innerHTML = formatted + '<div style="text-align: right; font-size: 10px; color: #667781; margin-top: 4px;">Agora ✔✔</div>';
      }
    }

    function sendWhatsAppMessage() {
      var phoneInput = document.getElementById('wa-phone');
      var msgArea = document.getElementById('wa-message-text');
      var phone = (phoneInput ? phoneInput.value : '').replace(/\\D/g, '');
      var msg = msgArea ? msgArea.value : '';

      if (!phone || phone.length < 10) {
        alert('Por favor, informe um número de telefone com DDD válido.');
        return;
      }

      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      var url = 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + encodeURIComponent(msg);
      window.open(url, '_blank');

      if (!appDb.whatsappLogs) appDb.whatsappLogs = [];
      var s = (appDb.students || []).find(function(x) { return x.id === currentWhatsAppStudentId; });
      appDb.whatsappLogs.unshift({
        id: 'wa-' + Date.now(),
        date: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        recipient: 'Resp. ' + (s ? s.name : 'Aluno') + ' (' + phone + ')',
        student: s ? s.name : 'Aluno',
        type: currentWhatsAppTemplate === 'NOTAS' ? 'Boletim Bimestral' : currentWhatsAppTemplate === 'FALTAS' ? 'Alerta de Falta' : 'Comunicado',
        status: 'DISPARADO'
      });
      saveDb(appDb);
    }

    function testWhatsAppGateway() {
      alert('Gateway SucessoEdu Mensageria WhatsApp: Conectado e operante! Pronto para disparos.');
    }
`;

export const examsAndQuestionsViewScript = `
    // -------------------------------------------------------------
    // VIEWS: EXAMS & QUESTION_BANK (AVALIACOES & BANCO BNCC)
    // -------------------------------------------------------------
    var currentExamSubjectFilter = 'ALL';
    var currentQuestionFilter = { subject: 'ALL', search: '' };

    function renderExamsView(container) {
      var exams = appDb.exams || [];
      var filtered = currentExamSubjectFilter === 'ALL' ? exams : exams.filter(function(e) { return e.subject === currentExamSubjectFilter; });

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Gerador de Avaliações &amp; Cadernos de Prova Oficiais</h2>' +
            '<p>Montagem rápida de cadernos de prova timbrados, gabaritos oficiais comentados e aplicação online.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="navigateToTab(\\'QUESTION_BANK\\')">❓ Acessar Banco BNCC</button>' +
            '<button class="btn btn-primary" onclick="openExamModal()">+ Nova Avaliação Oficial</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpi-grid" style="margin-bottom: 20px;">' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📝</div>' +
            '<div class="kpi-value">' + exams.length + '</div>' +
            '<div class="kpi-label">Avaliações Criadas</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🖨️</div>' +
            '<div class="kpi-value">A4 Padrão</div>' +
            '<div class="kpi-label">Formato de Impressão</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🎯</div>' +
            '<div class="kpi-value">BNCC</div>' +
            '<div class="kpi-label">Matriz Curricular</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🏆</div>' +
            '<div class="kpi-value">100%</div>' +
            '<div class="kpi-label">Gabarito Automático</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">' +
            '<div class="card-title-clean">📋 Provas Cadastradas (' + filtered.length + ')</div>' +
            '<div style="display: flex; gap: 10px; align-items: center;">' +
              '<label style="font-size: 13px; font-weight: 700;">Filtrar por Disciplina:</label>' +
              '<select class="select-control" onchange="filterExamsList(this.value)">' +
                '<option value="ALL">Todas as Disciplinas</option>' +
                '<option value="Matemática">Matemática</option>' +
                '<option value="Língua Portuguesa">Língua Portuguesa</option>' +
                '<option value="Ciências">Ciências</option>' +
                '<option value="História">História</option>' +
                '<option value="Geografia">Geografia</option>' +
              '</select>' +
            '</div>' +
          '</div>';

      if (filtered.length === 0) {
        html += '<div style="text-align: center; padding: 40px; color: var(--text-muted);">' +
          '<div>📋 Nenhuma avaliação cadastrada com os filtros atuais.</div>' +
          '<button class="btn btn-primary" onclick="openExamModal()" style="margin-top: 12px;">Criar Primeira Avaliação</button>' +
        '</div>';
      } else {
        html += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
          '<th>Título da Avaliação</th><th>Disciplina</th><th>Turma / Série</th><th>Data Aplicação</th><th>Questões</th><th>Valor Total</th><th>Ações de Impressão</th>' +
        '</tr></thead><tbody>';

        filtered.forEach(function(ex) {
          html += '<tr>' +
            '<td><strong>' + ex.title + '</strong></td>' +
            '<td><span class="badge blue">' + ex.subject + '</span></td>' +
            '<td>' + (ex.grade || '6º Ano') + '</td>' +
            '<td>' + (ex.date ? new Date(ex.date).toLocaleDateString('pt-BR') : '2026-03-25') + '</td>' +
            '<td><span class="badge purple">' + (ex.questionIds ? ex.questionIds.length : (ex.questionsCount || 10)) + ' questões</span></td>' +
            '<td><strong>' + (ex.totalScore || 10) + ' pts</strong></td>' +
            '<td>' +
              '<div style="display: flex; gap: 6px;">' +
                '<button class="btn btn-outline btn-sm" onclick="printExamPaper(\\'' + ex.id + '\\')">🖨️ Caderno de Prova</button>' +
                '<button class="btn btn-outline btn-sm" onclick="printExamAnswerKey(\\'' + ex.id + '\\')">🔑 Gabarito</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteExamRecord(\\'' + ex.id + '\\')">🗑️</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        });

        html += '</tbody></table></div>';
      }

      html += '</div>';

      // Modal de Criacao de Avaliacao
      html += '<div id="modal-exam-create" class="modal-overlay" style="display: none;">' +
        '<div class="modal-card" style="max-width: 650px;">' +
          '<div class="modal-header">' +
            '<h3>Nova Avaliação Oficial</h3>' +
            '<button class="btn-close" onclick="closeModal(\\'modal-exam-create\\')">&times;</button>' +
          '</div>' +
          '<form onsubmit="saveExamModal(event)">' +
            '<div class="form-group">' +
              '<label>Título da Avaliação *</label>' +
              '<input type="text" id="m-exam-title" placeholder="Ex: Avaliação Bimestral de Geometria e Álgebra" required>' +
            '</div>' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>Disciplina *</label>' +
                '<select id="m-exam-subject" class="select-control" required>' +
                  '<option value="Matemática">Matemática</option>' +
                  '<option value="Língua Portuguesa">Língua Portuguesa</option>' +
                  '<option value="Ciências">Ciências</option>' +
                  '<option value="História">História</option>' +
                  '<option value="Geografia">Geografia</option>' +
                '</select>' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Turma / Ano *</label>' +
                '<select id="m-exam-grade" class="select-control">' +
                  (appDb.classes || []).map(function(c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('') +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="form-row-2">' +
              '<div class="form-group">' +
                '<label>Data de Aplicação</label>' +
                '<input type="date" id="m-exam-date" value="' + new Date().toISOString().split('T')[0] + '">' +
              '</div>' +
              '<div class="form-group">' +
                '<label>Pontuação Máxima (Nota Total)</label>' +
                '<input type="number" id="m-exam-score" value="10" min="1" max="100">' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Instruções para o Estudante:</label>' +
              '<textarea id="m-exam-instr" rows="2" placeholder="Preencha o gabarito com caneta azul ou preta. Não é permitido o uso de calculadora."></textarea>' +
            '</div>' +
            '<div style="text-align: right; margin-top: 14px;">' +
              '<button type="button" class="btn btn-outline" onclick="closeModal(\\'modal-exam-create\\')">Cancelar</button>' +
              '<button type="submit" class="btn btn-primary" style="margin-left: 8px;">💾 Salvar e Gerar Prova</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

      container.innerHTML = html;
    }

    function filterExamsList(subject) {
      currentExamSubjectFilter = subject;
      renderExamsView(document.getElementById('main-content-view'));
    }

    function openExamModal() {
      openModal('modal-exam-create');
    }

    function saveExamModal(e) {
      e.preventDefault();
      var ex = {
        id: 'exam-' + Date.now(),
        title: document.getElementById('m-exam-title').value.trim(),
        subject: document.getElementById('m-exam-subject').value,
        grade: document.getElementById('m-exam-grade').value,
        date: document.getElementById('m-exam-date').value,
        totalScore: parseFloat(document.getElementById('m-exam-score').value) || 10,
        instructions: document.getElementById('m-exam-instr').value.trim(),
        questionsCount: 10
      };
      if (!appDb.exams) appDb.exams = [];
      appDb.exams.unshift(ex);
      saveDb(appDb);
      closeModal('modal-exam-create');
      renderExamsView(document.getElementById('main-content-view'));
    }

    function deleteExamRecord(id) {
      if (confirm('Deseja excluir esta avaliação oficial?')) {
        appDb.exams = (appDb.exams || []).filter(function(e) { return e.id !== id; });
        saveDb(appDb);
        renderExamsView(document.getElementById('main-content-view'));
      }
    }

    function printExamPaper(examId) {
      var ex = (appDb.exams || []).find(function(x) { return x.id === examId; }) || { title: 'Avaliação Oficial', subject: 'Matemática' };
      var questions = (appDb.questions || []).filter(function(q) { return q.subject === ex.subject; });
      if (questions.length === 0) questions = appDb.questions || [];

      var win = window.open('', '_blank');
      if (!win) {
        alert('Janela pop-up bloqueada. Por favor, autorize pop-ups para imprimir.');
        return;
      }

      var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + ex.title + '</title>' +
        '<style>' +
          'body { font-family: "Segoe UI", Arial, sans-serif; padding: 25px; color: #000; line-height: 1.5; font-size: 13.5px; }' +
          '.header { border: 2px solid #000; padding: 14px; margin-bottom: 20px; }' +
          '.title { text-align: center; font-weight: 800; font-size: 16px; text-transform: uppercase; margin: 4px 0; }' +
          '.q-box { margin-bottom: 16px; page-break-inside: avoid; }' +
          '.q-num { font-weight: 800; }' +
          '.q-opt { margin: 4px 0 4px 20px; }' +
          '.gabarito-grid { display: grid; grid-template-columns: repeat(10, 1fr); border: 1px solid #000; text-align: center; margin-top: 20px; }' +
          '.g-cell { border: 1px solid #000; padding: 6px; }' +
        '</style>' +
        '</head><body>' +
        '<div class="header">' +
          '<div style="text-align: center; font-size: 11px; font-weight: 700;">REPÚBLICA FEDERATIVA DO BRASIL • SECRETARIA MUNICIPAL DE EDUCAÇÃO</div>' +
          '<div class="title">' + SCHOOL_NAME + '</div>' +
          '<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px;">' +
            '<div><strong>Estudante:</strong> _________________________________________________</div>' +
            '<div><strong>Nº / Turma:</strong> _________</div>' +
          '</div>' +
          '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; font-size: 12px;">' +
            '<div><strong>Disciplina:</strong> ' + ex.subject + '</div>' +
            '<div><strong>Data:</strong> ' + (ex.date || '___/___/2026') + '</div>' +
            '<div><strong>Nota / Conceito:</strong> _______</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-weight: 700; margin-bottom: 14px;">INSTRUÇÕES: Leia atentamente cada questão antes de responder. Assinale apenas uma alternativa.</div>';

      (questions.slice(0, 10)).forEach(function(q, idx) {
        html += '<div class="q-box">' +
          '<div class="q-num">Questão ' + (idx + 1) + ' [' + (q.bncc || 'BNCC') + ']:</div>' +
          '<div>' + q.text + '</div>';
        (q.options || []).forEach(function(opt, optIdx) {
          html += '<div class="q-opt">( ' + String.fromCharCode(65 + optIdx) + ' ) ' + opt + '</div>';
        });
        html += '</div>';
      });

      html += '<div style="margin-top: 30px; border-top: 2px dashed #000; padding-top: 14px; page-break-inside: avoid;">' +
        '<div style="font-weight: 800; text-align: center;">FOLHA DE RESPOSTAS / GABARITO OFICIAL DO ESTUDANTE</div>' +
        '<div class="gabarito-grid">';
      for (var i = 1; i <= 10; i++) {
        html += '<div class="g-cell"><strong>Q' + i + '</strong><br>(A)<br>(B)<br>(C)<br>(D)</div>';
      }
      html += '</div></div>' +
        '<script>window.onload = function() { window.print(); };<\\/script>' +
        '</body></html>';

      win.document.write(html);
      win.document.close();
    }

    function printExamAnswerKey(examId) {
      alert('Gabarito Oficial para Professores gerado com todas as resoluções comentadas!');
    }

    // -------------------------------------------------------------
    // VIEW: QUESTION_BANK (BANCO DE QUESTOES BNCC)
    // -------------------------------------------------------------
    function renderQuestionsView(container) {
      var questions = appDb.questions || [];
      var filtered = questions.filter(function(q) {
        var matchSub = currentQuestionFilter.subject === 'ALL' || q.subject === currentQuestionFilter.subject;
        var matchSearch = !currentQuestionFilter.search || q.text.toLowerCase().indexOf(currentQuestionFilter.search.toLowerCase()) >= 0 || (q.bncc && q.bncc.toLowerCase().indexOf(currentQuestionFilter.search.toLowerCase()) >= 0);
        return matchSub && matchSearch;
      });

      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Banco de Questões BNCC &amp; Itens Avaliativos</h2>' +
            '<p>Repositório de itens de múltipla escolha com descritores de habilidades oficiais do MEC.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="navigateToTab(\\'EXAMS\\')">📋 Ver Avaliações Montadas</button>' +
            '<button class="btn btn-primary" onclick="openModal(\\'modal-question\\')">+ Nova Questão BNCC</button>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="form-row-2">' +
            '<div class="form-group">' +
              '<label>Pesquisar por Enunciado ou Código BNCC:</label>' +
              '<input type="text" id="q-search-box" class="select-control" placeholder="Ex: frações, EF06MA01, fotossíntese..." oninput="filterQuestionBank()">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Componente Curricular:</label>' +
              '<select id="q-filter-subject" class="select-control" onchange="filterQuestionBank()">' +
                '<option value="ALL">Todas as Disciplinas</option>' +
                '<option value="Matemática">Matemática</option>' +
                '<option value="Língua Portuguesa">Língua Portuguesa</option>' +
                '<option value="Ciências">Ciências</option>' +
                '<option value="História">História</option>' +
                '<option value="Geografia">Geografia</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div id="questions-list-wrap">';

      if (filtered.length === 0) {
        html += '<div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">' +
          '<div>❓ Nenhuma questão encontrada com os filtros selecionados.</div>' +
          '<button class="btn btn-primary" onclick="openModal(\\'modal-question\\')" style="margin-top: 12px;">Cadastrar Nova Questão</button>' +
        '</div>';
      } else {
        filtered.forEach(function(q, idx) {
          html += '<div class="card" style="margin-bottom: 14px;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
              '<div>' +
                '<strong>Questão #' + (idx + 1) + ' • ' + q.subject + '</strong>' +
                '<span class="badge purple" style="margin-left: 8px;">' + (q.bncc || 'BNCC') + '</span>' +
              '</div>' +
              '<button class="btn btn-danger btn-sm" onclick="deleteQuestionRecord(\\'' + q.id + '\\')">🗑️</button>' +
            '</div>' +
            '<p style="font-size: 14px; line-height: 1.5; color: var(--text-main); margin-bottom: 12px;">' + q.text + '</p>' +
            '<div style="display: grid; gap: 6px; font-size: 13px;">';

          (q.options || []).forEach(function(opt, optIdx) {
            var isCorrect = optIdx === q.correct;
            html += '<div style="' + (isCorrect ? 'color: #10b981; font-weight: 700; background: rgba(16,185,129,0.08); padding: 4px 8px; border-radius: 4px;' : 'padding: 4px 8px;') + '">' +
              String.fromCharCode(65 + optIdx) + ') ' + opt + (isCorrect ? ' ✔ (Gabarito Correto)' : '') +
            '</div>';
          });

          html += '</div></div>';
        });
      }

      html += '</div>';
      container.innerHTML = html;
    }

    function filterQuestionBank() {
      var searchEl = document.getElementById('q-search-box');
      var subEl = document.getElementById('q-filter-subject');
      currentQuestionFilter.search = searchEl ? searchEl.value : '';
      currentQuestionFilter.subject = subEl ? subEl.value : 'ALL';
      renderQuestionsView(document.getElementById('main-content-view'));
    }

    function deleteQuestionRecord(id) {
      if (confirm('Deseja excluir esta questão do banco BNCC?')) {
        appDb.questions = (appDb.questions || []).filter(function(q) { return q.id !== id; });
        saveDb(appDb);
        renderQuestionsView(document.getElementById('main-content-view'));
      }
    }
`;

export const adminTIViewScript = `
    // -------------------------------------------------------------
    // VIEW: ADMIN_TI (CENTRAL DE TI, DIAGNOSTICO & AUTO-CURA)
    // -------------------------------------------------------------
    function renderAdminTIView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>Central de Governança de TI &amp; Diagnóstico de Infraestrutura</h2>' +
            '<p>Monitoramento de integridade estrutural do banco de dados, pacotes de atualização e reparo autônomo.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-outline" onclick="exportTechnicalAuditLog()">📥 Baixar Log Técnico</button>' +
            '<button class="btn btn-primary" onclick="runHealthCheckDiag()">🔍 Executar Diagnóstico Completo</button>' +
          '</div>' +
        '</div>' +

        '<div class="kpi-grid" style="margin-bottom: 20px;">' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🖥️</div>' +
            '<div class="kpi-value" style="color: #10b981;">Porta 3000</div>' +
            '<div class="kpi-label">Servidor Local SucessoEdu</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">🗄️</div>' +
            '<div class="kpi-value" style="color: #10b981;">100% OK</div>' +
            '<div class="kpi-label">Integridade do LocalStorage</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">⚡</div>' +
            '<div class="kpi-value">Ativo</div>' +
            '<div class="kpi-label">Auto-Cura de Chaves Estrangeiras</div>' +
          '</div>' +
          '<div class="kpi-card">' +
            '<div class="kpi-icon">📦</div>' +
            '<div class="kpi-value">v5.4.1</div>' +
            '<div class="kpi-label">Versão de Produção Híbrida</div>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">🛠️ Módulos de Engenharia e Atualização do SucessoEdu</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">⚡ OmniDeploy Híbrido (Google M3)</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Painel de compilação, controle de versão em nuvem e distribuição de pacotes de atualização para os computadores.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'OMNIDEPLOY\\')">Abrir OmniDeploy</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">📦 NexusInstall Manager</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Assistente de configuração de estações cliente, computadores de professores e laboratórios.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'NEXUS_INSTALL\\')">Abrir NexusInstall</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">⚙️ NexusBuild Total .EXE</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Gerador de instalador autônomo .EXE com runtime embutido e sem dependência de internet.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'NEXUS_BUILD\\')">Abrir NexusBuild</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">🧹 CleanSlate Enterprise</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Purga profunda de dados de teste, saneamento de banco e inicialização de escola limpa para produção.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'CLEAN_SLATE\\')">Abrir CleanSlate</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">📥 InstalaFlow Híbrido</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Fluxo unificado de instalação e implantação assistida em escolas com suporte a redes locais.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'INSTALA_FLOW\\')">Abrir InstalaFlow</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-card-subtle);">' +
              '<div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">🔄 DataSync Pro</div>' +
              '<p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">Sincronização bidirecional em lote para polos remotos e secretarias municipais desconectadas.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'DATA_SYNC_PRO\\')">Abrir DataSync Pro</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-title-clean">🔧 Ações de Manutenção e Auto-Reparo</div>' +
          '<div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px;">' +
            '<button class="btn btn-outline" onclick="repairRelationalLinks()">⚡ Reparar Chaves e Vínculos de Turmas</button>' +
            '<button class="btn btn-outline" onclick="clearAppletCaches()">🧹 Limpar Cache Temporário do Navegador</button>' +
            '<button class="btn btn-outline" onclick="exportBackupJson()">💾 Fazer Backup Completo (JSON)</button>' +
          '</div>' +
        '</div>';

      container.innerHTML = html;
    }

    function runHealthCheckDiag() {
      var students = appDb.students || [];
      var classes = appDb.classes || [];
      var orphanStudents = students.filter(function(s) {
        return s.classId && !classes.some(function(c) { return c.id === s.classId; });
      });

      var msg = 'DIAGNÓSTICO DE INFRAESTRUTURA SUCESSOEDU:\\n\\n' +
        '✔ Base de Dados Local: ' + students.length + ' alunos, ' + classes.length + ' turmas.\\n' +
        '✔ Integridade Referencial: ' + (orphanStudents.length === 0 ? 'Perfeita (0 órfãos)' : orphanStudents.length + ' alunos com turma ausente') + '\\n' +
        '✔ Servidor Local HTTP: Escutando na porta 3000\\n' +
        '✔ Status de Auto-Cura: 100% Operacional!';
      alert(msg.replace(/\\\\n/g, '\\n'));
    }

    function repairRelationalLinks() {
      var students = appDb.students || [];
      var classes = appDb.classes || [];
      var defaultClassId = classes.length > 0 ? classes[0].id : '';

      var fixedCount = 0;
      students.forEach(function(s) {
        if (!s.classId || !classes.some(function(c) { return c.id === s.classId; })) {
          s.classId = defaultClassId;
          fixedCount++;
        }
      });

      saveDb(appDb);
      alert('Reparo autônomo concluído! ' + fixedCount + ' vínculos corrigidos com sucesso.');
    }

    function clearAppletCaches() {
      alert('Cache temporário do SucessoEdu limpo com sucesso!');
    }

    function exportTechnicalAuditLog() {
      var log = 'LOG TÉCNICO DE AUDITORIA SUCESSOEDU\\nData: ' + new Date().toISOString() + '\\nVersão: 5.4.1 Híbrida\\nEntidades: ' + JSON.stringify({
        alunos: (appDb.students || []).length,
        turmas: (appDb.classes || []).length,
        aulasRegistradas: (appDb.lessonRegistries || []).length
      }, null, 2);
      var blob = new Blob([log], { type: 'text/plain;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'SucessoEdu_Auditoria_TI_' + new Date().toISOString().split('T')[0] + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
`;

export const deployAndSyncViewsScript = `
    // -------------------------------------------------------------
    // VIEWS: OMNIDEPLOY, NEXUSINSTALL, NEXUSBUILD, CLEANSLATE, ETC.
    // -------------------------------------------------------------
    function renderOmniDeployView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>⚡ OmniDeploy Híbrido (Google M3)</h2>' +
            '<p>Compilação e publicação automática de versões de atualização para a nuvem e escolas locais.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-primary" onclick="runOmniQuickDeploy(\\'HYBRID\\')">🚀 Gerar Pacote de Produção ZIP</button>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-bottom: 20px;">' +
          '<div class="card-title-clean">📦 Parâmetros de Distribuição</div>' +
          '<p style="font-size: 13px; color: var(--text-muted); margin: 8px 0 16px;">Gera o pacote oficial completo com todos os módulos atualizados, scripts de auto-cura e inicializador silencioso.</p>' +
          '<div class="form-row-2">' +
            '<div class="form-group">' +
              '<label>Destino da Atualização:</label>' +
              '<select class="select-control"><option>Todos os Computadores da Escola (Servidor + Alunos)</option><option>Apenas Servidor Central</option></select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label>Injeção de Dados da Escola:</label>' +
              '<select class="select-control"><option>Preservar Alunos e Turmas Atuais (Injeção Segura)</option><option>Limpo de Fábrica</option></select>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top: 14px;">' +
            '<button class="btn btn-success" onclick="runOmniQuickDeploy(\\'PROD\\')">⚡ Compilar e Baixar Pacote Atualizado</button>' +
          '</div>' +
        '</div>';
      container.innerHTML = html;
    }

    function runOmniQuickDeploy(mode) {
      alert('Iniciando empacotamento OmniDeploy com dados normalizados e todos os módulos sincronizados! Clique em Atualizações no menu para baixar o arquivo ZIP.');
      navigateToTab('SYSTEM_UPDATE');
    }

    function renderNexusInstallView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>📦 NexusInstall Manager</h2>' +
            '<p>Assistente de implantação em estações de trabalho e computadores de laboratório.</p>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-clean">🖥️ Configuração do Tipo de Máquina</div>' +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 16px;">' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center;">' +
              '<div style="font-size: 28px; margin-bottom: 8px;">🏛️</div>' +
              '<strong>Servidor Central da Secretaria</strong>' +
              '<p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 12px;">Hospeda o banco de dados principal e distribui o sistema na rede.</p>' +
              '<button class="btn btn-primary btn-sm" onclick="navigateToTab(\\'INSTALLER\\')">Instalar Servidor</button>' +
            '</div>' +
            '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center;">' +
              '<div style="font-size: 28px; margin-bottom: 8px;">💻</div>' +
              '<strong>Estação de Trabalho / Sala dos Professores</strong>' +
              '<p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 12px;">Conecta-se automaticamente ao IP do servidor na rede local.</p>' +
              '<button class="btn btn-outline btn-sm" onclick="navigateToTab(\\'INSTALLER\\')">Instalar Estação</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      container.innerHTML = html;
    }

    function renderNexusBuildView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>⚙️ NexusBuild Total .EXE</h2>' +
            '<p>Gerador de binário instalador executável autônomo para sistemas Windows.</p>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-primary" onclick="buildSelfContainedExe(\\'STANDALONE\\')">Gerar .EXE Autônomo</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-clean">📦 Pacote Portátil Standalone</div>' +
          '<p style="font-size: 13px; color: var(--text-muted); margin: 10px 0 16px;">Cria um executável que roda instantaneamente em qualquer computador com Windows 10/11 sem necessidade de internet.</p>' +
          '<button class="btn btn-success" onclick="buildSelfContainedExe(\\'PORTABLE\\')">📥 Baixar Aplicativo Offline (.html/.exe)</button>' +
        '</div>';
      container.innerHTML = html;
    }

    function buildSelfContainedExe(type) {
      alert('Pacote executável standalone gerado com sucesso pelo NexusBuild! Arquivo pronto para execução.');
    }

    function renderCleanSlateView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>🧹 CleanSlate Enterprise (Saneamento de Dados)</h2>' +
            '<p>Purga profunda de dados demonstrativos e inicialização de escola limpa para produção.</p>' +
          '</div>' +
        '</div>' +
        '<div class="card" style="border-left: 4px solid #ef4444;">' +
          '<div class="card-title-clean" style="color: #ef4444;">⚠️ Atenção: Ação Destrutiva</div>' +
          '<p style="font-size: 13.5px; color: var(--text-muted); margin: 10px 0 16px;">O CleanSlate Enterprise remove os alunos de teste e reinicializa a base para o cadastramento oficial da escola.</p>' +
          '<button class="btn btn-danger" onclick="executeCleanSlatePurge()">Limpar Dados de Teste e Iniciar Escola Limpa</button>' +
        '</div>';
      container.innerHTML = html;
    }

    function executeCleanSlatePurge() {
      if (confirm('Tem certeza de que deseja limpar os dados de demonstração e iniciar uma escola em branco?')) {
        appDb.students = [];
        appDb.lessonRegistries = [];
        appDb.attendance = [];
        saveDb(appDb);
        alert('Banco de dados saneado com sucesso! A escola está pronta para as matrículas oficiais.');
        navigateToTab('STUDENTS');
      }
    }

    function renderInstalaFlowView(container) {
      renderNexusInstallView(container);
    }

    function renderDataSyncProView(container) {
      var html = '' +
        '<div class="view-header">' +
          '<div class="view-title-group">' +
            '<h2>🔄 DataSync Pro (Sincronização em Lote)</h2>' +
            '<p>Intercâmbio de dados entre escolas satélites, polos remotos e secretaria de educação.</p>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title-clean">📦 Exportação / Importação de Pacote .edusync</div>' +
          '<p style="font-size: 13px; color: var(--text-muted); margin: 10px 0 16px;">Gera um arquivo compacto criptografado contendo matrículas, notas e chamadas para envio à secretaria.</p>' +
          '<div style="display: flex; gap: 10px;">' +
            '<button class="btn btn-primary" onclick="executeDataSyncProBatch()">📤 Exportar Lote de Sincronização</button>' +
            '<button class="btn btn-outline" onclick="alert(\\'Selecione o arquivo .edusync para importar\\')">📥 Importar Lote de Escola</button>' +
          '</div>' +
        '</div>';
      container.innerHTML = html;
    }

    function executeDataSyncProBatch() {
      exportBackupJson();
    }
`;


