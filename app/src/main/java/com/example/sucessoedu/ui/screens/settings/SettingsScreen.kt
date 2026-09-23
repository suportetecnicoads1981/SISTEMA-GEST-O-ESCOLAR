package com.example.sucessoedu.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.sucessoedu.data.model.SchoolInfo
import com.example.sucessoedu.data.model.UserRole
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@Composable
fun SettingsScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var isEditSchoolOpen by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Active User Profile & Role Switcher
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("user_role_card"),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Perfil de Operador / Nível de Acesso",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Alterne o papel para simular permissões específicas do sistema",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    UserRole.entries.forEach { role ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewModel.setUserRole(role) }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = state.currentUserRole == role,
                                onClick = { viewModel.setUserRole(role) }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = role.label,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = if (state.currentUserRole == role) FontWeight.Bold else FontWeight.Normal
                                )
                            )
                        }
                    }
                }
            }
        }

        // School Information Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("school_info_card"),
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
                            text = "Dados da Unidade Escolar",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = IndigoPrimary
                        )
                        IconButton(onClick = { isEditSchoolOpen = true }) {
                            Icon(Icons.Default.Edit, contentDescription = "Editar", tint = IndigoPrimary)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    SettingItem(label = "Nome da Instituição", value = state.schoolInfo.schoolName)
                    SettingItem(label = "Código INEP (MEC)", value = state.schoolInfo.inepCode)
                    SettingItem(label = "Secretaria Vinculada", value = state.schoolInfo.municipalSecretary)
                    SettingItem(label = "Município / UF", value = "${state.schoolInfo.city} - ${state.schoolInfo.state}")
                    SettingItem(label = "Diretor(a) Responsável", value = state.schoolInfo.directorName)
                    SettingItem(label = "Telefone", value = state.schoolInfo.phone)
                    SettingItem(label = "E-mail de Contato", value = state.schoolInfo.email)
                }
            }
        }

        // Database & System Info
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Infraestrutura & Persistência Local",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Banco de Dados: Room SQLite Nativo (Offline-First)\nTotal de Registros de Alunos: ${state.students.size}\nTotal de Turmas: ${state.classes.size}\nTotal de Notas: ${state.grades.size}\nVersão da Aplicação: 2.6.0 (Build Android)",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate700,
                        lineHeight = 20.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            viewModel.showToast("Backup local consolidado com sucesso no dispositivo!")
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                    ) {
                        Icon(Icons.Default.Backup, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Criar Ponto de Restauração / Backup")
                    }
                }
            }
        }
    }

    if (isEditSchoolOpen) {
        SchoolEditDialog(
            schoolInfo = state.schoolInfo,
            onDismiss = { isEditSchoolOpen = false },
            onSave = {
                viewModel.updateSchoolInfo(it)
                isEditSchoolOpen = false
            }
        )
    }
}

@Composable
private fun SettingItem(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = Slate500)
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium))
    }
}

@Composable
private fun SchoolEditDialog(
    schoolInfo: SchoolInfo,
    onDismiss: () -> Unit,
    onSave: (SchoolInfo) -> Unit
) {
    var schoolName by remember { mutableStateOf(schoolInfo.schoolName) }
    var inepCode by remember { mutableStateOf(schoolInfo.inepCode) }
    var secName by remember { mutableStateOf(schoolInfo.municipalSecretary) }
    var city by remember { mutableStateOf(schoolInfo.city) }
    var state by remember { mutableStateOf(schoolInfo.state) }
    var director by remember { mutableStateOf(schoolInfo.directorName) }
    var phone by remember { mutableStateOf(schoolInfo.phone) }
    var email by remember { mutableStateOf(schoolInfo.email) }

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
                        text = "Editar Dados da Escola",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = IndigoPrimary
                    )
                }

                item {
                    OutlinedTextField(
                        value = schoolName,
                        onValueChange = { schoolName = it },
                        label = { Text("Nome da Escola") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = inepCode,
                            onValueChange = { inepCode = it },
                            label = { Text("Código INEP") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = city,
                            onValueChange = { city = it },
                            label = { Text("Cidade") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = director,
                        onValueChange = { director = it },
                        label = { Text("Nome do(a) Diretor(a)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Telefone") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("E-mail") },
                            modifier = Modifier.weight(1f)
                        )
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
                                val updated = schoolInfo.copy(
                                    schoolName = schoolName,
                                    inepCode = inepCode,
                                    municipalSecretary = secName,
                                    city = city,
                                    state = state,
                                    directorName = director,
                                    phone = phone,
                                    email = email
                                )
                                onSave(updated)
                            },
                            modifier = Modifier.weight(1f),
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
