import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Subject,
  Course,
  AcademicHistory,
  Question,
  Exam,
  ExamSubmission,
  SchoolSettings,
  NotificationItem,
  CommunicationMessage,
  RoleNotificationPreferences,
  UserRole,
} from './types';
import { getStoredData, saveStoredData } from './data/storage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StudentList } from './components/secretaria/StudentList';
import { ClassManagement } from './components/secretaria/ClassManagement';
import { DocumentIssuer, DocumentType } from './components/documentos/DocumentIssuer';
import { QuestionBank } from './components/questoes/QuestionBank';
import { ExamManager } from './components/provas/ExamManager';
import { StudentExamRoom } from './components/provas/StudentExamRoom';
import { PedagogicalDashboard } from './components/relatorios/PedagogicalDashboard';
import { CommunicationModule } from './components/comunicacao/CommunicationModule';
import { NotificationCenterModal } from './components/notificacoes/NotificationCenterModal';
import { NetworkInstaller } from './components/config/NetworkInstaller';
import { AboutSystem } from './components/sobre/AboutSystem';
import { Bell, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('PEDAGOGICAL_DASHBOARD');
  const [data, setData] = useState(() => getStoredData());

  // Persona / User Role state (Admin, Teacher, Student, Parent)
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  // Sub-navigation state for document issuance and exam taking
  const [documentSelectedStudentId, setDocumentSelectedStudentId] = useState<string | undefined>();
  const [documentSelectedType, setDocumentSelectedType] = useState<DocumentType>('CERTIFICADO_CONCLUSAO');
  const [activeExamIdForTaking, setActiveExamIdForTaking] = useState<string | null>(null);

  // Notification modal & push toast banner
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string } | null>(null);

  // Question Bank to Exam Builder bridging state
  const [preselectedQuestionIdsForExam, setPreselectedQuestionIdsForExam] = useState<string[]>([]);

  // Sync to storage on data change
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Audio cue helper for notifications
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext fallback
    }
  };

  // Push notification trigger
  const triggerPushNotification = (title: string, body: string) => {
    // Show toast banner
    setToastNotification({ title, body });
    setTimeout(() => {
      setToastNotification(null);
    }, 5000);

    // Play sound if enabled
    const userPrefs = data.rolePreferences?.[currentRole];
    if (userPrefs?.soundEnabled !== false) {
      playNotificationSound();
    }

    // Try browser native notifications if permitted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon.png',
          });
        } catch {
          // Native notification fallback
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            try {
              new Notification(title, { body });
            } catch {}
          }
        });
      }
    }
  };

  // Students handlers with auto-notification
  const handleSaveStudent = (student: Student) => {
    setData((prev) => {
      const exists = prev.students.some((s) => s.id === student.id);
      const updated = exists
        ? prev.students.map((s) => (s.id === student.id ? student : s))
        : [student, ...prev.students];

      // Create notification for enrollment status
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: exists ? 'Matrícula Atualizada' : 'Nova Matrícula Homologada',
        message: `A ficha cadastral de ${student.name} (RA ${student.enrollmentNumber}) foi registrada com sucesso.`,
        type: 'ENROLLMENT_STATUS',
        priority: 'NORMAL',
        targetRoles: ['ADMIN', 'PARENT', 'STUDENT'],
        targetUserId: student.id,
        actionTab: 'STUDENTS',
        actionLabel: 'Ver Ficha do Aluno',
        createdAt: new Date().toISOString(),
        read: false,
      };

      return {
        ...prev,
        students: updated,
        notifications: [newNotif, ...(prev.notifications || [])],
      };
    });

    triggerPushNotification(
      '📋 Matrícula Registrada',
      `Ficha cadastral de ${student.name} atualizada na secretaria escolar.`
    );
  };

  const handleDeleteStudent = (id: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
  };

  const handleIssueDocument = (studentId: string, docType?: string) => {
    setDocumentSelectedStudentId(studentId);
    if (docType) {
      setDocumentSelectedType(docType as DocumentType);
    }
    setActiveTab('DOCUMENTS');
  };

  // Classes handler
  const handleSaveClass = (newClass: SchoolClass) => {
    setData((prev) => {
      const exists = prev.classes.some((c) => c.id === newClass.id);
      const updated = exists
        ? prev.classes.map((c) => (c.id === newClass.id ? newClass : c))
        : [...prev.classes, newClass];
      return { ...prev, classes: updated };
    });
  };

  const handleDeleteClass = (id: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
  };

  // Question Bank handlers
  const handleSaveQuestion = (question: Question) => {
    setData((prev) => {
      const exists = prev.questions.some((q) => q.id === question.id);
      const updated = exists
        ? prev.questions.map((q) => (q.id === question.id ? question : q))
        : [question, ...prev.questions];
      return { ...prev, questions: updated };
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const handleBatchImportQuestions = (imported: Question[]) => {
    setData((prev) => ({
      ...prev,
      questions: [...imported, ...prev.questions],
    }));
  };

  const handleCreateExamFromQuestions = (questionIds: string[]) => {
    setPreselectedQuestionIdsForExam(questionIds);
    setActiveTab('EXAMS');
  };

  // Exams handlers with auto-notification
  const handleSaveExam = (exam: Exam) => {
    setData((prev) => {
      const exists = prev.exams.some((e) => e.id === exam.id);
      const updated = exists
        ? prev.exams.map((e) => (e.id === exam.id ? exam : e))
        : [exam, ...prev.exams];

      // If published, notify students and parents
      const notifs = [...(prev.notifications || [])];
      if (exam.status === 'PUBLISHED') {
        const examNotif: NotificationItem = {
          id: `notif-exam-${Date.now()}`,
          title: `Nova Avaliação Disponível: ${exam.title}`,
          message: `A avaliação de ${exam.subject} foi disponibilizada com prazo até ${new Date(
            exam.dueDateTime
          ).toLocaleDateString('pt-BR')}.`,
          type: 'EXAM_AVAILABLE',
          priority: 'HIGH',
          targetRoles: ['STUDENT', 'PARENT', 'TEACHER'],
          targetClassId: exam.classId,
          actionTab: 'STUDENT_ROOM',
          actionLabel: 'Iniciar Avaliação',
          createdAt: new Date().toISOString(),
          read: false,
          metadata: {
            examId: exam.id,
            examTitle: exam.title,
            deadlineDate: exam.dueDateTime,
          },
        };
        notifs.unshift(examNotif);

        triggerPushNotification(
          `📝 Nova Prova: ${exam.title}`,
          `Disponível para realização na Sala do Estudante.`
        );
      }

      return { ...prev, exams: updated, notifications: notifs };
    });
  };

  const handleDeleteExam = (id: string) => {
    setData((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== id),
    }));
  };

  const handleTakeExam = (examId: string) => {
    setActiveExamIdForTaking(examId);
    setActiveTab('STUDENT_ROOM');
  };

  // Exam submission handler with auto-notification for results
  const handleFinishSubmission = (submission: ExamSubmission) => {
    setData((prev) => {
      const notifResult: NotificationItem = {
        id: `notif-sub-${Date.now()}`,
        title: `Resultado da Prova: ${submission.studentName}`,
        message: `Avaliação finalizada com aproveitamento de ${submission.percentage}% (Nota ${submission.totalScore.toFixed(
          1
        )}/${submission.maxScore}).`,
        type: 'EXAM_RESULT',
        priority: submission.status === 'REPROVADO' ? 'HIGH' : 'NORMAL',
        targetRoles: ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'],
        targetUserId: submission.studentId,
        actionTab: 'PEDAGOGICAL_DASHBOARD',
        actionLabel: 'Ver Espelho de Correção',
        createdAt: new Date().toISOString(),
        read: false,
        metadata: {
          studentId: submission.studentId,
          studentName: submission.studentName,
          score: submission.totalScore,
        },
      };

      return {
        ...prev,
        submissions: [submission, ...prev.submissions],
        notifications: [notifResult, ...(prev.notifications || [])],
      };
    });

    triggerPushNotification(
      '🎯 Prova Corrigida Instantaneamente',
      `Nota ${submission.totalScore.toFixed(1)} registrada para ${submission.studentName}.`
    );
  };

  const handleViewReport = (examId: string) => {
    setActiveTab('PEDAGOGICAL_DASHBOARD');
  };

  // Notification management handlers
  const handleMarkNotificationAsRead = (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
    }));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.targetRoles.includes(currentRole) || n.targetRoles.length === 0
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n
      ),
    }));
  };

  const handleDeleteNotification = (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const handleSaveNotificationPreferences = (
    role: UserRole,
    prefs: RoleNotificationPreferences
  ) => {
    setData((prev) => ({
      ...prev,
      rolePreferences: {
        ...prev.rolePreferences,
        [role]: prefs,
      },
    }));
    triggerPushNotification(
      '⚙️ Preferências Salvas',
      `Configurações de alerta para o perfil ${role} atualizadas.`
    );
  };

  // Communication message handlers
  const handleSendMessage = (
    newMsg: Omit<CommunicationMessage, 'id' | 'createdAt' | 'readConfirmations'>
  ) => {
    const messageId = `msg-${Date.now()}`;
    const fullMessage: CommunicationMessage = {
      ...newMsg,
      id: messageId,
      createdAt: new Date().toISOString(),
      readConfirmations: [],
    };

    // Auto-create notification if push is enabled
    const newNotification: NotificationItem = {
      id: `notif-msg-${Date.now()}`,
      title: `📢 ${newMsg.title}`,
      message: `${newMsg.content.substring(0, 120)}...`,
      type: newMsg.priority === 'URGENTE' ? 'IMPORTANT_ANNOUNCEMENT' : 'DIRECT_MESSAGE',
      priority: newMsg.priority === 'URGENTE' ? 'URGENT' : 'NORMAL',
      targetRoles: newMsg.targetRoles,
      targetClassId: newMsg.targetClassId,
      targetUserId: newMsg.targetStudentId,
      actionTab: 'COMMUNICATION',
      actionLabel: 'Ler Comunicado Completo',
      createdAt: new Date().toISOString(),
      read: false,
      metadata: {
        announcementId: messageId,
        senderName: newMsg.senderName,
      },
    };

    setData((prev) => ({
      ...prev,
      communications: [fullMessage, ...(prev.communications || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));
  };

  const handleConfirmRead = (
    messageId: string,
    userId: string,
    userName: string,
    userRole: UserRole
  ) => {
    setData((prev) => ({
      ...prev,
      communications: prev.communications.map((msg) => {
        if (msg.id === messageId) {
          const already = msg.readConfirmations.some((c) => c.userId === userId);
          if (!already) {
            return {
              ...msg,
              readConfirmations: [
                ...msg.readConfirmations,
                { userId, userName, userRole, confirmedAt: new Date().toISOString() },
              ],
            };
          }
        }
        return msg;
      }),
    }));

    triggerPushNotification(
      '✅ Leitura Confirmada',
      `Sua confirmação foi registrada nos autos institucionais.`
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setData((prev) => ({
      ...prev,
      communications: prev.communications.filter((m) => m.id !== messageId),
    }));
  };

  const examForStudentRoom =
    data.exams.find((e) => e.id === activeExamIdForTaking) || data.exams[0];

  const unreadNotificationCount = (data.notifications || []).filter(
    (n) => !n.read && (n.targetRoles.includes(currentRole) || n.targetRoles.length === 0)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased relative">
      {/* Toast Notification Banner (Native & Push Simulation) */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-white">{toastNotification.title}</h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {toastNotification.body}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <Header
        schoolName={data.settings.name}
        activeTab={activeTab}
        onSelectTab={(tab, payload) => {
          if (tab === 'NOTIFICATIONS') {
            setIsNotificationModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        notifications={data.notifications || []}
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Bento Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar (Hidden on print) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'NOTIFICATIONS') {
              setIsNotificationModalOpen(true);
            } else {
              setActiveTab(tab);
              if (tab === 'STUDENT_ROOM' && !activeExamIdForTaking && data.exams.length > 0) {
                setActiveExamIdForTaking(data.exams[0].id);
              }
            }
          }}
          counts={{
            students: data.students.length,
            exams: data.exams.length,
            questions: data.questions.length,
            submissions: data.submissions.length,
            unreadNotifications: unreadNotificationCount,
            unreadMessages: (data.communications || []).length,
          }}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* TAB: SECRETARIA / ESTUDANTES */}
            {activeTab === 'STUDENTS' && (
              <StudentList
                students={data.students}
                classes={data.classes}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onIssueDocument={handleIssueDocument}
              />
            )}

            {/* TAB: TURMAS E MATRIZES */}
            {activeTab === 'CLASSES' && (
              <ClassManagement
                classes={data.classes}
                courses={data.courses}
                subjects={data.subjects}
                students={data.students}
                onSaveClass={handleSaveClass}
                onDeleteClass={handleDeleteClass}
              />
            )}

            {/* TAB: EMISSÃO DE DOCUMENTOS E CERTIFICADOS */}
            {activeTab === 'DOCUMENTS' && (
              <DocumentIssuer
                students={data.students}
                classes={data.classes}
                histories={data.academicHistories}
                settings={data.settings}
                preSelectedStudentId={documentSelectedStudentId}
                preSelectedDocType={documentSelectedType}
              />
            )}

            {/* TAB: MÓDULO DE COMUNICAÇÃO & MURAL DE AVISOS */}
            {activeTab === 'COMMUNICATION' && (
              <CommunicationModule
                messages={data.communications || []}
                classes={data.classes}
                students={data.students}
                settings={data.settings}
                currentRole={currentRole}
                onSendMessage={handleSendMessage}
                onConfirmRead={handleConfirmRead}
                onDeleteMessage={handleDeleteMessage}
                onTriggerPushNotification={triggerPushNotification}
              />
            )}

            {/* TAB: BANCO DE QUESTÕES */}
            {activeTab === 'QUESTION_BANK' && (
              <QuestionBank
                questions={data.questions}
                subjects={data.subjects}
                onSaveQuestion={handleSaveQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onBatchImport={handleBatchImportQuestions}
                onCreateExamWithQuestions={handleCreateExamFromQuestions}
              />
            )}

            {/* TAB: GERENCIADOR DE PROVAS */}
            {activeTab === 'EXAMS' && (
              <ExamManager
                exams={data.exams}
                questions={data.questions}
                classes={data.classes}
                subjects={data.subjects}
                submissions={data.submissions}
                settings={data.settings}
                onSaveExam={handleSaveExam}
                onDeleteExam={handleDeleteExam}
                onTakeExamAsStudent={handleTakeExam}
                onViewReport={handleViewReport}
                initialSelectedQuestionIds={preselectedQuestionIdsForExam}
              />
            )}

            {/* TAB: SALA DE AVALIAÇÃO DO ALUNO (COM CRONÔMETRO E CORREÇÃO INSTANTÂNEA) */}
            {activeTab === 'STUDENT_ROOM' && (
              <div>
                {examForStudentRoom ? (
                  <StudentExamRoom
                    exam={examForStudentRoom}
                    questions={data.questions}
                    students={data.students}
                    onFinishSubmission={handleFinishSubmission}
                    onExit={() => setActiveTab('EXAMS')}
                  />
                ) : (
                  <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm">Nenhuma prova cadastrada para realização.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: DASHBOARD PEDAGÓGICO COM BENTO GRID */}
            {activeTab === 'PEDAGOGICAL_DASHBOARD' && (
              <PedagogicalDashboard
                exams={data.exams}
                questions={data.questions}
                students={data.students}
                classes={data.classes}
                submissions={data.submissions}
              />
            )}

            {/* TAB: INSTALADOR CLIENTE / SERVIDOR & REDE */}
            {activeTab === 'NETWORK_INSTALLER' && <NetworkInstaller />}

            {/* TAB: SOBRE O SISTEMA */}
            {activeTab === 'ABOUT' && <AboutSystem settings={data.settings} />}
          </div>
        </main>
      </div>

      {/* CENTRAL DE NOTIFICAÇÕES MODAL */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={data.notifications || []}
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
        preferences={data.rolePreferences}
        onSavePreferences={handleSaveNotificationPreferences}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onNavigateTab={(tab, payload) => {
          setActiveTab(tab);
          if (tab === 'DOCUMENTS' && payload?.studentId) {
            setDocumentSelectedStudentId(payload.studentId);
          }
          if (tab === 'STUDENT_ROOM' && payload?.examId) {
            setActiveExamIdForTaking(payload.examId);
          }
        }}
        onTriggerTestPush={() => {
          triggerPushNotification(
            '🔔 Teste de Notificação Push',
            'O canal de notificações está 100% operacional no seu navegador.'
          );
        }}
      />
    </div>
  );
}
