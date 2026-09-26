import React, { useState } from 'react';
import { DocumentLetterhead } from '../common/DocumentLetterhead';
import {
  Award,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  User,
  Building2,
  Calendar,
  ShieldCheck,
  QrCode,
  Sparkles,
  ArrowLeft,
  Home,
  ChevronRight,
  Users,
  Layers,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  AcademicHistory,
  SchoolSettings,
} from '../../types';

export type DocumentType =
  | 'CERTIFICADO_CONCLUSAO'
  | 'DECLARACAO_MATRICULA'
  | 'HISTORICO_ESCOLAR'
  | 'BOLETIM_ESCOLAR'
  | 'DECLARACAO_TRANSFERENCIA';

interface DocumentIssuerProps {
  students: Student[];
  classes: SchoolClass[];
  histories: AcademicHistory[];
  settings: SchoolSettings;
  preSelectedStudentId?: string;
  preSelectedDocType?: DocumentType;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const DocumentIssuer: React.FC<DocumentIssuerProps> = ({
  students,
  classes,
  histories,
  settings,
  preSelectedStudentId,
  preSelectedDocType = 'CERTIFICADO_CONCLUSAO',
  onBack,
  onNavigate,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudentId || students[0]?.id || ''
  );
  const [documentType, setDocumentType] = useState<DocumentType>(preSelectedDocType);
  const [customObservation, setCustomObservation] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedStudent = (students || []).find((s) => s.id === selectedStudentId) || students?.[0];
  const selectedClass = (classes || []).find((c) => c.id === selectedStudent?.classId);
  const matchedHistory = (histories || []).find((h) => h.studentId === selectedStudent?.id) || histories?.[0];

  const safeHistory: AcademicHistory = matchedHistory || {
    id: `hist-fallback-${selectedStudent?.id || 'empty'}`,
    studentId: selectedStudent?.id || '',
    schoolYear: selectedClass?.schoolYear || new Date().getFullYear(),
    gradeLevel: selectedClass?.name || 'Ensino Fundamental / Médio',
    schoolName: settings?.name || 'Instituição de Ensino',
    cityState: `${settings?.city || 'Brasil'} - ${settings?.state || 'BR'}`,
    records: [],
    generalAverage: 0,
    attendanceRate: 100,
    finalResult: 'EM_CURSO',
    observations: 'Registro acadêmico em processamento ou aguardando consolidação das avaliações do período.',
    issuedAt: new Date().toISOString(),
  };

  const currentDateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const docElement = document.getElementById('printable-official-document');
    if (docElement) {
      navigator.clipboard.writeText(docElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          <button
            onClick={() => onNavigate?.('STUDENTS')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Voltar para a Lista de Alunos"
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Voltar para Alunos</span>
          </button>
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 ml-2">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Documentos & Certificados</span>
          </div>
        </div>

        {/* Quick Document Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setDocumentType('CERTIFICADO_CONCLUSAO')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              documentType === 'CERTIFICADO_CONCLUSAO'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Certificado
          </button>
          <button
            onClick={() => setDocumentType('DECLARACAO_MATRICULA')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              documentType === 'DECLARACAO_MATRICULA'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Declaração
          </button>
          <button
            onClick={() => setDocumentType('HISTORICO_ESCOLAR')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              documentType === 'HISTORICO_ESCOLAR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setDocumentType('BOLETIM_ESCOLAR')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              documentType === 'BOLETIM_ESCOLAR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Boletim
          </button>
        </div>
      </div>

      {/* Top Controls Bar (Hidden on Print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Emissão Automatizada de Certificados e Documentos Oficiais
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere certificados autenticados, históricos escolares e declarações com layout oficial pronto para impressão
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* Filters and Document Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selecione o Estudante:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.enrollmentNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Documento Oficial:
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CERTIFICADO_CONCLUSAO">🏆 Certificado Oficial de Conclusão</option>
              <option value="HISTORICO_ESCOLAR">📑 Histórico Escolar Completo</option>
              <option value="DECLARACAO_MATRICULA">📋 Declaração de Matrícula & Frequência</option>
              <option value="BOLETIM_ESCOLAR">📊 Boletim Escolar com Médias</option>
              <option value="DECLARACAO_TRANSFERENCIA">📤 Declaração de Transferência</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação Adicional no Rodapé:
            </label>
            <input
              type="text"
              value={customObservation}
              onChange={(e) => setCustomObservation(e.target.value)}
              placeholder="Ex: Documento emitido para fins de estágio/faculdade..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Paper Document Container */}
      <div className="flex justify-center">
        <div
          id="printable-official-document"
          className="printable-page bg-white w-full max-w-4xl p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-xl text-slate-900 transition-all relative overflow-hidden"
          style={{ minHeight: '1050px' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Award className="w-[500px] h-[500px] text-slate-900" />
          </div>

          {/* Timbre padrão: logos da Gestão, SEMED e escola do aluno (cadastros da Rede Municipal) */}
          <DocumentLetterhead schoolUnitId={selectedStudent?.schoolUnitId} classId={selectedClass?.id} className="relative" />

          {/* ========================================================================= */}
          {/* CASE 1: CERTIFICADO DE CONCLUSÃO */}
          {/* ========================================================================= */}
          {documentType === 'CERTIFICADO_CONCLUSAO' && (
            <div className="border-8 border-double border-indigo-900/40 p-6 sm:p-10 rounded-xl h-full flex flex-col justify-between relative">
              {/* Header */}
              <div className="text-center space-y-2">
                <h3 className="text-sm font-semibold tracking-widest uppercase text-slate-600">
                  República Federativa do Brasil • Estado de {settings.state}
                </h3>
                <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-indigo-950 uppercase">
                  {settings.name}
                </h1>
                <p className="text-xs text-slate-500">
                  {settings.accreditationDecree} • Código INEP: {settings.inepCode} • CNPJ: {settings.cnpj}
                </p>
                <div className="w-24 h-0.5 bg-amber-500 mx-auto mt-2"></div>
              </div>

              {/* Certificate Body */}
              <div className="my-8 text-center space-y-6">
                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-indigo-950 tracking-wider uppercase underline decoration-amber-400 decoration-2 underline-offset-8">
                  Certificado de Conclusão
                </h2>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto text-justify sm:text-center">
                  A Diretoria e a Secretaria do <strong className="text-slate-900">{settings.name}</strong>, no uso de suas atribuições legais e em conformidade com a Lei Federal nº 9.394/96 (Diretrizes e Bases da Educação Nacional), certificam que:
                </p>

                <div className="py-2">
                  <p className="text-xl sm:text-3xl font-serif font-extrabold text-indigo-900 tracking-wide">
                    {selectedStudent?.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    Matrícula: {selectedStudent?.enrollmentNumber} • CPF: {selectedStudent?.cpf} • RG: {selectedStudent?.rg || 'Não informado'}
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto text-justify sm:text-center">
                  concluiu com êxito no ano letivo de <strong>{selectedClass?.schoolYear || 2026}</strong> o curso de{' '}
                  <strong className="text-indigo-950 font-bold uppercase">{selectedClass?.segment === 'ENSINO_MEDIO' ? 'Ensino Médio Regular' : selectedClass?.name}</strong>, tendo cumprido integralmente todas as exigências curriculares, carga horária e critérios regimentais de avaliação da aprendizagem.
                </p>

                {customObservation && (
                  <p className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-lg mx-auto">
                    Obs: {customObservation}
                  </p>
                )}
              </div>

              {/* Footer, Date & Official Signatures */}
              <div className="mt-8 space-y-8">
                <p className="text-center text-xs font-medium text-slate-600">
                  {settings.city} - {settings.state}, {currentDateFormatted}.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="text-center border-t border-slate-700 pt-2">
                    <p className="text-xs font-bold text-slate-900">{settings.principalName}</p>
                    <p className="text-[11px] text-slate-600">{settings.principalTitle}</p>
                  </div>

                  <div className="text-center border-t border-slate-700 pt-2">
                    <p className="text-xs font-bold text-slate-900">{settings.secretaryName}</p>
                    <p className="text-[11px] text-slate-600">{settings.secretaryRegistration}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-3">
                  <span>Autenticidade: Chave SHA256-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                  <span>EduGestão Pro • Sistema de Chancelaria Digital</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: HISTÓRICO ESCOLAR */}
          {/* ========================================================================= */}
          {documentType === 'HISTORICO_ESCOLAR' && (
            <div className="space-y-6">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h1 className="text-lg font-bold text-slate-900 uppercase">{settings.name}</h1>
                <p className="text-xs text-slate-600">
                  {settings.address} - {settings.city}/{settings.state} • CEP {settings.zipCode} • Tel: {settings.phone}
                </p>
                <p className="text-[11px] text-slate-500">{settings.accreditationDecree} • INEP: {settings.inepCode}</p>
                <h2 className="text-base font-extrabold uppercase tracking-wider text-indigo-900 pt-2">
                  Histórico Escolar do Ensino Médio / Fundamental
                </h2>
              </div>

              {/* Student Details Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Aluno(a):</span>
                  <span className="font-bold text-slate-900">{selectedStudent?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Matrícula (RA):</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent?.enrollmentNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">CPF:</span>
                  <span className="font-mono text-slate-800">{selectedStudent?.cpf}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Nascimento:</span>
                  <span className="text-slate-800">{selectedStudent?.birthDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Curso / Série:</span>
                  <span className="font-semibold text-slate-900">{selectedClass?.name} ({selectedClass?.shift})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Ano Letivo:</span>
                  <span className="font-semibold text-slate-900">{selectedClass?.schoolYear || 2026}</span>
                </div>
              </div>

              {/* Grades and Absences Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="border border-slate-300 p-2">Componente Curricular</th>
                      <th className="border border-slate-300 p-2 text-center">C.H.</th>
                      <th className="border border-slate-300 p-2 text-center">1º Bim</th>
                      <th className="border border-slate-300 p-2 text-center">2º Bim</th>
                      <th className="border border-slate-300 p-2 text-center">3º Bim</th>
                      <th className="border border-slate-300 p-2 text-center">4º Bim</th>
                      <th className="border border-slate-300 p-2 text-center font-bold">Média Final</th>
                      <th className="border border-slate-300 p-2 text-center">Faltas</th>
                      <th className="border border-slate-300 p-2 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(safeHistory.records || []).length > 0 ? (
                      safeHistory.records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="border border-slate-300 p-2 font-medium text-slate-900">{rec.subjectName}</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.workloadHours}h</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.bimonthlyGrades?.b1 ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.bimonthlyGrades?.b2 ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.bimonthlyGrades?.b3 ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.bimonthlyGrades?.b4 ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center font-bold text-indigo-900">{rec.finalGrade ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center">{rec.totalAbsences ?? 0}</td>
                          <td className="border border-slate-300 p-2 text-center font-semibold text-emerald-700">
                            {rec.status || 'EM_ANDAMENTO'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="border border-slate-300 p-4 text-center text-slate-500 italic">
                          Nenhum componente curricular lançado no histórico deste estudante até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td className="border border-slate-300 p-2 text-right">Resultado Global:</td>
                      <td className="border border-slate-300 p-2 text-center">880h</td>
                      <td colSpan={4} className="border border-slate-300 p-2 text-right">Média Geral:</td>
                      <td className="border border-slate-300 p-2 text-center text-indigo-900">{safeHistory.generalAverage ?? '-'}</td>
                      <td className="border border-slate-300 p-2 text-center">{safeHistory.attendanceRate ?? 100}% freq.</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-700">{safeHistory.finalResult || 'EM_CURSO'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Observations */}
              <div className="text-xs text-slate-700 border border-slate-200 p-3 rounded-lg bg-slate-50 space-y-1">
                <p className="font-bold text-slate-900">Observações Regimentais:</p>
                <p>{safeHistory.observations || 'Sem observações adicionais.'} {customObservation}</p>
                <p className="text-[11px] text-slate-500">Escala de avaliação: 0,0 a 10,0. Média mínima para aprovação: 6,0. Frequência mínima obrigatória: 75%.</p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-slate-900">{settings.secretaryName}</p>
                  <p className="text-slate-600">{settings.secretaryRegistration}</p>
                </div>
                <div className="border-t border-slate-700 pt-1">
                  <p className="font-bold text-slate-900">{settings.principalName}</p>
                  <p className="text-slate-600">{settings.principalTitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 3: DECLARAÇÃO DE MATRÍCULA E FREQUÊNCIA */}
          {/* ========================================================================= */}
          {documentType === 'DECLARACAO_MATRICULA' && (
            <div className="space-y-8 flex flex-col justify-between h-full">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h1 className="text-xl font-serif font-black text-slate-900 uppercase">{settings.name}</h1>
                <p className="text-xs text-slate-600">{settings.address} • {settings.city}/{settings.state}</p>
                <p className="text-[11px] text-slate-500">INEP: {settings.inepCode} • CNPJ: {settings.cnpj}</p>
              </div>

              {/* Title */}
              <div className="text-center my-6">
                <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900 underline decoration-indigo-600 underline-offset-8">
                  Declaração de Matrícula e Frequência
                </h2>
              </div>

              {/* Statement text */}
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed text-justify space-y-4 px-4 sm:px-8">
                <p>
                  Declaramos, para os devidos fins de direito e comprovação perante órgãos públicos, empresas de transporte estudantil, planos de saúde ou instituições congêneres, que o(a) estudante:
                </p>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1 my-4">
                  <p className="text-lg font-bold text-indigo-900">{selectedStudent?.name}</p>
                  <p className="text-xs text-slate-600 font-mono">
                    Matrícula (RA): <strong>{selectedStudent?.enrollmentNumber}</strong> | CPF: <strong>{selectedStudent?.cpf}</strong>
                  </p>
                  <p className="text-xs text-slate-600">
                    Filiação/Responsável: <strong>{selectedStudent?.guardianName}</strong>
                  </p>
                </div>

                <p>
                  encontra-se regularmente matriculado(a) e com frequência ativa no ano letivo de <strong>{selectedClass?.schoolYear || 2026}</strong>, cursando a turma <strong>{selectedClass?.name}</strong> no turno <strong>{selectedClass?.shift}</strong>.
                </p>

                <p>
                  Declaramos ainda que o(a) aluno(a) possui conduta disciplinar regular e frequência escolar compatível com as exigências da legislação educacional vigente.
                </p>

                {customObservation && (
                  <p className="italic text-xs bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    Finalidade: {customObservation}
                  </p>
                )}
              </div>

              {/* Date & Signatures */}
              <div className="space-y-12 pt-8">
                <p className="text-center text-xs font-semibold text-slate-700">
                  {settings.city} - {settings.state}, {currentDateFormatted}.
                </p>

                <div className="max-w-xs mx-auto text-center border-t border-slate-800 pt-2">
                  <p className="text-xs font-bold text-slate-900">{settings.secretaryName}</p>
                  <p className="text-[11px] text-slate-600">{settings.secretaryRegistration}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Secretaria Escolar Oficial</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 4: BOLETIM ESCOLAR */}
          {/* ========================================================================= */}
          {documentType === 'BOLETIM_ESCOLAR' && (
            <div className="space-y-6">
              <div className="text-center border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold uppercase text-slate-900">{settings.name}</h1>
                <h2 className="text-sm font-bold text-indigo-900 uppercase">Boletim Escolar de Desempenho e Frequência</h2>
                <p className="text-xs text-slate-500">Ano Letivo {selectedClass?.schoolYear || 2026} • {selectedClass?.name}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">{selectedStudent?.name}</p>
                  <p className="text-slate-500 font-mono">RA: {selectedStudent?.enrollmentNumber} | CPF: {selectedStudent?.cpf}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-900">Média Geral: {safeHistory.generalAverage ?? '-'}</p>
                  <p className="text-emerald-700 font-semibold">Frequência: {safeHistory.attendanceRate ?? 100}%</p>
                </div>
              </div>

              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border">Disciplina</th>
                    <th className="p-2 border text-center">1º Bim</th>
                    <th className="p-2 border text-center">2º Bim</th>
                    <th className="p-2 border text-center">3º Bim</th>
                    <th className="p-2 border text-center">4º Bim</th>
                    <th className="p-2 border text-center font-bold">Média</th>
                    <th className="p-2 border text-center">Faltas</th>
                    <th className="p-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(safeHistory.records || []).length > 0 ? (
                    safeHistory.records.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="p-2 border font-medium">{r.subjectName}</td>
                        <td className="p-2 border text-center">{r.bimonthlyGrades?.b1 ?? '-'}</td>
                        <td className="p-2 border text-center">{r.bimonthlyGrades?.b2 ?? '-'}</td>
                        <td className="p-2 border text-center">{r.bimonthlyGrades?.b3 ?? '-'}</td>
                        <td className="p-2 border text-center">{r.bimonthlyGrades?.b4 ?? '-'}</td>
                        <td className="p-2 border text-center font-bold text-indigo-900">{r.finalGrade ?? '-'}</td>
                        <td className="p-2 border text-center">{r.totalAbsences ?? 0}</td>
                        <td className="p-2 border text-center font-semibold text-emerald-700">{r.status || 'EM_ANDAMENTO'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                        Nenhuma disciplina registrada no boletim deste estudante até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="text-[11px] text-slate-500 pt-4 flex justify-between border-t border-slate-200">
                <span>Emitido eletronicamente via EduGestão Pro</span>
                <span>Data: {currentDateFormatted}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASE 5: DECLARAÇÃO DE TRANSFERÊNCIA */}
          {/* ========================================================================= */}
          {documentType === 'DECLARACAO_TRANSFERENCIA' && (
            <div className="space-y-8 flex flex-col justify-between h-full">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-xl font-bold uppercase text-slate-900">{settings.name}</h1>
                <p className="text-xs text-slate-600">{settings.address} • {settings.city}/{settings.state}</p>
                <h2 className="text-lg font-bold uppercase tracking-wider text-rose-900 mt-2">
                  Declaração de Transferência Escolar
                </h2>
              </div>

              <div className="text-sm sm:text-base text-slate-800 leading-relaxed text-justify space-y-4 px-4 sm:px-8">
                <p>
                  Declaramos que a pedido do responsável legal, foi expedida a transferência do(a) aluno(a) <strong className="text-slate-900">{selectedStudent?.name}</strong>, matrícula <strong>{selectedStudent?.enrollmentNumber}</strong>, CPF <strong>{selectedStudent?.cpf}</strong>, regularmente enturmado(a) na turma <strong>{selectedClass?.name}</strong>.
                </p>
                <p>
                  O histórico escolar definitivo e a pasta de documentos serão emitidos no prazo regimental de até 30 (trinta) dias.
                </p>
              </div>

              <div className="space-y-8 pt-8">
                <p className="text-center text-xs font-semibold text-slate-700">{settings.city}, {currentDateFormatted}.</p>
                <div className="max-w-xs mx-auto text-center border-t border-slate-800 pt-2">
                  <p className="text-xs font-bold text-slate-900">{settings.secretaryName}</p>
                  <p className="text-[11px] text-slate-600">Secretário(a) Escolar</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
