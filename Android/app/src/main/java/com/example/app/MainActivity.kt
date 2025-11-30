@file:OptIn(ExperimentalMaterial3Api::class)

package com.example.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.example.app.data.DEFAULT_BASE_URL
import com.example.app.data.clearStoredToken
import com.example.app.data.loginLocal
import com.example.app.data.loadStoredToken
import com.example.app.data.registerLocal
import com.example.app.data.Result
import com.example.app.data.storeToken
import com.example.app.ui.screens.HabitsScreen
import com.example.app.ui.screens.LoginScreen
import com.example.app.ui.theme.AppTheme
import kotlinx.coroutines.launch

enum class AuthMode { LOGIN, REGISTER }

class MainActivity : ComponentActivity() {
    private val tokenState = mutableStateOf("")
    private val baseUrlState = DEFAULT_BASE_URL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        tokenState.value = loadStoredToken(this).orEmpty()

        setContent {
            AppTheme {
                val scope = rememberCoroutineScope()
                var loginStatus by rememberSaveable { mutableStateOf<String?>(null) }
                var email by rememberSaveable { mutableStateOf("") }
                var password by rememberSaveable { mutableStateOf("") }
                var displayName by rememberSaveable { mutableStateOf("") }
                var authMode by rememberSaveable { mutableStateOf(AuthMode.LOGIN) }
                val token by tokenState

                LaunchedEffect(token) {
                    if (token.isNotBlank()) {
                        loginStatus = null
                    }
                }

                if (token.isBlank()) {
                    LoginScreen(
                        email = email,
                        password = password,
                        displayName = displayName,
                        authMode = authMode,
                        onEmailChange = { email = it },
                        onPasswordChange = { password = it },
                        onDisplayNameChange = { displayName = it },
                        onAuthModeChange = { authMode = it },
                        onSubmitCredentials = {
                            if (email.isBlank() || password.isBlank()) {
                                loginStatus = "Email and password are required."
                                return@LoginScreen
                            }
                            if (authMode == AuthMode.REGISTER && displayName.isBlank()) {
                                loginStatus = "Display name is required to register."
                                return@LoginScreen
                            }
                            scope.launch {
                                loginStatus = if (authMode == AuthMode.LOGIN) "Signing in..." else "Registering..."
                                val result =
                                    if (authMode == AuthMode.LOGIN) loginLocal(baseUrlState, email, password)
                                    else registerLocal(baseUrlState, email, displayName, password)
                                when (result) {
                                    is Result.Success -> {
                                        val jwt = result.data
                                        tokenState.value = jwt
                                        storeToken(this@MainActivity, jwt)
                                        loginStatus = null
                                    }

                                    is Result.Error -> {
                                        loginStatus = result.message
                                    }
                                }
                            }
                        },
                        status = loginStatus.orEmpty(),
                    )
                } else {
                    HabitsScreen(
                        baseUrl = baseUrlState,
                        token = token,
                        onLogout = {
                            tokenState.value = ""
                            clearStoredToken(this)
                        },
                        statusMessage = loginStatus,
                    )
                }
            }
        }
    }

}
