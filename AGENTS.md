# Contexto e Memória de Arquitetura do SucessoEdu

Este documento registra de forma permanente toda a arquitetura, regras de negócio, padrões de instaladores e melhorias já consolidadas no **SucessoEdu Gestão Educacional**.

---

## 1. Visão Geral do Sistema
O **SucessoEdu** é um ERP e ecossistema educacional completo que opera em múltiplos modos:
- **Web / Nuvem**: Aplicação React com Tailwind CSS, TypeScript e suporte a múltiplos usuários.
- **Servidor Local / Offline**: Micro-servidor HTTP nativo em PowerShell (`server_micro.ps1`) ou Node.js, operando na pasta raiz `C:\SucessoEdu` (ou `%LOCALAPPDATA%\SucessoEdu`).
- **Aplicativo Standalone Offline**: SPA embutido em arquivo único (`SucessoEdu_Aplicativo_Offline.html` / `index.html`) gerado por `src/utils/standaloneAppHtml.ts` com banco de dados local (`localStorage` + seed de teste completo).
- **Estação de Trabalho / Aluno / Laboratório**: Configurado para descoberta automática do IP do Servidor via UDP/HTTP (`buscar_servidor_rede.ps1`).
- **Polo Remoto / Escola Satélite**: Modo com banco de dados desacoplado e sincronização em lote.

---

## 2. Padrões de Instaladores e Desktop Windows
Ao gerar scripts ou realizar manutenções em `src/utils/installerGenerator.ts`:

### A. Regra do Atalho Único na Área de Trabalho
1. **Nunca criar múltiplos atalhos ou arquivos `.url`**:
   - Deve ser criado **exclusivamente 1 atalho `.lnk` oficial**: `SucessoEdu Gestão Educacional.lnk`.
   - O atalho aponta para `wscript.exe "C:\SucessoEdu\SucessoEdu_App.vbs"` com diretório de trabalho `C:\SucessoEdu` e ícone `C:\SucessoEdu\sucessoedu.ico`.
2. **Limpeza Prévia Obrigatória**:
   - Os scripts `criar_atalhos.ps1` e `criar_atalhos.vbs` realizam varredura em todas as pastas de Desktop (Usuário ativo, OneDrive, Público) e deletam atalhos antigos/duplicados (`.url` e variações antigas de nomes).

### B. Widget Flutuante e Inicialização Automática do Servidor
1. **Widget Flutuante de Status**:
   - Script: `servidor_widget_flutuante.ps1`.
   - Exibe status em tempo real (🟢 Online / Porta), IP local da máquina, botão rápido de abertura, cópia de IP e teste de diagnóstico.
   - Protegido por Mutex global (`Global\SucessoEdu_Widget_Mutex`) para evitar instâncias duplicadas.
2. **Inicialização Automática**:
   - O arquivo `iniciar_servidor_silencioso.vbs` inicializa em segundo plano tanto o servidor na bandeja (`servidor_tray.ps1`) quanto o widget flutuante (`servidor_widget_flutuante.ps1`).
   - Configurado via Registro do Windows (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run\SucessoEduServer`) e pasta `Startup`.

---

## 3. Manutenção da Aplicação Offline (`standaloneAppHtml.ts`)
1. **Fidelidade de Layout e Funcionalidades**:
   - O aplicativo offline standalone deve manter **exatamente o mesmo layout, design e componentes** da versão React principal.
2. **Módulos Ativos no Standalone**:
   - Dashboard com métricas e gráficos.
   - Matrículas e Alunos (com formulários completos, busca e paginação).
   - Turmas, Horários e Enturmação.
   - Professores e Corpo Docente.
   - Frequência Diária e Chamada Rápida.
   - Notas, Avaliações e Boletim Escolar.
   - Financeiro (Mensalidades, Fluxo de Caixa e Cobranças).
   - Censo Escolar / INEP.
   - Calendário Escolar e Eventos.
   - Planejamento Pedagógico e BNCC.
   - Relatórios e Exportações (PDF/Impressão, Excel/CSV).
   - Configurações da Escola e Dados de Rede.
   - Central de Instalação e Geração de Pacotes ZIP.
3. **Inicialização e Eventos**:
   - A inicialização do banco (`loadDb()`) e navegação inicial (`navigateToTab('MAIN_DASHBOARD')`) ocorrem no evento `DOMContentLoaded`.
   - Todas as funções de renderização devem estar vinculadas ao escopo global (`window.*`) para permitir interatividade direta nos handlers HTML inline (`onclick`, `onchange`, etc.).

---

## 4. Localização dos Arquivos Principais
- `/src/App.tsx`: Interface principal do ecossistema React.
- `/src/types.ts`: Definições globais de tipos TypeScript.
- `/src/data/mockData.ts`: Base de dados inicial rica (escola de teste, alunos, professores, turmas, notas, financeiro).
- `/src/utils/installerGenerator.ts`: Gerador de todos os scripts Windows/Linux (`.bat`, `.ps1`, `.vbs`, `.sh`), instalador unificado e pacotes ZIP (`JSZip`).
- `/src/utils/standaloneAppHtml.ts`: Gerador do SPA HTML standalone offline.
- `/src/components/*`: Componentes modulares da interface.

---

## 5. Autenticação, Senhas e Segurança da Nuvem (Supabase)
1. **Login em duas camadas** (`src/components/auth/LoginScreen.tsx`):
   - Primeiro tenta o **Supabase Auth** (e-mail + senha). O papel vem de `app_metadata.role` (definido só pelo ADMIN via servidor) e libera a sincronização em nuvem.
   - Sem internet ou sem conta na nuvem, usa a **senha local** do computador (hash `sha256$iterações$sal$hash` em `src/utils/passwordHasher.ts`, JS puro para funcionar em `http://IP-da-rede`).
   - Contas vindas da nuvem (`cloudSynced`) não podem ter a senha criada via "primeiro acesso": exigem o login na nuvem.
2. **Nunca** chamar métodos do Supabase dentro de `onAuthStateChange` sem adiar com `setTimeout(..., 0)` — isso trava o login.
3. **RLS** (`supabase/migrations/20260923_rls_staff_access_policies.sql`): `anon` não acessa nada; `ADMIN`/`TEACHER` autenticados leem e gravam; tabelas administrativas e exclusões só `ADMIN`. **Nunca** criar políticas `USING (true)`.
4. **Sincronização** (`src/services/datasync/supabaseRowMapper.ts`): converter camelCase ↔ snake_case pelas colunas reais; a leitura da nuvem é **mescla não destrutiva** (lista vazia não apaga dados locais) e só ocorre com sessão ativa.
5. **Servidor**: `/api/admin/cloud-user` e `/api/update-user-role` exigem `SUPABASE_SERVICE_ROLE_KEY` no `.env` e token de um ADMIN autenticado.
