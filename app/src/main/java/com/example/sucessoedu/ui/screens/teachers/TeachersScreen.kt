package com.example.sucessoedu.ui.screens.teachers

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
import com.example.sucessoedu.data.model.Teacher
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeachersScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var teacherToEdit by remember { mutableStateOf<Teacher?>(null) }
    var isAddTeacherOpen by remember { mutableStateOf(false) }

    val filteredTeachers = remember(state.teachers, searchQuery) {
        state.teachers.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    it.subjects.any { sub -> sub.contains(searchQuery, ignoreCase = true) } ||
                    it.email.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    teacherToEdit = null
                    isAddTeacherOpen = true
                },
                icon = { Icon(Icons.Default.PersonAdd, contentDescription = "Novo Docente") },
                text = { Text("Novo Docente") },
                containerColor = AmberAccent,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_teacher_fab")
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
                placeholder = "Buscar docente por nome ou disciplina..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "${filteredTeachers.size} professor(es) no corpo docente",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredTeachers, key = { it.id }) { teacher ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("teacher_card_${teacher.id}"),
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
                                            .size(46.dp)
                                            .clip(CircleShape)
                                            .background(AmberContainer),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Badge,
                                            contentDescription = null,
                                            tint = AmberAccent,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = teacher.name,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = teacher.degree,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                StatusBadge(
                                    text = if (teacher.active) "Ativo" else "Inativo",
                                    color = if (teacher.active) EmeraldSuccess else Slate500,
                                    backgroundColor = if (teacher.active) EmeraldContainer else Slate200
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Email, contentDescription = null, tint = Slate500, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(teacher.email, style = MaterialTheme.typography.bodySmall, color = Slate700)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Phone, contentDescription = null, tint = Slate500, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(teacher.phone, style = MaterialTheme.typography.bodySmall, color = Slate700)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text("Disciplinas Lecionadas:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                            Spacer(modifier = Modifier.height(4.dp))
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(teacher.subjects) { sub ->
                                    StatusBadge(
                                        text = sub,
                                        color = IndigoPrimary,
                                        backgroundColor = IndigoContainer
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = {
                                    teacherToEdit = teacher
                                    isAddTeacherOpen = true
                                }) {
                                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Editar")
                                }
                                TextButton(
                                    onClick = { viewModel.deleteTeacher(teacher) },
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

    if (isAddTeacherOpen) {
        TeacherFormDialog(
            teacherToEdit = teacherToEdit,
            onDismiss = { isAddTeacherOpen = false },
            onSave = { savedTeacher ->
                viewModel.saveTeacher(savedTeacher)
                isAddTeacherOpen = false
            }
        )
    }
}

@Composable
private fun TeacherFormDialog(
    teacherToEdit: Teacher?,
    onDismiss: () -> Unit,
    onSave: (Teacher) -> Unit
) {
    var name by remember { mutableStateOf(teacherToEdit?.name ?: "") }
    var email by remember { mutableStateOf(teacherToEdit?.email ?: "") }
    var phone by remember { mutableStateOf(teacherToEdit?.phone ?: "") }
    var degree by remember { mutableStateOf(teacherToEdit?.degree ?: "Licenciatura Plena") }
    var subjectsStr by remember { mutableStateOf(teacherToEdit?.subjects?.joinToString(", ") ?: "Matemática, Física") }

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
                    text = if (teacherToEdit != null) "Editar Docente" else "Cadastrar Novo Docente",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = AmberAccent
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome Completo do Professor *") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("E-mail Institucional") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Telefone / WhatsApp") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = degree,
                    onValueChange = { degree = it },
                    label = { Text("Titulação / Formação Acadêmica") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = subjectsStr,
                    onValueChange = { subjectsStr = it },
                    label = { Text("Disciplinas (separadas por vírgula)") },
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
                            if (name.isNotBlank()) {
                                val subs = subjectsStr.split(",").map { it.trim() }.filter { it.isNotBlank() }
                                onSave(
                                    Teacher(
                                        id = teacherToEdit?.id ?: "",
                                        name = name,
                                        email = email.ifBlank { "docente@sucessoedu.gov.br" },
                                        phone = phone.ifBlank { "(11) 99999-0000" },
                                        subjects = subs.ifEmpty { listOf("Geral") },
                                        assignedClassIds = teacherToEdit?.assignedClassIds ?: emptyList(),
                                        degree = degree,
                                        active = true
                                    )
                                )
                            }
                        },
                        enabled = name.isNotBlank(),
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
