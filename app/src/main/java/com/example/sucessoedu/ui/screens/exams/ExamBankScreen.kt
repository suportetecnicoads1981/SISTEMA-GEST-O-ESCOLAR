package com.example.sucessoedu.ui.screens.exams

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
import com.example.sucessoedu.data.model.Exam
import com.example.sucessoedu.data.model.Question
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamBankScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Questões BNCC, 1: Avaliações
    var selectedSubject by remember { mutableStateOf("ALL") }
    var searchQuery by remember { mutableStateOf("") }

    var isAddQuestionOpen by remember { mutableStateOf(false) }
    var isCreateExamOpen by remember { mutableStateOf(false) }
    var viewingExam by remember { mutableStateOf<Exam?>(null) }

    val filteredQuestions = remember(state.questions, selectedSubject, searchQuery) {
        state.questions.filter {
            val matchesSubject = if (selectedSubject == "ALL") true else it.subject == selectedSubject
            val matchesSearch = it.statement.contains(searchQuery, ignoreCase = true) ||
                    it.bnccCode.contains(searchQuery, ignoreCase = true)
            matchesSubject && matchesSearch
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    if (selectedTab == 0) isAddQuestionOpen = true else isCreateExamOpen = true
                },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text(if (selectedTab == 0) "Nova Questão BNCC" else "Criar Avaliação") },
                containerColor = AmberAccent,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_exam_fab")
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

            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Banco de Questões (${state.questions.size})") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Provas Geradas (${state.exams.size})") }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (selectedTab == 0) {
                SearchBarField(
                    query = searchQuery,
                    onQueryChange = { searchQuery = it },
                    placeholder = "Buscar questão por enunciado ou código BNCC..."
                )

                Spacer(modifier = Modifier.height(8.dp))

                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    item {
                        FilterChip(
                            selected = selectedSubject == "ALL",
                            onClick = { selectedSubject = "ALL" },
                            label = { Text("Todas") }
                        )
                    }
                    val subjects = listOf("Matemática", "Língua Portuguesa", "História", "Biologia", "Física", "Geografia")
                    items(subjects) { sub ->
                        FilterChip(
                            selected = selectedSubject == sub,
                            onClick = { selectedSubject = sub },
                            label = { Text(sub) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredQuestions, key = { it.id }) { question ->
                        QuestionCard(
                            question = question,
                            onDelete = { viewModel.deleteQuestion(question) }
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(state.exams, key = { it.id }) { exam ->
                        val examClass = state.classes.find { it.id == exam.classId }
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewingExam = exam },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = exam.title,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.weight(1f)
                                    )
                                    StatusBadge(
                                        text = "${exam.totalPoints} pts",
                                        color = AmberAccent,
                                        backgroundColor = AmberContainer
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = "Disciplina: ${exam.subject} • Turma: ${examClass?.name ?: "Geral"}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Data de Aplicação: ${exam.date} • ${exam.questionIds.size} questões vinculadas",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { viewingExam = exam }) {
                                        Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Visualizar / Gabarito")
                                    }
                                    TextButton(
                                        onClick = { viewModel.deleteExam(exam) },
                                        colors = ButtonDefaults.textButtonColors(contentColor = RoseAlert)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Excluir")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (isAddQuestionOpen) {
        QuestionFormDialog(
            onDismiss = { isAddQuestionOpen = false },
            onSave = {
                viewModel.saveQuestion(it)
                isAddQuestionOpen = false
            }
        )
    }

    if (isCreateExamOpen) {
        ExamFormDialog(
            classes = state.classes,
            questions = state.questions,
            onDismiss = { isCreateExamOpen = false },
            onSave = { title, subject, classId, points, qIds ->
                viewModel.createExam(title, subject, classId, points, qIds)
                isCreateExamOpen = false
            }
        )
    }

    viewingExam?.let { exam ->
        val examQuestions = state.questions.filter { exam.questionIds.contains(it.id) }
        ExamPreviewDialog(
            exam = exam,
            questions = examQuestions,
            onDismiss = { viewingExam = null }
        )
    }
}

@Composable
private fun QuestionCard(
    question: Question,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatusBadge(
                        text = question.subject,
                        color = IndigoPrimary,
                        backgroundColor = IndigoContainer
                    )
                    StatusBadge(
                        text = "BNCC: ${question.bnccCode}",
                        color = TealSecondary,
                        backgroundColor = TealContainer
                    )
                }

                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Excluir", tint = Slate500, modifier = Modifier.size(18.dp))
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = question.statement,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(10.dp))

            question.options.forEachIndexed { idx, opt ->
                val isCorrect = idx == question.correctOptionIndex
                val optLetter = ('A' + idx).toString()

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isCorrect) EmeraldContainer.copy(alpha = 0.6f) else Slate50)
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$optLetter)",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = if (isCorrect) EmeraldSuccess else Slate700
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = opt,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isCorrect) OnEmeraldContainer else Slate800
                    )
                    if (isCorrect) {
                        Spacer(modifier = Modifier.weight(1f))
                        Text(
                            text = "Gabarito",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = EmeraldSuccess
                        )
                    }
                }
            }

            if (question.explanation.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "💡 Explicação: ${question.explanation}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate500
                )
            }
        }
    }
}

@Composable
private fun QuestionFormDialog(
    onDismiss: () -> Unit,
    onSave: (Question) -> Unit
) {
    var subject by remember { mutableStateOf("Matemática") }
    var gradeLevel by remember { mutableStateOf("6º Ano Fund.") }
    var bnccCode by remember { mutableStateOf("EF06MA01") }
    var statement by remember { mutableStateOf("") }
    var optA by remember { mutableStateOf("") }
    var optB by remember { mutableStateOf("") }
    var optC by remember { mutableStateOf("") }
    var optD by remember { mutableStateOf("") }
    var correctIndex by remember { mutableIntStateOf(0) }
    var explanation by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
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
                        text = "Nova Questão Alinhada à BNCC",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = AmberAccent
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = subject,
                            onValueChange = { subject = it },
                            label = { Text("Disciplina") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = bnccCode,
                            onValueChange = { bnccCode = it },
                            label = { Text("Código BNCC") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = statement,
                        onValueChange = { statement = it },
                        label = { Text("Enunciado da Questão *") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Text("Alternativas de Múltipla Escolha:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                }

                item {
                    OutlinedTextField(value = optA, onValueChange = { optA = it }, label = { Text("A)") }, modifier = Modifier.fillMaxWidth())
                }
                item {
                    OutlinedTextField(value = optB, onValueChange = { optB = it }, label = { Text("B)") }, modifier = Modifier.fillMaxWidth())
                }
                item {
                    OutlinedTextField(value = optC, onValueChange = { optC = it }, label = { Text("C)") }, modifier = Modifier.fillMaxWidth())
                }
                item {
                    OutlinedTextField(value = optD, onValueChange = { optD = it }, label = { Text("D)") }, modifier = Modifier.fillMaxWidth())
                }

                item {
                    Text("Alternativa Correta (Gabarito):", style = MaterialTheme.typography.labelSmall, color = Slate500)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("A", "B", "C", "D").forEachIndexed { i, label ->
                            FilterChip(
                                selected = correctIndex == i,
                                onClick = { correctIndex = i },
                                label = { Text("Opção $label") }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = explanation,
                        onValueChange = { explanation = it },
                        label = { Text("Justificativa Pedagógica") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
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
                                if (statement.isNotBlank() && optA.isNotBlank() && optB.isNotBlank()) {
                                    val q = Question(
                                        id = "qst-${System.currentTimeMillis()}",
                                        subject = subject,
                                        gradeLevel = gradeLevel,
                                        bnccCode = bnccCode,
                                        statement = statement,
                                        options = listOf(optA, optB, optC.ifBlank { "N.D.A." }, optD.ifBlank { "N.D.A." }),
                                        correctOptionIndex = correctIndex,
                                        explanation = explanation
                                    )
                                    onSave(q)
                                }
                            },
                            enabled = statement.isNotBlank() && optA.isNotBlank() && optB.isNotBlank(),
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = AmberAccent)
                        ) {
                            Text("Salvar")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ExamFormDialog(
    classes: List<com.example.sucessoedu.data.model.SchoolClass>,
    questions: List<Question>,
    onDismiss: () -> Unit,
    onSave: (title: String, subject: String, classId: String, points: Double, questionIds: List<String>) -> Unit
) {
    var title by remember { mutableStateOf("Avaliação Bimestral") }
    var subject by remember { mutableStateOf("Matemática") }
    var selectedClass by remember { mutableStateOf(classes.firstOrNull()) }
    var pointsStr by remember { mutableStateOf("10.0") }
    val selectedQuestions = remember { mutableStateListOf<String>() }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
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
                        text = "Gerador de Avaliação Escolar",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = IndigoPrimary
                    )
                }

                item {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Título da Prova *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = subject,
                            onValueChange = { subject = it },
                            label = { Text("Disciplina") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = pointsStr,
                            onValueChange = { pointsStr = it },
                            label = { Text("Valor Total (Pontos)") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    Text("Selecione as Questões da Prova (${selectedQuestions.size} selecionadas):", style = MaterialTheme.typography.labelSmall, color = Slate500)
                }

                items(questions) { q ->
                    val isChecked = selectedQuestions.contains(q.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) selectedQuestions.remove(q.id) else selectedQuestions.add(q.id)
                            }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isChecked,
                            onCheckedChange = {
                                if (it) selectedQuestions.add(q.id) else selectedQuestions.remove(q.id)
                            }
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(q.statement, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                            Text("[${q.subject} - BNCC ${q.bnccCode}]", style = MaterialTheme.typography.labelSmall, color = Slate500)
                        }
                    }
                }

                item {
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
                                if (title.isNotBlank() && selectedClass != null) {
                                    onSave(
                                        title,
                                        subject,
                                        selectedClass!!.id,
                                        pointsStr.toDoubleOrNull() ?: 10.0,
                                        selectedQuestions.toList()
                                    )
                                }
                            },
                            enabled = title.isNotBlank() && selectedClass != null,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                        ) {
                            Text("Gerar Prova")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ExamPreviewDialog(
    exam: Exam,
    questions: List<Question>,
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = exam.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = IndigoPrimary
                        )
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Fechar")
                        }
                    }
                    Text(
                        text = "Disciplina: ${exam.subject} • Valor: ${exam.totalPoints} pts",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate500
                    )
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                }

                items(questions) { q ->
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Questão (${q.bnccCode}): ${q.statement}",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        q.options.forEachIndexed { i, opt ->
                            val isCorrect = i == q.correctOptionIndex
                            Text(
                                text = "${('A' + i)}) $opt ${if (isCorrect) "✓ (Gabarito)" else ""}",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isCorrect) EmeraldSuccess else Slate700,
                                fontWeight = if (isCorrect) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Divider()
                    }
                }

                item {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Imprimir Folha de Prova / Gabarito")
                    }
                }
            }
        }
    }
}
