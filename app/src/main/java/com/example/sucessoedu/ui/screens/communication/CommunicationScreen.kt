package com.example.sucessoedu.ui.screens.communication

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
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@Composable
fun CommunicationScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var isNewAnnouncementOpen by remember { mutableStateOf(false) }
    var isTemplateSendOpen by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Broadcast Action Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("communication_hub_card"),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = IndigoDark)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Central de Comunicação & Avisos",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Text(
                        text = "Transmita comunicados para pais, alunos, professores e coordenação",
                        style = MaterialTheme.typography.bodySmall,
                        color = IndigoContainer.copy(alpha = 0.8f)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { isNewAnnouncementOpen = true },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                        ) {
                            Icon(Icons.Default.Campaign, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Novo Comunicado")
                        }

                        Button(
                            onClick = { isTemplateSendOpen = true },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Modelos WhatsApp")
                        }
                    }
                }
            }
        }

        // WhatsApp Templates Quick Action Row
        item {
            Text(
                text = "Modelos Rápidos Pré-configurados",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "🚨 Alerta de Infrequência Escolar" to "Aviso aos responsáveis sobre acúmulo de faltas consecutivas.",
                    "📅 Convocação para Reunião de Pais" to "Convite oficial para alinhamento pedagógico bimestral.",
                    "📊 Liberação do Boletim Escolar" to "Aviso de que as notas do bimestre já estão disponíveis.",
                    "💰 Lembrete de Mensalidade" to "Aviso de boleto disponível com código PIX e código de barras."
                ).forEach { (title, desc) ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.sendBroadcastNotification(
                                    title = title,
                                    message = desc,
                                    category = "CANAL_DIRETO",
                                    highPriority = true
                                )
                            },
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
                            Column(modifier = Modifier.weight(1f)) {
                                Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                                Text(desc, style = MaterialTheme.typography.bodySmall, color = Slate500)
                            }
                            Icon(Icons.Default.Send, contentDescription = null, tint = EmeraldSuccess, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }

        // Notifications Feed
        item {
            Text(
                text = "Histórico de Transmissões (${state.notifications.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        items(state.notifications, key = { it.id }) { notif ->
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
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (notif.highPriority) RoseAlert else IndigoPrimary)
                            .padding(top = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = notif.title,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = notif.date,
                                style = MaterialTheme.typography.labelSmall,
                                color = Slate500
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = notif.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        StatusBadge(
                            text = notif.category,
                            color = TealSecondary,
                            backgroundColor = TealContainer
                        )
                    }
                }
            }
        }
    }

    if (isNewAnnouncementOpen) {
        NewAnnouncementDialog(
            onDismiss = { isNewAnnouncementOpen = false },
            onSend = { title, msg, cat, highPri ->
                viewModel.sendBroadcastNotification(title, msg, cat, highPri)
                isNewAnnouncementOpen = false
            }
        )
    }
}

@Composable
private fun NewAnnouncementDialog(
    onDismiss: () -> Unit,
    onSend: (title: String, message: String, category: String, highPriority: Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("GERAL") }
    var highPriority by remember { mutableStateOf(false) }

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
                    text = "Emitir Novo Comunicado",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = IndigoPrimary
                )

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título do Comunicado *") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Mensagem / Conteúdo *") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Categoria (ex: PEDAGÓGICO, SECRETARIA, EVENTO)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = highPriority,
                        onCheckedChange = { highPriority = it }
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Marcar como Alta Prioridade / Urgente", fontSize = 13.sp)
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
                            if (title.isNotBlank() && message.isNotBlank()) {
                                onSend(title, message, category, highPriority)
                            }
                        },
                        enabled = title.isNotBlank() && message.isNotBlank(),
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
                    ) {
                        Text("Transmitir")
                    }
                }
            }
        }
    }
}
