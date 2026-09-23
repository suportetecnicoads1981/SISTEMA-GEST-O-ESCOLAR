package com.example.sucessoedu.ui.screens.attendance

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
import com.example.sucessoedu.data.model.AttendanceStatus
import com.example.sucessoedu.ui.components.StatusBadge
import com.example.sucessoedu.ui.theme.*
import com.example.sucessoedu.viewmodel.SchoolUiState
import com.example.sucessoedu.viewmodel.SchoolViewModel

@Composable
fun AttendanceScreen(
    state: SchoolUiState,
    viewModel: SchoolViewModel,
    modifier: Modifier = Modifier
) {
    var selectedClassId by remember(state.classes) {
        mutableStateOf(state.classes.firstOrNull()?.id ?: "")
    }
    var selectedDate by remember { mutableStateOf("2026-09-23") }
    var lessonContent by remember { mutableStateOf("Revisão de conteúdos e resolução de exercícios da unidade.") }

    val classStudents = remember(state.students, selectedClassId) {
        state.students.filter { it.classId == selectedClassId }
    }

    // Local in-memory attendance map for the selected class and date
    val attendanceMap = remember(selectedClassId, selectedDate, state.attendanceRecords) {
        val existing = state.attendanceRecords.filter { it.classId == selectedClassId && it.date == selectedDate }
        val map = mutableStateMapOf<String, AttendanceStatus>()
        classStudents.forEach { student ->
            val found = existing.find { it.studentId == student.id }
            map[student.id] = found?.status ?: AttendanceStatus.PRESENT
        }
        map
    }

    val presentCount = attendanceMap.values.count { it == AttendanceStatus.PRESENT }
    val absentCount = attendanceMap.values.count { it == AttendanceStatus.ABSENT }
    val justifiedCount = attendanceMap.values.count { it == AttendanceStatus.JUSTIFIED }
    val totalStudents = classStudents.size
    val presenceRate = if (totalStudents > 0) (presentCount * 100) / totalStudents else 100

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
                text = "Selecione a Turma:",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(8.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.classes) { cls ->
                    FilterChip(
                        selected = selectedClassId == cls.id,
                        onClick = { selectedClassId = cls.id },
                        label = { Text(cls.name) },
                        leadingIcon = if (selectedClassId == cls.id) {
                            { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        } else null
                    )
                }
            }
        }

        // Attendance Stats Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("attendance_stats_card"),
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
                                text = "Diário de Frequência",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Data: $selectedDate • $totalStudents alunos",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (presenceRate >= 75) EmeraldContainer else RoseContainer)
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "$presenceRate% Presença",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = if (presenceRate >= 75) EmeraldSuccess else RoseAlert
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = EmeraldContainer,
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Presentes", style = MaterialTheme.typography.labelSmall, color = OnEmeraldContainer)
                                Text("$presentCount", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = EmeraldSuccess)
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = RoseContainer,
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Faltas", style = MaterialTheme.typography.labelSmall, color = OnRoseContainer)
                                Text("$absentCount", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = RoseAlert)
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = AmberContainer,
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Justificadas", style = MaterialTheme.typography.labelSmall, color = OnAmberContainer)
                                Text("$justifiedCount", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = AmberAccent)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = {
                            classStudents.forEach { student ->
                                attendanceMap[student.id] = AttendanceStatus.PRESENT
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.DoneAll, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Marcar Todos como Presentes")
                    }
                }
            }
        }

        // Lesson Diary Content
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Conteúdo Ministrado (Diário de Classe)",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = lessonContent,
                        onValueChange = { lessonContent = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        placeholder = { Text("Descreva os tópicos da aula e habilidades BNCC trabalhadas...") }
                    )
                }
            }
        }

        // Roll Call Student List
        item {
            Text(
                text = "Lista de Chamada (${classStudents.size} alunos)",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        items(classStudents, key = { it.id }) { student ->
            val currentStatus = attendanceMap[student.id] ?: AttendanceStatus.PRESENT

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = student.name,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "RA: ${student.enrollmentNumber}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        // Present Button
                        IconButton(
                            onClick = { attendanceMap[student.id] = AttendanceStatus.PRESENT },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (currentStatus == AttendanceStatus.PRESENT) EmeraldSuccess else Slate100)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Presente",
                                tint = if (currentStatus == AttendanceStatus.PRESENT) Color.White else Slate500,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Absent Button
                        IconButton(
                            onClick = { attendanceMap[student.id] = AttendanceStatus.ABSENT },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (currentStatus == AttendanceStatus.ABSENT) RoseAlert else Slate100)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Falta",
                                tint = if (currentStatus == AttendanceStatus.ABSENT) Color.White else Slate500,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Justified Button
                        IconButton(
                            onClick = { attendanceMap[student.id] = AttendanceStatus.JUSTIFIED },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (currentStatus == AttendanceStatus.JUSTIFIED) AmberAccent else Slate100)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "Justificada",
                                tint = if (currentStatus == AttendanceStatus.JUSTIFIED) Color.White else Slate500,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }

        // Save Button
        item {
            Button(
                onClick = {
                    viewModel.recordDailyAttendance(
                        classId = selectedClassId,
                        date = selectedDate,
                        attendanceMap = attendanceMap
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("save_attendance_btn"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary)
            ) {
                Icon(Icons.Default.Save, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Gravar Chamada no Diário Oficial", fontWeight = FontWeight.Bold)
            }
        }
    }
}
