package com.example.sucessoedu.ui.screens.grades

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.example.sucessoedu.data.model.GradeRecord
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@Composable
fun GradesScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var selectedClassId by remember(state.classes) {
        mutableStateOf(state.classes.firstOrNull()?.id ?: "")
    }
    var selectedSubject by remember { mutableStateOf("Matemática") }
    var gradeToEdit by remember { mutableStateOf<GradeRecord?>(null) }
    var reportCardStudent by remember { mutableStateOf<GradeRecord?>(null) }

    val subjects = listOf("Matemática", "Língua Portuguesa", "História", "Geografia", "Ciências / Biologia", "Física", "Inglês")

    val classStudents = remember(state.students, selectedClassId) {
        state.students.filter { it.classId == selectedClassId }
    }

    val gradesList = remember(classStudents, selectedSubject, state.grades) {
        classStudents.map { student ->
            val found = state.grades.find {
                it.studentId == student.id && it.subject == selectedSubject
            }
            found ?: GradeRecord(
                id = "grd-${student.id}-${selectedSubject}",
                studentId = student.id,
                studentName = student.name,
                classId = selectedClassId,
                subject = selectedSubject
            )
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Select Class Chips
        item {
            Text(
                text = "Turma:",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.classes) { cls ->
                    FilterChip(
                        selected = selectedClassId == cls.id,
                        onClick = { selectedClassId = cls.id },
                        label = { Text(cls.name) }
                    )
                }
            }
        }

        // Select Subject Chips
        item {
            Text(
                text = "Disciplina:",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(subjects) { sub ->
                    FilterChip(
                        selected = selectedSubject == sub,
                        onClick = { selectedSubject = sub },
                        label = { Text(sub) }
                    )
                }
            }
        }

        // Summary Card
        item {
            val approvedCount = gradesList.count { it.isApproved && it.average > 0 }
            val inRecuperationCount = gradesList.count { !it.isApproved && it.average > 0 }

            Card(
                modifier = Modifier.fillMaxWidth().testTag("grades_overview_card"),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Quadro de Rendimento - $selectedSubject",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Média para aprovação: 6,0 pontos",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatusBadge(
                            text = "$approvedCount Aprovados",
                            color = EmeraldSuccess,
                            backgroundColor = EmeraldContainer
                        )
                        if (inRecuperationCount > 0) {
                            StatusBadge(
                                text = "$inRecuperationCount Recup.",
                                color = RoseAlert,
                                backgroundColor = RoseContainer
                            )
                        }
                    }
                }
            }
        }

        // Grades List per Student
        item {
            Text(
                text = "Notas Bimestrais dos Alunos (${gradesList.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        items(gradesList, key = { it.studentId }) { grade ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { gradeToEdit = grade }
                    .testTag("grade_item_${grade.studentId}"),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = grade.studentName,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f)
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            StatusBadge(
                                text = if (grade.isApproved) "Média: ${String.format("%.1f", grade.average)}" else "Média: ${String.format("%.1f", grade.average)}",
                                color = if (grade.isApproved) EmeraldSuccess else RoseAlert,
                                backgroundColor = if (grade.isApproved) EmeraldContainer else RoseContainer
                            )

                            IconButton(
                                onClick = { reportCardStudent = grade },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ReceiptLong,
                                    contentDescription = "Boletim",
                                    tint = IndigoPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        BimonthlyBadge(label = "1º Bim", value = grade.b1Grade)
                        BimonthlyBadge(label = "2º Bim", value = grade.b2Grade)
                        BimonthlyBadge(label = "3º Bim", value = grade.b3Grade)
                        BimonthlyBadge(label = "4º Bim", value = grade.b4Grade)
                        if (grade.recoveryGrade != null) {
                            BimonthlyBadge(label = "Recup.", value = grade.recoveryGrade, isRecup = true)
                        }
                    }
                }
            }
        }
    }

    // Grade Edit Dialog
    gradeToEdit?.let { grade ->
        GradeEditDialog(
            grade = grade,
            onDismiss = { gradeToEdit = null },
            onSave = { updated ->
                viewModel.saveGrade(updated)
                gradeToEdit = null
            }
        )
    }

    // Report Card Dialog (Boletim Escolar)
    reportCardStudent?.let { grade ->
        val student = state.students.find { it.id == grade.studentId }
        val studentAllGrades = state.grades.filter { it.studentId == grade.studentId }

        BoletimDialog(
            student = student,
            subjectGrade = grade,
            allGrades = if (studentAllGrades.isNotEmpty()) studentAllGrades else listOf(grade),
            schoolInfo = state.schoolInfo,
            onDismiss = { reportCardStudent = null }
        )
    }
}

@Composable
private fun BimonthlyBadge(label: String, value: Double?, isRecup: Boolean = false) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isRecup) RoseContainer else Slate100)
            .padding(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = if (isRecup) OnRoseContainer else Slate500, fontSize = 10.sp)
        Text(
            text = if (value != null) String.format("%.1f", value) else "-",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = if (value != null && value < 6.0) RoseAlert else Slate800
        )
    }
}

@Composable
private fun GradeEditDialog(
    grade: GradeRecord,
    onDismiss: () -> Unit,
    onSave: (GradeRecord) -> Unit
) {
    var b1 by remember { mutableStateOf(grade.b1Grade?.toString() ?: "") }
    var b2 by remember { mutableStateOf(grade.b2Grade?.toString() ?: "") }
    var b3 by remember { mutableStateOf(grade.b3Grade?.toString() ?: "") }
    var b4 by remember { mutableStateOf(grade.b4Grade?.toString() ?: "") }
    var recup by remember { mutableStateOf(grade.recoveryGrade?.toString() ?: "") }

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
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Lançamento de Notas",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = IndigoPrimary
                )
                Text(
                    text = "${grade.studentName} • ${grade.subject}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = b1,
                        onValueChange = { b1 = it },
                        label = { Text("1º Bimestre") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = b2,
                        onValueChange = { b2 = it },
                        label = { Text("2º Bimestre") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = b3,
                        onValueChange = { b3 = it },
                        label = { Text("3º Bimestre") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = b4,
                        onValueChange = { b4 = it },
                        label = { Text("4º Bimestre") },
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = recup,
                    onValueChange = { recup = it },
                    label = { Text("Prova de Recuperação Final") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = {
                            val updated = grade.copy(
                                b1Grade = b1.toDoubleOrNull(),
                                b2Grade = b2.toDoubleOrNull(),
                                b3Grade = b3.toDoubleOrNull(),
                                b4Grade = b4.toDoubleOrNull(),
                                recoveryGrade = recup.toDoubleOrNull()
                            )
                            onSave(updated)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                    ) {
                        Text("Gravar Notas")
                    }
                }
            }
        }
    }
}

@Composable
private fun BoletimDialog(
    student: com.example.sucessoedu.data.model.Student?,
    subjectGrade: GradeRecord,
    allGrades: List<GradeRecord>,
    schoolInfo: com.example.sucessoedu.data.model.SchoolInfo,
    onDismiss: () -> Unit
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
                        text = "Boletim Escolar Oficial",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = IndigoPrimary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Fechar")
                    }
                }

                Text(
                    text = schoolInfo.schoolName,
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                    color = Slate700
                )
                Text(
                    text = "Aluno(a): ${student?.name ?: subjectGrade.studentName} | RA: ${student?.enrollmentNumber ?: "---"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate500
                )

                Divider(modifier = Modifier.padding(vertical = 12.dp))

                allGrades.forEach { g ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = g.subject, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
                            Text(
                                text = "1B: ${g.b1Grade ?: "-"} | 2B: ${g.b2Grade ?: "-"} | 3B: ${g.b3Grade ?: "-"} | 4B: ${g.b4Grade ?: "-"}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Slate500
                            )
                        }

                        StatusBadge(
                            text = String.format("%.1f", g.average),
                            color = if (g.isApproved) EmeraldSuccess else RoseAlert,
                            backgroundColor = if (g.isApproved) EmeraldContainer else RoseContainer
                        )
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp))

                Text(
                    text = "Situação: ${if (subjectGrade.isApproved) "Aprovado / Regular" else "Em Recuperação"}",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (subjectGrade.isApproved) EmeraldSuccess else RoseAlert
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                ) {
                    Icon(Icons.Default.Print, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Imprimir / Exportar Boletim PDF")
                }
            }
        }
    }
}
