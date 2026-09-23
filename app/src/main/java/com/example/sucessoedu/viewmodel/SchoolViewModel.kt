package com.example.sucessoedu.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.sucessoedu.data.model.*
import com.example.sucessoedu.data.repository.SchoolRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class SchoolUiState(
    val students: List<Student> = emptyList(),
    val classes: List<SchoolClass> = emptyList(),
    val teachers: List<Teacher> = emptyList(),
    val attendanceRecords: List<AttendanceRecord> = emptyList(),
    val grades: List<GradeRecord> = emptyList(),
    val questions: List<Question> = emptyList(),
    val exams: List<Exam> = emptyList(),
    val financeRecords: List<FinanceRecord> = emptyList(),
    val notifications: List<NotificationItem> = emptyList(),
    val currentUserRole: UserRole = UserRole.MASTER,
    val schoolInfo: SchoolInfo = SchoolInfo(),
    val searchQuery: String = "",
    val selectedClassFilter: String = "ALL",
    val selectedStatusFilter: String = "ALL",
    val selectedSubjectFilter: String = "ALL",
    val userToast: String? = null
)

class SchoolViewModel(private val repository: SchoolRepository) : ViewModel() {

    private val _currentUserRole = MutableStateFlow(UserRole.MASTER)
    private val _schoolInfo = MutableStateFlow(SchoolInfo())
    private val _searchQuery = MutableStateFlow("")
    private val _selectedClassFilter = MutableStateFlow("ALL")
    private val _selectedStatusFilter = MutableStateFlow("ALL")
    private val _selectedSubjectFilter = MutableStateFlow("ALL")
    private val _userToast = MutableStateFlow<String?>(null)

    val uiState: StateFlow<SchoolUiState> = combine(
        repository.allStudents,
        repository.allClasses,
        repository.allTeachers,
        repository.allAttendance,
        repository.allGrades,
        repository.allQuestions,
        repository.allExams,
        repository.allFinance,
        repository.allNotifications,
        _currentUserRole,
        _schoolInfo,
        _searchQuery,
        _selectedClassFilter,
        _selectedStatusFilter,
        _selectedSubjectFilter,
        _userToast
    ) { args: Array<Any?> ->
        @Suppress("UNCHECKED_CAST")
        SchoolUiState(
            students = args[0] as List<Student>,
            classes = args[1] as List<SchoolClass>,
            teachers = args[2] as List<Teacher>,
            attendanceRecords = args[3] as List<AttendanceRecord>,
            grades = args[4] as List<GradeRecord>,
            questions = args[5] as List<Question>,
            exams = args[6] as List<Exam>,
            financeRecords = args[7] as List<FinanceRecord>,
            notifications = args[8] as List<NotificationItem>,
            currentUserRole = args[9] as UserRole,
            schoolInfo = args[10] as SchoolInfo,
            searchQuery = args[11] as String,
            selectedClassFilter = args[12] as String,
            selectedStatusFilter = args[13] as String,
            selectedSubjectFilter = args[14] as String,
            userToast = args[15] as String?
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SchoolUiState()
    )

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setClassFilter(classId: String) {
        _selectedClassFilter.value = classId
    }

    fun setStatusFilter(status: String) {
        _selectedStatusFilter.value = status
    }

    fun setSubjectFilter(subject: String) {
        _selectedSubjectFilter.value = subject
    }

    fun setUserRole(role: UserRole) {
        _currentUserRole.value = role
        showToast("Perfil alterado para ${role.label}")
    }

    fun showToast(msg: String) {
        _userToast.value = msg
    }

    fun clearToast() {
        _userToast.value = null
    }

    // --- Student Actions ---
    fun saveStudent(student: Student) {
        viewModelScope.launch {
            repository.insertOrUpdateStudent(student)
            showToast("Aluno ${student.name} salvo com sucesso!")
        }
    }

    fun deleteStudent(studentId: String) {
        viewModelScope.launch {
            repository.deleteStudent(studentId)
            showToast("Matrícula removida do sistema.")
        }
    }

    // --- Class Actions ---
    fun saveClass(schoolClass: SchoolClass) {
        viewModelScope.launch {
            repository.insertOrUpdateClass(schoolClass)
            showToast("Turma ${schoolClass.name} salva!")
        }
    }

    fun deleteClass(schoolClass: SchoolClass) {
        viewModelScope.launch {
            repository.deleteClass(schoolClass)
            showToast("Turma ${schoolClass.name} excluída.")
        }
    }

    // --- Teacher Actions ---
    fun saveTeacher(teacher: Teacher) {
        viewModelScope.launch {
            repository.insertOrUpdateTeacher(teacher)
            showToast("Professor ${teacher.name} salvo!")
        }
    }

    fun deleteTeacher(teacher: Teacher) {
        viewModelScope.launch {
            repository.deleteTeacher(teacher)
            showToast("Professor removido.")
        }
    }

    // --- Attendance Actions ---
    fun recordDailyAttendance(classId: String, date: String, attendanceMap: Map<String, AttendanceStatus>) {
        viewModelScope.launch {
            val students = uiState.value.students.filter { it.classId == classId }
            val records = students.map { student ->
                val status = attendanceMap[student.id] ?: AttendanceStatus.PRESENT
                AttendanceRecord(
                    id = "att-${classId}-${student.id}-${date}",
                    classId = classId,
                    studentId = student.id,
                    studentName = student.name,
                    date = date,
                    status = status
                )
            }
            repository.saveAttendanceRecords(records)
            showToast("Chamada da turma registrada para $date!")
        }
    }

    // --- Grade Actions ---
    fun saveGrade(grade: GradeRecord) {
        viewModelScope.launch {
            repository.saveGrade(grade)
            showToast("Nota atualizada para ${grade.studentName}!")
        }
    }

    // --- Question Actions ---
    fun saveQuestion(question: Question) {
        viewModelScope.launch {
            repository.insertQuestion(question)
            showToast("Questão adicionada ao Banco BNCC!")
        }
    }

    fun deleteQuestion(question: Question) {
        viewModelScope.launch {
            repository.deleteQuestion(question)
            showToast("Questão excluída.")
        }
    }

    // --- Exam Actions ---
    fun createExam(title: String, subject: String, classId: String, totalPoints: Double, questionIds: List<String>) {
        viewModelScope.launch {
            val exam = Exam(
                id = "exm-${System.currentTimeMillis()}",
                title = title,
                subject = subject,
                classId = classId,
                totalPoints = totalPoints,
                date = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE),
                questionIds = questionIds
            )
            repository.saveExam(exam)
            showToast("Avaliação '$title' gerada com sucesso!")
        }
    }

    fun deleteExam(exam: Exam) {
        viewModelScope.launch {
            repository.deleteExam(exam)
            showToast("Avaliação excluída.")
        }
    }

    // --- Finance Actions ---
    fun togglePayment(record: FinanceRecord) {
        viewModelScope.launch {
            val newStatus = if (record.paymentStatus == PaymentStatus.PAID) PaymentStatus.PENDING else PaymentStatus.PAID
            val updated = record.copy(
                paymentStatus = newStatus,
                paymentDate = if (newStatus == PaymentStatus.PAID) LocalDate.now().toString() else null
            )
            repository.saveFinance(updated)
            showToast("Status da mensalidade atualizado para ${newStatus.label}!")
        }
    }

    fun addFinanceRecord(record: FinanceRecord) {
        viewModelScope.launch {
            repository.saveFinance(record)
            showToast("Cobrança/Mensalidade registrada!")
        }
    }

    // --- Notification Actions ---
    fun markNotificationRead(id: String) {
        viewModelScope.launch {
            repository.markNotificationAsRead(id)
        }
    }

    fun sendBroadcastNotification(title: String, message: String, category: String, highPriority: Boolean) {
        viewModelScope.launch {
            val notif = NotificationItem(
                id = "notif-${System.currentTimeMillis()}",
                title = title,
                message = message,
                category = category,
                date = LocalDate.now().toString(),
                read = false,
                highPriority = highPriority
            )
            repository.addNotification(notif)
            showToast("Comunicado escolar transmitido para toda a rede!")
        }
    }

    fun updateSchoolInfo(info: SchoolInfo) {
        _schoolInfo.value = info
        showToast("Dados da Unidade Escolar atualizados!")
    }
}

class SchoolViewModelFactory(private val repository: SchoolRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(SchoolViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return SchoolViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
