package com.example.sucessoedu.ui.screens.students

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.sucessoedu.data.model.Student
import com.example.sucessoedu.data.model.StudentStatus
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentsScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }
    var selectedClassId by remember { mutableStateOf("ALL") }

    var studentToView by remember { mutableStateOf<Student?>(null) }
    var studentToEdit by remember { mutableStateOf<Student?>(null) }
    var isAddStudentOpen by remember { mutableStateOf(false) }

    val filteredStudents = remember(state.students, searchQuery, selectedFilter, selectedClassId) {
        state.students.filter { student ->
            val matchesQuery = student.name.contains(searchQuery, ignoreCase = true) ||
                    student.enrollmentNumber.contains(searchQuery, ignoreCase = true) ||
                    student.cpf.contains(searchQuery, ignoreCase = true)

            val matchesFilter = when (selectedFilter) {
                "ACTIVE" -> student.status == StudentStatus.ACTIVE
                "DROPOUT_RISK" -> student.dropoutRisk
                "SPECIAL_NEEDS" -> student.specialCondition.isNotBlank()
                else -> true
            }

            val matchesClass = if (selectedClassId == "ALL") true else student.classId == selectedClassId

            matchesQuery && matchesFilter && matchesClass
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    studentToEdit = null
                    isAddStudentOpen = true
                },
                icon = { Icon(Icons.Default.PersonAdd, contentDescription = "Nova Matrícula") },
                text = { Text("Nova Matrícula") },
                containerColor = IndigoPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_student_fab")
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Search Bar
            SearchBarField(
                query = searchQuery,
                onQueryChange = { searchQuery = it },
                placeholder = "Buscar aluno por nome, matrícula ou CPF..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Filter Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    FilterChip(
                        selected = selectedFilter == "ALL",
                        onClick = { selectedFilter = "ALL" },
                        label = { Text("Todos (${state.students.size})") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "ACTIVE",
                        onClick = { selectedFilter = "ACTIVE" },
                        label = { Text("Ativos (${state.students.count { it.status == StudentStatus.ACTIVE }})") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "DROPOUT_RISK",
                        onClick = { selectedFilter = "DROPOUT_RISK" },
                        label = { Text("Risco Evasão (${state.students.count { it.dropoutRisk }})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = RoseContainer,
                            selectedLabelColor = OnRoseContainer
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "SPECIAL_NEEDS",
                        onClick = { selectedFilter = "SPECIAL_NEEDS" },
                        label = { Text("AEE / Especial (${state.students.count { it.specialCondition.isNotBlank() }})") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Student Count Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${filteredStudents.size} aluno(s) listado(s)",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Student Cards List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredStudents, key = { it.id }) { student ->
                    StudentCard(
                        student = student,
                        onView = { studentToView = student },
                        onEdit = {
                            studentToEdit = student
                            isAddStudentOpen = true
                        },
                        onDelete = { viewModel.deleteStudent(student.id) }
                    )
                }
            }
        }
    }

    // Detail Dialog
    studentToView?.let { student ->
        StudentDetailDialog(
            student = student,
            onDismiss = { studentToView = null },
            onEdit = {
                studentToView = null
                studentToEdit = student
                isAddStudentOpen = true
            },
            onToggleRisk = {
                val updated = student.copy(dropoutRisk = !student.dropoutRisk)
                viewModel.saveStudent(updated)
                studentToView = updated
            }
        )
    }

    // Add / Edit Dialog
    if (isAddStudentOpen) {
        StudentFormDialog(
            studentToEdit = studentToEdit,
            classes = state.classes,
            onDismiss = { isAddStudentOpen = false },
            onSave = { savedStudent ->
                viewModel.saveStudent(savedStudent)
                isAddStudentOpen = false
            }
        )
    }
}

@Composable
private fun StudentCard(
    student: Student,
    onView: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onView() }
            .testTag("student_card_${student.id}"),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(if (student.dropoutRisk) RoseContainer else IndigoContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (student.dropoutRisk) Icons.Default.Warning else Icons.Default.Person,
                    contentDescription = null,
                    tint = if (student.dropoutRisk) RoseAlert else IndigoPrimary,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = student.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    StatusBadge(
                        text = student.status.label,
                        color = if (student.status == StudentStatus.ACTIVE) EmeraldSuccess else RoseAlert,
                        backgroundColor = if (student.status == StudentStatus.ACTIVE) EmeraldContainer else RoseContainer
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "${student.className} • Matrícula: ${student.enrollmentNumber}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (student.specialCondition.isNotBlank() || student.dropoutRisk) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (student.dropoutRisk) {
                            StatusBadge(
                                text = "Risco Evasão",
                                color = RoseAlert,
                                backgroundColor = RoseContainer
                            )
                        }
                        if (student.specialCondition.isNotBlank()) {
                            StatusBadge(
                                text = "AEE: ${student.specialCondition}",
                                color = TealSecondary,
                                backgroundColor = TealContainer
                            )
                        }
                    }
                }
            }

            IconButton(onClick = onEdit) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Editar",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun StudentDetailDialog(
    student: Student,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onToggleRisk: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Ficha Cadastral",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Fechar")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = student.name,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = IndigoPrimary
                )

                Text(
                    text = "Matrícula: ${student.enrollmentNumber} • CPF: ${student.cpf}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Divider(modifier = Modifier.padding(vertical = 12.dp))

                DetailItem(label = "Turma / Série", value = "${student.className} (${student.gradeLevel})")
                DetailItem(label = "Data de Nascimento", value = student.birthDate)
                DetailItem(label = "Telefone do Aluno", value = student.phone.ifBlank { "Não informado" })
                DetailItem(label = "Responsável Legal", value = student.guardianName)
                DetailItem(label = "Contato do Responsável", value = student.guardianPhone)
                DetailItem(label = "Endereço", value = student.address)

                if (student.specialCondition.isNotBlank()) {
                    DetailItem(label = "Condição Especial / AEE", value = student.specialCondition)
                }
                if (student.notes.isNotBlank()) {
                    DetailItem(label = "Observações Pedagógicas", value = student.notes)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onToggleRisk,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = if (student.dropoutRisk) EmeraldSuccess else RoseAlert
                        )
                    ) {
                        Text(if (student.dropoutRisk) "Resolver Evasão" else "Marcar Risco")
                    }

                    Button(
                        onClick = onEdit,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                    ) {
                        Text("Editar Dados")
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailItem(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = Slate500)
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium))
    }
}

@Composable
private fun StudentFormDialog(
    studentToEdit: Student?,
    classes: List<com.example.sucessoedu.data.model.SchoolClass>,
    onDismiss: () -> Unit,
    onSave: (Student) -> Unit
) {
    var name by remember { mutableStateOf(studentToEdit?.name ?: "") }
    var enrollmentNumber by remember { mutableStateOf(studentToEdit?.enrollmentNumber ?: "") }
    var cpf by remember { mutableStateOf(studentToEdit?.cpf ?: "") }
    var birthDate by remember { mutableStateOf(studentToEdit?.birthDate ?: "2010-01-01") }
    var phone by remember { mutableStateOf(studentToEdit?.phone ?: "") }
    var guardianName by remember { mutableStateOf(studentToEdit?.guardianName ?: "") }
    var guardianPhone by remember { mutableStateOf(studentToEdit?.guardianPhone ?: "") }
    var selectedClass by remember { mutableStateOf(classes.find { it.id == studentToEdit?.classId } ?: classes.firstOrNull()) }
    var specialCondition by remember { mutableStateOf(studentToEdit?.specialCondition ?: "") }
    var address by remember { mutableStateOf(studentToEdit?.address ?: "Zona Urbana") }
    var notes by remember { mutableStateOf(studentToEdit?.notes ?: "") }
    var dropoutRisk by remember { mutableStateOf(studentToEdit?.dropoutRisk ?: false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(
                        text = if (studentToEdit != null) "Editar Matrícula" else "Nova Matrícula de Aluno",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = IndigoPrimary
                    )
                }

                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nome Completo do Aluno *") },
                        modifier = Modifier.fillMaxWidth().testTag("student_name_input")
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = enrollmentNumber,
                            onValueChange = { enrollmentNumber = it },
                            label = { Text("Matrícula / RA") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = cpf,
                            onValueChange = { cpf = it },
                            label = { Text("CPF") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = guardianName,
                        onValueChange = { guardianName = it },
                        label = { Text("Nome do Responsável Legal *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = guardianPhone,
                            onValueChange = { guardianPhone = it },
                            label = { Text("Tel. Responsável") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = birthDate,
                            onValueChange = { birthDate = it },
                            label = { Text("Data Nasc. (AAAA-MM-DD)") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    Text(text = "Enturmação (Turma)", style = MaterialTheme.typography.labelSmall, color = Slate500)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(classes) { cls ->
                            FilterChip(
                                selected = selectedClass?.id == cls.id,
                                onClick = { selectedClass = cls },
                                label = { Text(cls.name) }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = specialCondition,
                        onValueChange = { specialCondition = it },
                        label = { Text("Condição Especial / AEE (ex: TEA, TDAH, Baixa Visão)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Observações Pedagógicas") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = dropoutRisk,
                            onCheckedChange = { dropoutRisk = it }
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Sinalizar em Risco de Evasão Escolar (Busca Ativa)", fontSize = 13.sp)
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancelar")
                        }

                        Button(
                            onClick = {
                                if (name.isNotBlank() && selectedClass != null) {
                                    val newStudent = Student(
                                        id = studentToEdit?.id ?: "",
                                        name = name,
                                        enrollmentNumber = enrollmentNumber.ifBlank { "MAT-2026-${(100..999).random()}" },
                                        cpf = cpf,
                                        birthDate = birthDate,
                                        phone = phone,
                                        guardianName = guardianName,
                                        guardianPhone = guardianPhone,
                                        classId = selectedClass!!.id,
                                        className = selectedClass!!.name,
                                        gradeLevel = selectedClass!!.gradeLevel,
                                        status = studentToEdit?.status ?: StudentStatus.ACTIVE,
                                        dropoutRisk = dropoutRisk,
                                        specialCondition = specialCondition,
                                        address = address,
                                        notes = notes
                                    )
                                    onSave(newStudent)
                                }
                            },
                            enabled = name.isNotBlank() && selectedClass != null,
                            modifier = Modifier.weight(1f).testTag("save_student_button"),
                            colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                        ) {
                            Text("Salvar")
                        }
                    }
                }
            }
        }
    }
}
