package com.example.sucessoedu.ui.screens.finance

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
import com.example.sucessoedu.data.model.FinanceRecord
import com.example.sucessoedu.data.model.PaymentStatus
import com.example.sucessoedu.ui.components.SearchBarField
import com.example.sucessoedu.ui.components.StatCard
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinanceScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("ALL") }
    var searchQuery by remember { mutableStateOf("") }
    var isAddFinanceOpen by remember { mutableStateOf(false) }

    val totalPaid = state.financeRecords.filter { it.paymentStatus == PaymentStatus.PAID }.sumOf { it.amount }
    val totalPending = state.financeRecords.filter { it.paymentStatus == PaymentStatus.PENDING }.sumOf { it.amount }
    val totalOverdue = state.financeRecords.filter { it.paymentStatus == PaymentStatus.OVERDUE }.sumOf { it.amount }

    val filteredRecords = remember(state.financeRecords, selectedFilter, searchQuery) {
        state.financeRecords.filter { record ->
            val matchesFilter = when (selectedFilter) {
                "PAID" -> record.paymentStatus == PaymentStatus.PAID
                "PENDING" -> record.paymentStatus == PaymentStatus.PENDING
                "OVERDUE" -> record.paymentStatus == PaymentStatus.OVERDUE
                else -> true
            }
            val matchesSearch = record.studentName.contains(searchQuery, ignoreCase = true) ||
                    record.title.contains(searchQuery, ignoreCase = true)
            matchesFilter && matchesSearch
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { isAddFinanceOpen = true },
                icon = { Icon(Icons.Default.AddCard, contentDescription = null) },
                text = { Text("Nova Cobrança") },
                containerColor = EmeraldSuccess,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_finance_fab")
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

            // KPI Summary Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Recebido",
                    value = "R$ ${String.format("%.0f", totalPaid)}",
                    subtitle = "Valores quitados",
                    icon = Icons.Default.CheckCircle,
                    containerColor = EmeraldContainer,
                    iconColor = EmeraldSuccess,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Em Aberto",
                    value = "R$ ${String.format("%.0f", totalPending + totalOverdue)}",
                    subtitle = "Atrasados + Pendentes",
                    icon = Icons.Default.PendingActions,
                    containerColor = RoseContainer,
                    iconColor = RoseAlert,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            SearchBarField(
                query = searchQuery,
                onQueryChange = { searchQuery = it },
                placeholder = "Buscar mensalidade ou aluno..."
            )

            Spacer(modifier = Modifier.height(10.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = selectedFilter == "ALL",
                        onClick = { selectedFilter = "ALL" },
                        label = { Text("Todos (${state.financeRecords.size})") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "PAID",
                        onClick = { selectedFilter = "PAID" },
                        label = { Text("Pagos") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "PENDING",
                        onClick = { selectedFilter = "PENDING" },
                        label = { Text("Pendentes") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedFilter == "OVERDUE",
                        onClick = { selectedFilter = "OVERDUE" },
                        label = { Text("Atrasados") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredRecords, key = { it.id }) { record ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.togglePayment(record) }
                            .testTag("finance_card_${record.id}"),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = record.studentName,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${record.title} • Vencimento: ${record.dueDate}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "R$ ${String.format("%.2f", record.amount)}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = IndigoPrimary
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                StatusBadge(
                                    text = record.paymentStatus.label,
                                    color = when (record.paymentStatus) {
                                        PaymentStatus.PAID -> EmeraldSuccess
                                        PaymentStatus.PENDING -> AmberAccent
                                        PaymentStatus.OVERDUE -> RoseAlert
                                    },
                                    backgroundColor = when (record.paymentStatus) {
                                        PaymentStatus.PAID -> EmeraldContainer
                                        PaymentStatus.PENDING -> AmberContainer
                                        PaymentStatus.OVERDUE -> RoseContainer
                                    }
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (record.paymentStatus == PaymentStatus.PAID) "Toque p/ reabrir" else "Toque p/ baixar",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate500,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (isAddFinanceOpen) {
        FinanceFormDialog(
            students = state.students,
            onDismiss = { isAddFinanceOpen = false },
            onSave = {
                viewModel.addFinanceRecord(it)
                isAddFinanceOpen = false
            }
        )
    }
}

@Composable
private fun FinanceFormDialog(
    students: List<com.example.sucessoedu.data.model.Student>,
    onDismiss: () -> Unit,
    onSave: (FinanceRecord) -> Unit
) {
    var selectedStudent by remember { mutableStateOf(students.firstOrNull()) }
    var title by remember { mutableStateOf("Mensalidade Escolar") }
    var amountStr by remember { mutableStateOf("450.00") }
    var dueDate by remember { mutableStateOf("2026-10-10") }
    var category by remember { mutableStateOf("Mensalidade") }

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
                        text = "Gerar Nova Mensalidade / Cobrança",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = EmeraldSuccess
                    )
                }

                item {
                    Text("Selecione o Aluno:", style = MaterialTheme.typography.labelSmall, color = Slate500)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(students) { std ->
                            FilterChip(
                                selected = selectedStudent?.id == std.id,
                                onClick = { selectedStudent = std },
                                label = { Text(std.name) }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Descrição / Título do Boleto") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = amountStr,
                            onValueChange = { amountStr = it },
                            label = { Text("Valor (R$)") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = dueDate,
                            onValueChange = { dueDate = it },
                            label = { Text("Vencimento (AAAA-MM-DD)") },
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
                                if (selectedStudent != null && title.isNotBlank()) {
                                    val rec = FinanceRecord(
                                        id = "fin-${System.currentTimeMillis()}",
                                        studentId = selectedStudent!!.id,
                                        studentName = selectedStudent!!.name,
                                        title = title,
                                        amount = amountStr.toDoubleOrNull() ?: 450.0,
                                        dueDate = dueDate,
                                        paymentStatus = PaymentStatus.PENDING,
                                        category = category
                                    )
                                    onSave(rec)
                                }
                            },
                            enabled = selectedStudent != null && title.isNotBlank(),
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess)
                        ) {
                            Text("Emitir Cobrança")
                        }
                    }
                }
            }
        }
    }
}
