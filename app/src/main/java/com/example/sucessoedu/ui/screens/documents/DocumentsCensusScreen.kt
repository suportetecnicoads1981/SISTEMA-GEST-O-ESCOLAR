package com.example.sucessoedu.ui.screens.documents

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
import com.example.sucessoedu.data.model.Student
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatCard
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel
import java.time.LocalDate

@Composable
fun DocumentsCensusScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Censo Escolar INEP, 1: Emissão de Documentos
    var selectedDocType by remember { mutableStateOf("DECLARACAO_MATRICULA") }
    var selectedStudent by remember { mutableStateOf<Student?>(state.students.firstOrNull()) }
    var viewingDocDialog by remember { mutableStateOf(false) }

    val totalStudents = state.students.size
    val aeeCount = state.students.count { it.specialCondition.isNotBlank() }
    val dropoutCount = state.students.count { it.dropoutRisk }
    val activeClasses = state.classes.size

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Censo Escolar INEP") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Emissão de Documentos") }
                )
            }
        }

        if (selectedTab == 0) {
            // Censo INEP Overview
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("census_dashboard_card"),
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
                            Column {
                                Text(
                                    text = "Relatório Oficial do Educacenso 2026",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = IndigoPrimary
                                )
                                Text(
                                    text = "Código INEP: ${state.schoolInfo.inepCode} • ${state.schoolInfo.schoolName}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            StatusBadge(
                                text = "Base Pronta",
                                color = EmeraldSuccess,
                                backgroundColor = EmeraldContainer
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            StatCard(
                                title = "Matrículas Válidas",
                                value = "$totalStudents",
                                subtitle = "100% validadas",
                                icon = Icons.Default.CheckCircle,
                                containerColor = IndigoContainer,
                                iconColor = IndigoPrimary,
                                modifier = Modifier.weight(1f)
                            )
                            StatCard(
                                title = "Alunos AEE / Inclusão",
                                value = "$aeeCount",
                                subtitle = "Educação Especial",
                                icon = Icons.Default.Accessibility,
                                containerColor = TealContainer,
                                iconColor = TealSecondary,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                viewModel.showToast("Arquivo de exportação do Educacenso (MEC/INEP) gerado com sucesso!")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                        ) {
                            Icon(Icons.Default.FileDownload, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Exportar Arquivo do Censo (.CSV / .TXT)")
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Quadro de Distribuição por Turma",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            items(state.classes) { cls ->
                val enrolled = state.students.count { it.classId == cls.id }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(cls.name, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("${cls.gradeLevel} • Turno ${cls.shift.label}", style = MaterialTheme.typography.bodySmall, color = Slate500)
                        }
                        Text("$enrolled matrículas", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), color = IndigoPrimary)
                    }
                }
            }
        } else {
            // Emissão de Documentos
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Central de Emissão de Documentos Escolares",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Gere declarações e guias oficiais assinadas digitalmente",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Text("Selecione o Tipo de Documento:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                        Spacer(modifier = Modifier.height(6.dp))

                        listOf(
                            "DECLARACAO_MATRICULA" to "Declaração de Matrícula Ativa",
                            "GUIA_TRANSFERENCIA" to "Guia de Transferência Escolar",
                            "DECLARACAO_FREQUENCIA" to "Declaração de Frequência Escolar",
                            "ATESTADO_CONCLUSAO" to "Atestado de Conclusão de Série"
                        ).forEach { (type, label) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedDocType = type }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = selectedDocType == type,
                                    onClick = { selectedDocType = type }
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(label, style = MaterialTheme.typography.bodyMedium)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Selecione o Aluno:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                        Spacer(modifier = Modifier.height(6.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(state.students) { std ->
                                FilterChip(
                                    selected = selectedStudent?.id == std.id,
                                    onClick = { selectedStudent = std },
                                    label = { Text(std.name) }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { viewingDocDialog = true },
                            enabled = selectedStudent != null,
                            modifier = Modifier.fillMaxWidth().testTag("generate_doc_btn"),
                            colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                        ) {
                            Icon(Icons.Default.Print, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Gerar & Visualizar Documento Oficial")
                        }
                    }
                }
            }
        }
    }

    if (viewingDocDialog && selectedStudent != null) {
        val docTitle = when (selectedDocType) {
            "DECLARACAO_MATRICULA" -> "DECLARAÇÃO DE MATRÍCULA"
            "GUIA_TRANSFERENCIA" -> "GUIA DE TRANSFERÊNCIA ESCOLAR"
            "DECLARACAO_FREQUENCIA" -> "DECLARAÇÃO DE FREQUÊNCIA"
            else -> "ATESTADO DE CONCLUSÃO DE SÉRIE"
        }

        DocumentPreviewDialog(
            title = docTitle,
            student = selectedStudent!!,
            schoolInfo = state.schoolInfo,
            onDismiss = { viewingDocDialog = false }
        )
    }
}

@Composable
private fun DocumentPreviewDialog(
    title: String,
    student: Student,
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
                            text = "Documento Oficial",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = IndigoPrimary
                        )
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Fechar")
                        }
                    }
                }

                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Slate50)
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = schoolInfo.schoolName.uppercase(),
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = IndigoDark
                        )
                        Text(
                            text = "${schoolInfo.municipalSecretary} • INEP: ${schoolInfo.inepCode}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate500
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = IndigoPrimary
                        )
                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Declaramos para os devidos fins de direito que o(a) aluno(a) ${student.name.uppercase()}, inscrito(a) no CPF nº ${student.cpf} e Matrícula nº ${student.enrollmentNumber}, filho(a) de ${student.guardianName}, nascido(a) em ${student.birthDate}, encontra-se devidamente matriculado(a) e com situação REGULAR nesta Unidade Escolar na turma ${student.className} (${student.gradeLevel}) durante o ano letivo de ${schoolInfo.academicYear}.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Slate800,
                            lineHeight = 20.sp
                        )

                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = "${schoolInfo.city} - ${schoolInfo.state}, ${LocalDate.now()}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate500
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = schoolInfo.directorName,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Diretoria de Ensino / Secretaria Geral",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate500
                        )
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
                        Text("Imprimir / Salvar PDF")
                    }
                }
            }
        }
    }
}
