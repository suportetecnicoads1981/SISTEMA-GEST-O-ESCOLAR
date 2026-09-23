package com.example.sucessoedu.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.sucessoedu.data.model.AttendanceStatus
import com.example.sucessoedu.data.model.StudentStatus
import com.example.sucessoedu.ui.components.SectionHeader
import com.example.sucessoedu.ui.components.StatCard
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@Composable
fun DashboardScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    onNavigateToTab: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val totalStudents = state.students.size
    val activeStudents = state.students.count { it.status == StudentStatus.ACTIVE }
    val dropoutRiskCount = state.students.count { it.dropoutRisk }
    val totalClasses = state.classes.size
    val totalTeachers = state.teachers.size

    val attendanceCount = state.attendanceRecords.size
    val presentCount = state.attendanceRecords.count { it.status == AttendanceStatus.PRESENT }
    val attendanceRate = if (attendanceCount > 0) (presentCount * 100) / attendanceCount else 95

    val pendingFinance = state.financeRecords.filter { it.paymentStatus.name != "PAID" }
    val totalPendingAmount = pendingFinance.sumOf { it.amount }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Header Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dashboard_welcome_banner"),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = IndigoDark)
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
                        Column {
                            Text(
                                text = state.schoolInfo.schoolName,
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                            Text(
                                text = "Ano Letivo ${state.schoolInfo.academicYear} • INEP: ${state.schoolInfo.inepCode}",
                                style = MaterialTheme.typography.bodySmall,
                                color = IndigoContainer.copy(alpha = 0.8f)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(IndigoLight.copy(alpha = 0.3f))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = state.currentUserRole.label,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Presença Geral",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = "$attendanceRate%",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = EmeraldSuccess
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.1f),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Risco de Evasão",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color.White.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = "$dropoutRiskCount alunos",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                    color = if (dropoutRiskCount > 0) RoseAlert else Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        // Quick KPI Stats Grid
        item {
            Text(
                text = "Indicadores Principais",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        title = "Alunos Matriculados",
                        value = activeStudents.toString(),
                        subtitle = "Total no sistema: $totalStudents",
                        icon = Icons.Default.School,
                        containerColor = IndigoContainer,
                        iconColor = IndigoPrimary,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToTab("STUDENTS") }
                    )
                    StatCard(
                        title = "Turmas Ativas",
                        value = totalClasses.toString(),
                        subtitle = "Ensino Fund. e Médio",
                        icon = Icons.Default.Groups,
                        containerColor = TealContainer,
                        iconColor = TealSecondary,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToTab("CLASSES") }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        title = "Corpo Docente",
                        value = totalTeachers.toString(),
                        subtitle = "Professores ativos",
                        icon = Icons.Default.Badge,
                        containerColor = AmberContainer,
                        iconColor = AmberAccent,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToTab("TEACHERS") }
                    )
                    StatCard(
                        title = "Pendências Financeiras",
                        value = "R$ ${String.format("%.0f", totalPendingAmount)}",
                        subtitle = "${pendingFinance.size} boletos em aberto",
                        icon = Icons.Default.MonetizationOn,
                        containerColor = RoseContainer,
                        iconColor = RoseAlert,
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToTab("FINANCE") }
                    )
                }
            }
        }

        // Quick Actions Row
        item {
            SectionHeader(title = "Ações Rápidas do Dia")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionButton(
                    icon = Icons.Default.EventAvailable,
                    label = "Fazer Chamada",
                    color = IndigoPrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToTab("ATTENDANCE") }
                )
                QuickActionButton(
                    icon = Icons.Default.Grade,
                    label = "Lançar Notas",
                    color = TealSecondary,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToTab("GRADES") }
                )
                QuickActionButton(
                    icon = Icons.Default.Quiz,
                    label = "Gerar Prova",
                    color = AmberAccent,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToTab("EXAMS") }
                )
                QuickActionButton(
                    icon = Icons.Default.Description,
                    label = "Emitir Doc",
                    color = RoseAlert,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigateToTab("DOCUMENTS") }
                )
            }
        }

        // Dropout Risk Warning Card (if any)
        if (dropoutRiskCount > 0) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("dropout_alert_card"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = RoseContainer)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = RoseAlert,
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Atenção: $dropoutRiskCount Aluno(s) em Risco de Evasão",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = OnRoseContainer
                            )
                            Text(
                                text = "Faltas consecutivas detectadas. Acione a Busca Ativa na Secretaria.",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnRoseContainer.copy(alpha = 0.8f)
                            )
                        }
                        IconButton(onClick = { onNavigateToTab("STUDENTS") }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Ver alunos em risco",
                                tint = RoseAlert
                            )
                        }
                    }
                }
            }
        }

        // Recent Notifications Feed
        item {
            SectionHeader(
                title = "Mural de Avisos & Notificações",
                actionLabel = "Ver Todos",
                onActionClick = { onNavigateToTab("COMMUNICATION") }
            )
        }

        items(state.notifications.take(3)) { notification ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { viewModel.markNotificationRead(notification.id) },
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (notification.read) Slate300 else if (notification.highPriority) RoseAlert else IndigoPrimary)
                            .padding(top = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = notification.title,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = notification.date,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = notification.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
        }
    }
}
