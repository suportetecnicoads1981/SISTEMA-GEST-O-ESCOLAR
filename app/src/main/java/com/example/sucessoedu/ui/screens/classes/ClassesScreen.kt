package com.example.sucessoedu.ui.screens.classes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.sucessoedu.data.model.ClassShift
import com.example.sucessoedu.data.model.SchoolClass
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassesScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var classToEdit by remember { mutableStateOf<SchoolClass?>(null) }
    var isAddClassOpen by remember { mutableStateOf(false) }
    var expandedClassId by remember { mutableStateOf<String?>(null) }

    val filteredClasses = remember(state.classes, searchQuery) {
        state.classes.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    it.gradeLevel.contains(searchQuery, ignoreCase = true) ||
                    it.advisorTeacher.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    classToEdit = null
                    isAddClassOpen = true
                },
                icon = { Icon(Icons.Default.Add, contentDescription = "Nova Turma") },
                text = { Text("Nova Turma") },
                containerColor = TealSecondary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_class_fab")
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

            SearchBarField(
                query = searchQuery,
                onQueryChange = { searchQuery = it },
                placeholder = "Buscar turma por nome, série ou regente..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "${filteredClasses.size} turma(s) em atividade",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredClasses, key = { it.id }) { schoolClass ->
                    val enrolledStudents = state.students.filter { it.classId == schoolClass.id }
                    val occupancyRatio = if (schoolClass.capacity > 0) enrolledStudents.size.toFloat() / schoolClass.capacity else 0f
                    val isExpanded = expandedClassId == schoolClass.id

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                expandedClassId = if (isExpanded) null else schoolClass.id
                            }
                            .testTag("class_card_${schoolClass.id}"),
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
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(TealContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Groups,
                                            contentDescription = null,
                                            tint = TealSecondary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = schoolClass.name,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "${schoolClass.gradeLevel} • ${schoolClass.room}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                StatusBadge(
                                    text = schoolClass.shift.label,
                                    color = IndigoPrimary,
                                    backgroundColor = IndigoContainer
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Professor(a) Regente: ${schoolClass.advisorTeacher}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${enrolledStudents.size}/${schoolClass.capacity} vagas",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = if (occupancyRatio >= 1.0f) RoseAlert else EmeraldSuccess
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            LinearProgressIndicator(
                                progress = { occupancyRatio.coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = if (occupancyRatio >= 0.9f) RoseAlert else TealSecondary,
                                trackColor = Slate200
                            )

                            // Expanded Student Roster View
                            if (isExpanded) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Divider()
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Alunos Enturmados (${enrolledStudents.size}):",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                if (enrolledStudents.isEmpty()) {
                                    Text(
                                        text = "Nenhum aluno matriculado nesta turma ainda.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                } else {
                                    enrolledStudents.forEachIndexed { index, student ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = "${index + 1}. ${student.name}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = student.enrollmentNumber,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = Slate500
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = {
                                        classToEdit = schoolClass
                                        isAddClassOpen = true
                                    }) {
                                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Editar Turma")
                                    }
                                    TextButton(
                                        onClick = { viewModel.deleteClass(schoolClass) },
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

    if (isAddClassOpen) {
        ClassFormDialog(
            classToEdit = classToEdit,
            onDismiss = { isAddClassOpen = false },
            onSave = { newClass ->
                viewModel.saveClass(newClass)
                isAddClassOpen = false
            }
        )
    }
}

@Composable
private fun ClassFormDialog(
    classToEdit: SchoolClass?,
    onDismiss: () -> Unit,
    onSave: (SchoolClass) -> Unit
) {
    var name by remember { mutableStateOf(classToEdit?.name ?: "") }
    var gradeLevel by remember { mutableStateOf(classToEdit?.gradeLevel ?: "6º Ano Fund.") }
    var shift by remember { mutableStateOf(classToEdit?.shift ?: ClassShift.MATUTINO) }
    var room by remember { mutableStateOf(classToEdit?.room ?: "Sala 101") }
    var capacity by remember { mutableStateOf((classToEdit?.capacity ?: 35).toString()) }
    var advisorTeacher by remember { mutableStateOf(classToEdit?.advisorTeacher ?: "") }

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
                    text = if (classToEdit != null) "Editar Turma" else "Cadastrar Nova Turma",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = TealSecondary
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome da Turma (Ex: 6º Ano A)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = gradeLevel,
                    onValueChange = { gradeLevel = it },
                    label = { Text("Etapa de Ensino / Série") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = room,
                        onValueChange = { room = it },
                        label = { Text("Sala / Bloco") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = capacity,
                        onValueChange = { capacity = it },
                        label = { Text("Capacidade Máx.") },
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = advisorTeacher,
                    onValueChange = { advisorTeacher = it },
                    label = { Text("Professor(a) Regente / Conselheiro") },
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Turno Escolar:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ClassShift.entries.forEach { s ->
                        FilterChip(
                            selected = shift == s,
                            onClick = { shift = s },
                            label = { Text(s.label, fontSize = 11.sp) }
                        )
                    }
                }

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
                            if (name.isNotBlank()) {
                                onSave(
                                    SchoolClass(
                                        id = classToEdit?.id ?: "",
                                        name = name,
                                        gradeLevel = gradeLevel,
                                        shift = shift,
                                        room = room,
                                        capacity = capacity.toIntOrNull() ?: 35,
                                        advisorTeacher = advisorTeacher.ifBlank { "A definir" },
                                        schoolYear = 2026
                                    )
                                )
                            }
                        },
                        enabled = name.isNotBlank(),
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = TealSecondary)
                    ) {
                        Text("Salvar")
                    }
                }
            }
        }
    }
}
