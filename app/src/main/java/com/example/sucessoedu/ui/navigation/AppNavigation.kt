package com.example.sucessoedu.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

enum class AppDestination(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    DASHBOARD("dashboard", "Dashboard", Icons.Default.Dashboard),
    STUDENTS("students", "Alunos", Icons.Default.School),
    CLASSES("classes", "Turmas", Icons.Default.Groups),
    TEACHERS("teachers", "Professores", Icons.Default.Badge),
    ATTENDANCE("attendance", "Chamada", Icons.Default.EventAvailable),
    GRADES("grades", "Notas", Icons.Default.Grade),
    EXAMS("exams", "Provas BNCC", Icons.Default.Quiz),
    FINANCE("finance", "Financeiro", Icons.Default.MonetizationOn),
    DOCUMENTS("documents", "Censo & Docs", Icons.Default.Description),
    COMMUNICATION("communication", "Avisos", Icons.Default.Campaign),
    SETTINGS("settings", "Configurações", Icons.Default.Settings);

    companion object {
        fun fromRoute(route: String?): AppDestination {
            return entries.find { it.route == route } ?: DASHBOARD
        }

        fun fromKey(key: String): AppDestination {
            return when (key) {
                "STUDENTS" -> STUDENTS
                "CLASSES" -> CLASSES
                "TEACHERS" -> TEACHERS
                "ATTENDANCE" -> ATTENDANCE
                "GRADES" -> GRADES
                "EXAMS" -> EXAMS
                "FINANCE" -> FINANCE
                "DOCUMENTS" -> DOCUMENTS
                "COMMUNICATION" -> COMMUNICATION
                "SETTINGS" -> SETTINGS
                else -> DASHBOARD
            }
        }
    }
}
