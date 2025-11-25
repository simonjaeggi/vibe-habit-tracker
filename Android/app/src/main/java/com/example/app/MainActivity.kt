@file:OptIn(ExperimentalMaterial3Api::class)

package com.example.app

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.edit
import androidx.core.net.toUri
import com.example.app.ui.theme.AppTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

private data class Habit(
    val id: String,
    val name: String,
    val recurrence: String,
    val customIntervalDays: Int?,
    val allowText: Boolean,
    val requireText: Boolean,
    val allowPicture: Boolean,
    val requirePicture: Boolean,
    val allowVoiceMemo: Boolean,
    val requireVoiceMemo: Boolean,
)

private data class HabitEntry(
    val id: String,
    val entryDate: String,
    val textContent: String?,
    val pictureUrl: String?,
    val voiceMemoUrl: String?,
    val updatedAt: String?,
)

private sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}

private const val DEFAULT_BASE_URL = "http://192.168.71.187:3000"
private const val PREFS_NAME = "vibe_habit_prefs"
private const val PREF_JWT = "jwt"
private const val PREF_BASE_URL = "base_url"
private const val AUTH_SCHEME = "vibehabit"
private const val AUTH_HOST = "auth"

class MainActivity : ComponentActivity() {
    private val tokenState = mutableStateOf("")
    private var baseUrlState: String = DEFAULT_BASE_URL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        baseUrlState = loadBaseUrl(this)
        tokenState.value = loadStoredToken(this).orEmpty()
        handleAuthIntent(intent) { token ->
            tokenState.value = token
            storeToken(this, token)
        }
        setContent {
            AppTheme {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = { TopAppBar(title = { Text("Vibe Habit Tester") }) },
                ) { padding ->
                    HabitPlayground(
                        baseUrl = baseUrlState,
                        token = tokenState.value,
                        onTokenChange = { token ->
                            tokenState.value = token
                            if (token.isNotBlank()) storeToken(this, token) else clearStoredToken(this)
                        },
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleAuthIntent(intent) { token ->
            tokenState.value = token
            storeToken(this, token)
        }
    }
}

private fun handleAuthIntent(intent: Intent, onToken: (String) -> Unit) {
    val uri = intent.data
    if (uri != null && uri.scheme == AUTH_SCHEME && uri.host == AUTH_HOST) {
        uri.getQueryParameter("token")?.let(onToken)
    }
}

private fun loadStoredToken(context: Context): String? = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(PREF_JWT, null)

private fun loadBaseUrl(context: Context): String = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(PREF_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

private fun storeToken(context: Context, token: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
        putString(PREF_JWT, token)
    }
}

private fun clearStoredToken(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
        remove(PREF_JWT)
    }
}

@Composable
private fun HabitPlayground(
    baseUrl: String,
    token: String,
    onTokenChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val baseUrlState by rememberUpdatedState(newValue = baseUrl)

    var jwt by rememberSaveable { mutableStateOf(token) }
    LaunchedEffect(token) {
        jwt = token
    }
    var habitStatus by remember { mutableStateOf("Idle") }
    var habits by remember { mutableStateOf<List<Habit>>(emptyList()) }
    var selectedHabitId by remember { mutableStateOf<String?>(null) }

    var habitEntryStatus by remember { mutableStateOf("Idle") }
    var habitEntries by remember { mutableStateOf<List<HabitEntry>>(emptyList()) }

    var habitName by rememberSaveable { mutableStateOf("") }
    var recurrence by rememberSaveable { mutableStateOf("daily") }
    var customInterval by rememberSaveable { mutableStateOf("") }
    var allowText by rememberSaveable { mutableStateOf(false) }
    var requireText by rememberSaveable { mutableStateOf(false) }
    var allowPicture by rememberSaveable { mutableStateOf(false) }
    var requirePicture by rememberSaveable { mutableStateOf(false) }
    var allowVoice by rememberSaveable { mutableStateOf(false) }
    var requireVoice by rememberSaveable { mutableStateOf(false) }

    var entryDate by rememberSaveable { mutableStateOf("") }
    var entryText by rememberSaveable { mutableStateOf("") }
    var entryPicture by rememberSaveable { mutableStateOf("") }
    var entryVoice by rememberSaveable { mutableStateOf("") }

    val selectedHabit = habits.firstOrNull { it.id == selectedHabitId }

    fun loadEntriesForHabit(id: String) {
        if (jwt.isBlank()) {
            habitEntryStatus = "Add JWT first"
            return
        }
        scope.launch {
            habitEntryStatus = "Loading entries..."
            when (val result = fetchHabitEntries(baseUrlState, jwt, id)) {
                is Result.Success -> {
                    habitEntries = result.data
                    habitEntryStatus = "Loaded ${result.data.size} entr${if (result.data.size == 1) "y" else "ies"}"
                }

                is Result.Error -> habitEntryStatus = "Error: ${result.message}"
            }
        }
    }
    fun loadHabits() {
        if (jwt.isBlank()) {
            habitStatus = "Add JWT first"
            return
        }
        scope.launch {
            habitStatus = "Loading habits..."
            when (val result = fetchHabits(baseUrlState, jwt)) {
                is Result.Success -> {
                    habits = result.data
                    selectedHabitId = selectedHabitId?.takeIf { id -> result.data.any { it.id == id } }
                        ?: result.data.firstOrNull()?.id
                    habitStatus = "Loaded ${result.data.size} habit(s)"
                    selectedHabitId?.let { loadEntriesForHabit(it) }
                }

                is Result.Error -> habitStatus = "Error: ${result.message}"
            }
        }
    }

    Column(
        modifier = modifier
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("API Settings", style = MaterialTheme.typography.titleMedium)
                Text("Base URL: $baseUrlState", style = MaterialTheme.typography.bodySmall)
                Text(
                    if (jwt.isNotBlank()) "JWT set (${jwt.take(6)}…)" else "JWT not set",
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            val redirectUri = "$AUTH_SCHEME://$AUTH_HOST"
                            val url =
                                "$baseUrlState/auth/google?redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}"
                            context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
                        },
                        enabled = jwt.isBlank(),
                    ) { Text("Login with Google") }
                    OutlinedButton(
                        onClick = {
                            jwt = ""
                            onTokenChange("")
                            habitStatus = "Logged out"
                        },
                        enabled = jwt.isNotBlank(),
                    ) { Text("Logout") }
                }
                Button(onClick = { loadHabits() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Load Habits")
                }
                Text(habitStatus, style = MaterialTheme.typography.bodySmall)
            }
        }

        Card(colors = CardDefaults.cardColors()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Create Habit", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = habitName,
                    onValueChange = { habitName = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { recurrence = "daily" }) { Text("Daily") }
                    OutlinedButton(onClick = { recurrence = "weekly" }) { Text("Weekly") }
                    OutlinedButton(onClick = { recurrence = "monthly" }) { Text("Monthly") }
                    OutlinedButton(onClick = { recurrence = "custom" }) { Text("Custom") }
                }
                if (recurrence == "custom") {
                    OutlinedTextField(
                        value = customInterval,
                        onValueChange = { customInterval = it },
                        label = { Text("Custom interval days") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                ToggleRow(
                    title = "Text",
                    allow = allowText,
                    require = requireText,
                    onAllowChange = { allowText = it; if (!it) requireText = false },
                    onRequireChange = { requireText = it; if (it) allowText = true },
                )
                ToggleRow(
                    title = "Picture",
                    allow = allowPicture,
                    require = requirePicture,
                    onAllowChange = { allowPicture = it; if (!it) requirePicture = false },
                    onRequireChange = { requirePicture = it; if (it) allowPicture = true },
                )
                ToggleRow(
                    title = "Voice",
                    allow = allowVoice,
                    require = requireVoice,
                    onAllowChange = { allowVoice = it; if (!it) requireVoice = false },
                    onRequireChange = { requireVoice = it; if (it) allowVoice = true },
                )
                Button(
                    onClick = {
                        if (habitName.isBlank()) {
                            habitStatus = "Name required"
                            return@Button
                        }
                        scope.launch {
                            habitStatus = "Creating habit..."
                            val payload = mapOf(
                                "name" to habitName,
                                "recurrence" to recurrence,
                                "customIntervalDays" to customInterval.toIntOrNull(),
                                "allowText" to allowText,
                                "requireText" to requireText,
                                "allowPicture" to allowPicture,
                                "requirePicture" to requirePicture,
                                "allowVoiceMemo" to allowVoice,
                                "requireVoiceMemo" to requireVoice,
                            )
                            when (val result = createHabit(baseUrlState, jwt, payload)) {
                                is Result.Success -> {
                                    habitStatus = "Habit created"
                                    habitName = ""
                                    customInterval = ""
                                    allowText = false; requireText = false
                                    allowPicture = false; requirePicture = false
                                    allowVoice = false; requireVoice = false
                                    recurrence = "daily"
                                    loadHabits()
                                }

                                is Result.Error -> habitStatus = "Error: ${result.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Save Habit") }
            }
        }

        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Habits", style = MaterialTheme.typography.titleMedium)
                habits.forEach { habit ->
                    HabitRow(
                        habit = habit,
                        selected = habit.id == selectedHabitId,
                        onSelect = {
                            selectedHabitId = habit.id
                            loadEntriesForHabit(habit.id)
                        },
                        onDelete = {
                            scope.launch {
                                habitStatus = "Deleting habit..."
                                when (val result = deleteHabit(baseUrlState, jwt, habit.id)) {
                                    is Result.Success -> {
                                        habitStatus = "Habit deleted"
                                        loadHabits()
                                    }

                                    is Result.Error -> habitStatus = "Error: ${result.message}"
                                }
                            }
                        },
                    )
                }
                if (habits.isEmpty()) {
                    Text("No habits yet", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        HorizontalDivider()

        Card {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Habit Entries", style = MaterialTheme.typography.titleMedium)
                Text(
                    text = selectedHabit?.let { "Selected: ${it.name}" }
                        ?: "Select a habit to manage entries",
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    value = entryDate,
                    onValueChange = { entryDate = it },
                    label = { Text("Entry date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = entryText,
                    onValueChange = { entryText = it },
                    label = { Text("Text content") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = entryPicture,
                    onValueChange = { entryPicture = it },
                    label = { Text("Picture URL") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = entryVoice,
                    onValueChange = { entryVoice = it },
                    label = { Text("Voice memo URL") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Button(
                    onClick = {
                        val habitId = selectedHabitId ?: run {
                            habitEntryStatus = "Select a habit first"
                            return@Button
                        }
                        scope.launch {
                            habitEntryStatus = "Creating entry..."
                            val payload = mapOf(
                                "entryDate" to entryDate.ifBlank { null },
                                "textContent" to entryText.ifBlank { null },
                                "pictureUrl" to entryPicture.ifBlank { null },
                                "voiceMemoUrl" to entryVoice.ifBlank { null },
                            )
                            when (val result = createHabitEntry(baseUrlState, jwt, habitId, payload)) {
                                is Result.Success -> {
                                    habitEntryStatus = "Entry created"
                                    entryDate = ""; entryText = ""; entryPicture = ""; entryVoice = ""
                                    loadEntriesForHabit(habitId)
                                }

                                is Result.Error -> habitEntryStatus = "Error: ${result.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = selectedHabitId != null,
                ) { Text("Save Habit Entry") }
                Text(habitEntryStatus, style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
                habitEntries.forEach { entry ->
                    HabitEntryRow(
                        entry = entry,
                        onSave = { updated ->
                            val habitId = selectedHabitId ?: return@HabitEntryRow
                            scope.launch {
                                habitEntryStatus = "Updating entry..."
                                when (val result =
                                    updateHabitEntry(baseUrlState, jwt, habitId, updated.id, updated)
                                ) {
                                    is Result.Success -> {
                                        habitEntryStatus = "Entry updated"
                                        loadEntriesForHabit(habitId)
                                    }

                                    is Result.Error -> habitEntryStatus = "Error: ${result.message}"
                                }
                            }
                        },
                        onDelete = {
                            val habitId = selectedHabitId ?: return@HabitEntryRow
                            scope.launch {
                                habitEntryStatus = "Deleting entry..."
                                when (val result =
                                    deleteHabitEntry(baseUrlState, jwt, habitId, it.id)
                                ) {
                                    is Result.Success -> {
                                        habitEntryStatus = "Entry deleted"
                                        loadEntriesForHabit(habitId)
                                    }

                                    is Result.Error -> habitEntryStatus = "Error: ${result.message}"
                                }
                            }
                        },
                    )
                }
                if (habitEntries.isEmpty()) {
                    Text("No entries yet for this habit", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun ToggleRow(
    title: String,
    allow: Boolean,
    require: Boolean,
    onAllowChange: (Boolean) -> Unit,
    onRequireChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = allow, onCheckedChange = onAllowChange)
            Text("Allow")
            Spacer(Modifier.width(12.dp))
            Checkbox(checked = require, onCheckedChange = onRequireChange)
            Text("Require")
        }
    }
}

@Composable
private fun HabitRow(
    habit: Habit,
    selected: Boolean,
    onSelect: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(habit.name, style = MaterialTheme.typography.titleMedium)
            Text(
                (if (habit.recurrence == "custom") "Every ${habit.customIntervalDays} day(s)" else habit.recurrence)
                        + " • "
                        + rulesLabel(habit),
                style = MaterialTheme.typography.bodySmall,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onSelect) { Text(if (selected) "Selected" else "Select") }
                OutlinedButton(onClick = onDelete) { Text("Delete") }
            }
        }
    }
}

@Composable
private fun HabitEntryRow(
    entry: HabitEntry,
    onSave: (HabitEntry) -> Unit,
    onDelete: (HabitEntry) -> Unit,
) {
    var date by rememberSaveable(entry.id) { mutableStateOf(entry.entryDate) }
    var text by rememberSaveable(entry.id) { mutableStateOf(entry.textContent.orEmpty()) }
    var picture by rememberSaveable(entry.id) { mutableStateOf(entry.pictureUrl.orEmpty()) }
    var voice by rememberSaveable(entry.id) { mutableStateOf(entry.voiceMemoUrl.orEmpty()) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            OutlinedTextField(
                value = date,
                onValueChange = { date = it },
                label = { Text("Date") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text("Text") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = picture,
                onValueChange = { picture = it },
                label = { Text("Picture URL") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = voice,
                onValueChange = { voice = it },
                label = { Text("Voice memo URL") },
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                text = entry.updatedAt?.let { "Updated $it" } ?: "",
                style = MaterialTheme.typography.bodySmall,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = {
                    onSave(
                        entry.copy(
                            entryDate = date,
                            textContent = text.ifBlank { null },
                            pictureUrl = picture.ifBlank { null },
                            voiceMemoUrl = voice.ifBlank { null },
                        ),
                    )
                }) { Text("Save") }
                OutlinedButton(onClick = { onDelete(entry) }) { Text("Delete") }
            }
        }
    }
}

private fun rulesLabel(habit: Habit): String {
    val bits = mutableListOf<String>()
    bits += when {
        habit.requireText -> "Text required"
        habit.allowText -> "Text allowed"
        else -> "No text"
    }
    bits += when {
        habit.requirePicture -> "Picture required"
        habit.allowPicture -> "Picture allowed"
        else -> "No picture"
    }
    bits += when {
        habit.requireVoiceMemo -> "Voice required"
        habit.allowVoiceMemo -> "Voice allowed"
        else -> "No voice"
    }
    return bits.joinToString(" • ")
}

private suspend fun fetchHabits(baseUrl: String, token: String): Result<List<Habit>> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits", token) }
            .mapCatching { json ->
                val array = JSONArray(json)
                buildList {
                    for (i in 0 until array.length()) {
                        val h = array.getJSONObject(i)
                        add(
                            Habit(
                                id = h.getString("id"),
                                name = h.getString("name"),
                                recurrence = h.getString("recurrence"),
                                customIntervalDays = if (h.isNull("customIntervalDays")) null else h.optInt("customIntervalDays"),
                                allowText = h.optBoolean("allowText"),
                                requireText = h.optBoolean("requireText"),
                                allowPicture = h.optBoolean("allowPicture"),
                                requirePicture = h.optBoolean("requirePicture"),
                                allowVoiceMemo = h.optBoolean("allowVoiceMemo"),
                                requireVoiceMemo = h.optBoolean("requireVoiceMemo"),
                            ),
                        )
                    }
                }
            }
            .fold(
                onSuccess = { Result.Success(it) },
                onFailure = { Result.Error(it.message ?: "Failed to load habits") },
            )
    }

private suspend fun fetchHabitEntries(
    baseUrl: String,
    token: String,
    habitId: String,
): Result<List<HabitEntry>> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits/$habitId/entries", token) }
            .mapCatching { json ->
                val array = JSONArray(json)
                buildList {
                    for (i in 0 until array.length()) {
                        val e = array.getJSONObject(i)
                        add(
                            HabitEntry(
                                id = e.getString("id"),
                                entryDate = e.getString("entryDate"),
                                textContent = e.optString("textContent").takeIf { !e.isNull("textContent") },
                                pictureUrl = e.optString("pictureUrl").takeIf { !e.isNull("pictureUrl") },
                                voiceMemoUrl = e.optString("voiceMemoUrl").takeIf { !e.isNull("voiceMemoUrl") },
                                updatedAt = e.optString("updatedAt").takeIf { !e.isNull("updatedAt") },
                            ),
                        )
                    }
                }
            }
            .fold(
                onSuccess = { Result.Success(it) },
                onFailure = { Result.Error(it.message ?: "Failed to load entries") },
            )
    }

private suspend fun createHabit(
    baseUrl: String,
    token: String,
    payload: Map<String, Any?>,
): Result<Unit> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits", token, "POST", payload) }
            .fold(
                onSuccess = { Result.Success(Unit) },
                onFailure = { Result.Error(it.message ?: "Failed to create habit") },
            )
    }

private suspend fun deleteHabit(
    baseUrl: String,
    token: String,
    habitId: String,
): Result<Unit> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits/$habitId", token, "DELETE") }
            .fold(
                onSuccess = { Result.Success(Unit) },
                onFailure = { Result.Error(it.message ?: "Failed to delete habit") },
            )
    }

private suspend fun createHabitEntry(
    baseUrl: String,
    token: String,
    habitId: String,
    payload: Map<String, Any?>,
): Result<Unit> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits/$habitId/entries", token, "POST", payload) }
            .fold(
                onSuccess = { Result.Success(Unit) },
                onFailure = { Result.Error(it.message ?: "Failed to create entry") },
            )
    }

private suspend fun updateHabitEntry(
    baseUrl: String,
    token: String,
    habitId: String,
    entryId: String,
    entry: HabitEntry,
): Result<Unit> =
    withContext(Dispatchers.IO) {
        val payload = mapOf(
            "entryDate" to entry.entryDate,
            "textContent" to entry.textContent,
            "pictureUrl" to entry.pictureUrl,
            "voiceMemoUrl" to entry.voiceMemoUrl,
        )
        runCatching { request("$baseUrl/habits/$habitId/entries/$entryId", token, "PATCH", payload) }
            .fold(
                onSuccess = { Result.Success(Unit) },
                onFailure = { Result.Error(it.message ?: "Failed to update entry") },
            )
    }

private suspend fun deleteHabitEntry(
    baseUrl: String,
    token: String,
    habitId: String,
    entryId: String,
): Result<Unit> =
    withContext(Dispatchers.IO) {
        runCatching { request("$baseUrl/habits/$habitId/entries/$entryId", token, "DELETE") }
            .fold(
                onSuccess = { Result.Success(Unit) },
                onFailure = { Result.Error(it.message ?: "Failed to delete entry") },
            )
    }

private fun Map<String, Any?>.toJsonString(): String {
    val clean = JSONObject()
    this.forEach { (k, v) ->
        if (v != null) clean.put(k, v)
    }
    return clean.toString()
}

private fun request(
    url: String,
    token: String,
    method: String = "GET",
    payload: Map<String, Any?>? = null,
): String {
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.requestMethod = method
    connection.setRequestProperty("Accept", "application/json")
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Authorization", "Bearer $token")
    connection.doInput = true

    if (payload != null) {
        connection.doOutput = true
        val out = payload.toJsonString().toByteArray(StandardCharsets.UTF_8)
        connection.outputStream.use { os -> os.write(out) }
    }

    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val response = stream?.bufferedReader()?.use(BufferedReader::readText)
    if (code !in 200..299) {
        throw IllegalStateException(response ?: "HTTP $code")
    }
    return response ?: ""
}
