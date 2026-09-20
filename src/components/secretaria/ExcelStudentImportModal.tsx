import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Users,
  Check,
  RefreshCw,
  Eye,
  Trash2,
  Table,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SchoolClass } from '../../types';

interface ExcelStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  onImportStudents: (newStudents: Student[]) => void;
}

interface ParsedStudentRow {
  name: string;
  enrollmentNumber: string;
  cpf: string;
  birthDate: string;
  gradeLevel: string;
  classId: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  nis: string;
  email: string;
  isValid: boolean;
  validationError?: string;
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportStudents,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const openFileSelector = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Download official Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nome Completo': 'Ana Clara Pereira da Silva',
        'Matrícula/RA': 'RA-2026-091',
        'CPF do Aluno': '123.456.789-00',
        'Data de Nascimento': '2012-05-14',
        'Turma/Série': classes[0]?.name || '1º Ano A - EF',
        'Nome do Responsável': 'Mariana Pereira da Silva',
        'WhatsApp/Telefone': '(11) 98765-4321',
        'Endereço': 'Rua das Acácias, 120 - Centro',
        'NIS/Bolsa Família': '12345678901',
        'E-mail': 'mariana.silva@email.com',
      },
      {
        'Nome Completo': 'Bruno Henrique Souza',
        'Matrícula/RA': 'RA-2026-092',
        'CPF do Aluno': '234.567.890-11',
        'Data de Nascimento': '2011-09-22',
        'Turma/Série': classes[1]?.name || '2º Ano A - EF',
        'Nome do Responsável': 'Cláudio Souza',
        'WhatsApp/Telefone': '(11) 97654-3210',
        'Endereço': 'Av. Brasil, 450 - Bairro Novo',
        'NIS/Bolsa Família': '98765432100',
        'E-mail': 'claudio.souza@email.com',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Importacao_Alunos');
    XLSX.writeFile(wb, 'SucessoEdu_Modelo_Importacao_Alunos.xlsx');
  };

  // Process File buffer
  const processFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        const processed: ParsedStudentRow[] = rawData.map((row, index) => {
          const name = String(row['Nome Completo'] || row['Nome'] || row['Aluno'] || '').trim();
          const ra = String(
            row['Matrícula/RA'] || row['Matricula'] || row['RA'] || `RA-2026-${100 + index}`
          ).trim();
          const cpf = String(row['CPF do Aluno'] || row['CPF'] || '').trim();
          const birthDate = String(row['Data de Nascimento'] || row['Nascimento'] || '2012-01-01').trim();
          const gradeLevel = String(row['Turma/Série'] || row['Turma'] || row['Serie'] || '').trim();
          const guardianName = String(row['Nome do Responsável'] || row['Responsável'] || '').trim();
          const guardianPhone = String(row['WhatsApp/Telefone'] || row['Telefone'] || '').trim();
          const address = String(row['Endereço'] || row['Endereco'] || '').trim();
          const nis = String(row['NIS/Bolsa Família'] || row['NIS'] || '').trim();
          const email = String(row['E-mail'] || row['Email'] || '').trim();

          // Match or assign class
          let matchedClass = classes.find(
            (c) =>
              c.name.toLowerCase() === gradeLevel.toLowerCase() ||
              c.code.toLowerCase() === gradeLevel.toLowerCase()
          );
          if (!matchedClass && classes.length > 0) {
            matchedClass = classes[0];
          }

          let isValid = true;
          let validationError = '';
          if (!name) {
            isValid = false;
            validationError = 'Nome do aluno ausente';
          }

          return {
            name,
            enrollmentNumber: ra,
            cpf: cpf || '000.000.000-00',
            birthDate,
            gradeLevel: gradeLevel || matchedClass?.gradeLevel || 'Ensino Fundamental',
            classId: matchedClass?.id || classes[0]?.id || 'cls-default',
            className: matchedClass?.name || gradeLevel || 'Turma A',
            guardianName,
            guardianPhone,
            address,
            nis,
            email,
            isValid,
            validationError,
          };
        });

        setParsedRows(processed);
        setIsProcessing(false);
      } catch (err) {
        console.error('Erro ao ler arquivo Excel:', err);
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle file reading from XLSX or CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Perform import
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newStudentObjects: Student[] = validRows.map((r, i) => ({
      id: `std-imp-${Date.now()}-${i}`,
      name: r.name,
      enrollmentNumber: r.enrollmentNumber || `MAT-${Date.now().toString().slice(-4)}${i}`,
      cpf: r.cpf || '',
      birthDate: r.birthDate || '2015-01-01',
      gender: 'M',
      phone: r.guardianPhone || '',
      email: r.email || '',
      guardianName: r.guardianName || 'Responsável Legal',
      guardianPhone: r.guardianPhone || '',
      address: r.address || 'Endereço não informado',
      city: 'Sede Municipal',
      state: 'UF',
      zipCode: '00000-000',
      courseId: 'crs-ef',
      classId: r.classId,
      status: 'ACTIVE',
      entryDate: new Date().toISOString(),
    }));

    onImportStudents(newStudentObjects);
    setImportedCount(newStudentObjects.length);
    setImportSuccess(true);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Importação em Lote de Alunos via Excel (.xlsx / .csv)
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre dezenas ou centenas de estudantes instantaneamente importando a planilha de censo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {importSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Importação Concluída com Sucesso!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Foram importados e integrados <strong>{importedCount} estudantes</strong> à base de dados da secretaria escolar e alocados nas respectivas turmas.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Fechar e Visualizar Alunos
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1: Upload or Download template */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <Download className="h-4 w-4 text-indigo-600" />
                    1. Baixar Planilha Modelo Oficial
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Obtenha o arquivo Excel pré-formatado com todas as colunas necessárias para evitar erros de leitura.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="py-2 px-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Baixar Modelo (.XLSX)</span>
                </button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={handleFileDrop}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDragging
                    ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    2. Selecionar Arquivo para Leitura
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Formatos suportados: <strong>.xlsx, .xls, .csv</strong> gerados por qualquer software escolar ou censo.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    onChange={handleFileUpload}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={openFileSelector}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{fileName ? `Trocar Arquivo (${fileName})` : '📁 Selecionar Arquivo do Computador'}</span>
                  </button>
                  {fileName && (
                    <div className="text-[11px] text-emerald-700 font-medium text-center truncate">
                      ✓ Arquivo selecionado: <strong className="font-mono">{fileName}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Preview Parsed Data */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pré-visualização dos Dados ({parsedRows.length} registros)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {validCount} Válidos
                    </span>
                    {invalidCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {invalidCount} com Alertas
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpar</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Nome do Aluno</th>
                        <th className="py-2 px-3">RA / Matrícula</th>
                        <th className="py-2 px-3">Turma Alocada</th>
                        <th className="py-2 px-3">Responsável</th>
                        <th className="py-2 px-3">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                                <Check className="h-3.5 w-3.5" /> Ok
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1 text-[11px] font-bold">
                                <AlertCircle className="h-3.5 w-3.5" /> {row.validationError}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{row.enrollmentNumber}</td>
                          <td className="py-2 px-3 text-indigo-700 font-medium">{row.className}</td>
                          <td className="py-2 px-3 text-slate-600">{row.guardianName || '—'}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{row.guardianPhone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={validCount === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar Importação de {validCount} Alunos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
