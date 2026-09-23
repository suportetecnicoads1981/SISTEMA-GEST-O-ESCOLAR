package com.example.sucessoedu

import android.app.Application
import com.example.sucessoedu.data.local.AppDatabase
import com.example.sucessoedu.data.repository.SchoolRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class SucessoEduApp : Application() {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database by lazy { AppDatabase.getDatabase(this, applicationScope) }
    val repository by lazy { SchoolRepository(database) }
}
