package com.example.sucessoedu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.sucessoedu.ui.navigation.AppDestination
import com.example.sucessoedu.ui.screens.attendance.AttendanceScreen
import com.example.sucessoedu.ui.screens.classes.ClassesScreen
import com.example.sucessoedu.ui.screens.communication.CommunicationScreen
import com.example.sucessoedu.ui.screens.dashboard.DashboardScreen
import com.example.sucessoedu.ui.screens.documents.DocumentsCensusScreen
import com.example.sucessoedu.ui.screens.exams.ExamBankScreen
import com.example.sucessoedu.ui.screens.finance.FinanceScreen
import com.example.sucessoedu.ui.screens.grades.GradesScreen
import com.example.sucessoedu.ui.screens.settings.SettingsScreen
import com.example.sucessoedu.ui.screens.students.StudentsScreen
import com.example.sucessoedu.ui.screens.teachers.TeachersScreen
import com.example.sucessoedu.ui.theme.IndigoDark
import com.example.sucessoedu.ui.theme.IndigoLight
import com.example.sucessoedu.ui.theme.IndigoPrimary
import com.example.sucessoedu.ui.theme.SucessoEduTheme
import com.example.sucessoedu.viewmodel.SchoolViewModel
import com.example.sucessoedu.viewmodel.SchoolViewModelFactory
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: SchoolViewModel by viewModels {
        SchoolViewModelFactory((application as SucessoEduApp).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            SucessoEduTheme {
                val state by viewModel.uiState.collectAsStateWithLifecycle()
                val snackbarHostState = remember { SnackbarHostState() }
                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()

                var currentDestination by remember { mutableStateOf(AppDestination.DASHBOARD) }

                // Display snackbar toast whenever userToast changes
                LaunchedEffect(state.userToast) {
                    state.userToast?.let { msg ->
                        snackbarHostState.showSnackbar(msg)
                        viewModel.clearToast()
                    }
                }

                ModalNavigationDrawer(
                    drawerState = drawerState,
                    drawerContent = {
                        ModalDrawerSheet(
                            modifier = Modifier.width(300.dp),
                            drawerContainerColor = MaterialTheme.colorScheme.surface
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(IndigoDark)
                                    .padding(20.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Image(
                                        painter = painterResource(id = R.drawable.ic_app_logo),
                                        contentDescription = "SucessoEdu Logo",
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "SucessoEdu",
                                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                            color = Color.White
                                        )
                                        Text(
                                            text = "Gestão Educacional",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color.White.copy(alpha = 0.8f)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = Color.White.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = state.currentUserRole.label,
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            AppDestination.entries.forEach { destination ->
                                val isSelected = currentDestination == destination
                                NavigationDrawerItem(
                                    icon = { Icon(destination.icon, contentDescription = null) },
                                    label = { Text(destination.title, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                    selected = isSelected,
                                    onClick = {
                                        currentDestination = destination
                                        scope.launch { drawerState.close() }
                                    },
                                    modifier = Modifier
                                        .padding(horizontal = 12.dp, vertical = 2.dp)
                                        .testTag("drawer_item_${destination.route}")
                                )
                            }
                        }
                    }
                ) {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
                        topBar = {
                            CenterAlignedTopAppBar(
                                title = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Image(
                                            painter = painterResource(id = R.drawable.ic_app_logo),
                                            contentDescription = null,
                                            modifier = Modifier
                                                .size(28.dp)
                                                .clip(CircleShape)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = currentDestination.title,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                        )
                                    }
                                },
                                navigationIcon = {
                                    IconButton(
                                        onClick = { scope.launch { drawerState.open() } },
                                        modifier = Modifier.testTag("open_drawer_btn")
                                    ) {
                                        Icon(Icons.Default.Menu, contentDescription = "Menu Lateral")
                                    }
                                },
                                actions = {
                                    IconButton(
                                        onClick = { currentDestination = AppDestination.COMMUNICATION },
                                        modifier = Modifier.testTag("notification_action_btn")
                                    ) {
                                        BadgedBox(badge = {
                                            val unread = state.notifications.count { !it.read }
                                            if (unread > 0) {
                                                Badge { Text("$unread") }
                                            }
                                        }) {
                                            Icon(Icons.Default.Notifications, contentDescription = "Notificações")
                                        }
                                    }
                                },
                                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                                    containerColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        },
                        bottomBar = {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface,
                                tonalElevation = 3.dp
                            ) {
                                val primaryBottomDestinations = listOf(
                                    AppDestination.DASHBOARD,
                                    AppDestination.STUDENTS,
                                    AppDestination.CLASSES,
                                    AppDestination.ATTENDANCE,
                                    AppDestination.GRADES
                                )

                                primaryBottomDestinations.forEach { dest ->
                                    val isSelected = currentDestination == dest
                                    NavigationBarItem(
                                        selected = isSelected,
                                        onClick = { currentDestination = dest },
                                        icon = { Icon(dest.icon, contentDescription = dest.title) },
                                        label = { Text(dest.title, fontSize = 11.sp) },
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = IndigoPrimary,
                                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                                        ),
                                        modifier = Modifier.testTag("bottom_nav_${dest.route}")
                                    )
                                }
                            }
                        }
                    ) { innerPadding ->
                        AnimatedContent(
                            targetState = currentDestination,
                            transitionSpec = { fadeIn() togetherWith fadeOut() },
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                            label = "ScreenTransition"
                        ) { target ->
                            when (target) {
                                AppDestination.DASHBOARD -> DashboardScreen(
                                    state = state,
                                    viewModel = viewModel,
                                    onNavigateToTab = { tabKey ->
                                        currentDestination = AppDestination.fromKey(tabKey)
                                    }
                                )
                                AppDestination.STUDENTS -> StudentsScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.CLASSES -> ClassesScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.TEACHERS -> TeachersScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.ATTENDANCE -> AttendanceScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.GRADES -> GradesScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.EXAMS -> ExamBankScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.FINANCE -> FinanceScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.DOCUMENTS -> DocumentsCensusScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.COMMUNICATION -> CommunicationScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                                AppDestination.SETTINGS -> SettingsScreen(
                                    state = state,
                                    viewModel = viewModel
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
