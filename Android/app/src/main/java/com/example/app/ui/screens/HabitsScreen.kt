package com.example.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.app.data.Habit
import com.example.app.data.HabitEntry
import com.example.app.data.Result
import com.example.app.data.createHabit
import com.example.app.data.createHabitEntry
import com.example.app.data.deleteHabit
import com.example.app.data.deleteHabitEntry
import com.example.app.data.fetchHabitEntries
import com.example.app.data.fetchHabits
import com.example.app.data.updateHabitEntry
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.YearMonth
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HabitsScreen(
    baseUrl: String,
    token: String,
    onLogout: () -> Unit,
    statusMessage: String? = null,
) {
    val scope = rememberCoroutineScope()
    val baseUrlState by rememberUpdatedState(newValue = baseUrl)
    val tokenState by rememberUpdatedState(newValue = token)

    var habitStatus by remember { mutableStateOf("Tap refresh to load your habits") }
    var habits by remember { mutableStateOf<List<Habit>>(emptyList()) }
    var selectedHabitId by remember { mutableStateOf<String?>(null) }

    var habitEntryStatus by remember { mutableStateOf("Pick a habit to see entries") }
    var habitEntries by remember { mutableStateOf<List<HabitEntry>>(emptyList()) }

    var habitName by remember { mutableStateOf("") }
    var recurrence by remember { mutableStateOf("daily") }

    var entryDate by remember { mutableStateOf("") }
    var entryText by remember { mutableStateOf("") }
    var showDatePicker by remember { mutableStateOf(false) }

    val selectedHabit = habits.firstOrNull { it.id == selectedHabitId }
    val entryDatesSet = remember(habitEntries) {
        habitEntries.mapNotNull { it.entryDate }.toSet()
    }

    fun loadEntriesForHabit(id: String) {
        if (tokenState.isBlank()) {
            habitEntryStatus = "Add JWT first"
            return
        }
        scope.launch {
            habitEntryStatus = "Loading entries..."
            when (val result = fetchHabitEntries(baseUrlState, tokenState, id)) {
                is Result.Success -> {
                    habitEntries = result.data
                    habitEntryStatus = "Loaded ${result.data.size} entr${if (result.data.size == 1) "y" else "ies"}"
                }

                is Result.Error -> habitEntryStatus = "Error: ${result.message}"
            }
        }
    }

    fun loadHabits() {
        if (tokenState.isBlank()) {
            habitStatus = "Add JWT first"
            return
        }
        scope.launch {
            habitStatus = "Loading habits..."
            when (val result = fetchHabits(baseUrlState, tokenState)) {
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

    LaunchedEffect(tokenState, baseUrlState) {
        if (tokenState.isNotBlank()) {
            loadHabits()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = { TopAppBar(title = { Text("Habits") }) },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text("Your habits", style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = "Refresh to sync. Logout clears your session.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { loadHabits() }) { Text("Refresh") }
                        OutlinedButton(onClick = { onLogout(); habits = emptyList(); habitEntries = emptyList() }) {
                            Text("Logout")
                        }
                    }
                    if (!statusMessage.isNullOrBlank()) {
                        Text(statusMessage, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                    }
                    Text(habitStatus, style = MaterialTheme.typography.bodySmall)
                }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Create a new habit", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "All habits repeat daily. You'll log text for each day.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = habitName,
                        onValueChange = { habitName = it },
                        label = { Text("Name") },
                        modifier = Modifier.fillMaxWidth(),
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
                                    "recurrence" to "daily",
                                    "customIntervalDays" to null,
                                    "allowText" to true,
                                    "requireText" to true,
                                    "allowPicture" to false,
                                    "requirePicture" to false,
                                    "allowVoiceMemo" to false,
                                    "requireVoiceMemo" to false,
                                )
                                when (val result = createHabit(baseUrlState, tokenState, payload)) {
                                    is Result.Success -> {
                                        habitStatus = "Habit created"
                                        habitName = ""
                                        loadHabits()
                                    }

                                    is Result.Error -> habitStatus = "Error: ${result.message}"
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Save habit") }
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
                                    when (val result = deleteHabit(baseUrlState, tokenState, habit.id)) {
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
                    Text("Entries", style = MaterialTheme.typography.titleMedium)
                    if (selectedHabit != null) {
                        Text("Logging for \"${selectedHabit.name}\"", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        Text("Select a habit to view or add entries", style = MaterialTheme.typography.bodySmall)
                    }
                    CalendarMonth(entryDatesSet)
                    Button(onClick = { showDatePicker = true }, modifier = Modifier.fillMaxWidth()) {
                        Text(if (entryDate.isBlank()) "Pick a date" else "Date: $entryDate")
                    }
                    OutlinedTextField(
                        value = entryText,
                        onValueChange = { entryText = it },
                        label = { Text("Text content") },
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
                                    "pictureUrl" to null,
                                    "voiceMemoUrl" to null,
                                )
                                when (val result = createHabitEntry(baseUrlState, tokenState, habitId, payload)) {
                                    is Result.Success -> {
                                        habitEntryStatus = "Entry created"
                                        entryDate = ""; entryText = ""
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
                                        updateHabitEntry(baseUrlState, tokenState, habitId, updated.id, updated)
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
                                        deleteHabitEntry(baseUrlState, tokenState, habitId, it.id)
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

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val millis = datePickerState.selectedDateMillis
                    if (millis != null) {
                        val ld = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate()
                        entryDate = ld.toString()
                    }
                    showDatePicker = false
                }) { Text("Set date") }
            },
            dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text("Cancel") } },
        ) {
            DatePicker(state = datePickerState)
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
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = if (selected) 6.dp else 2.dp),
        border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null,
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(habit.name, style = MaterialTheme.typography.titleMedium)
            Text(
                "Daily • Text required",
                style = MaterialTheme.typography.bodySmall,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onSelect) { Text(if (selected) "Selected" else "Open") }
                OutlinedButton(onClick = onDelete) { Text("Remove") }
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
    var date by remember(entry.id) { mutableStateOf(entry.entryDate) }
    var text by remember(entry.id) { mutableStateOf(entry.textContent.orEmpty()) }

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
                            pictureUrl = null,
                            voiceMemoUrl = null,
                        ),
                    )
                }) { Text("Save") }
                OutlinedButton(onClick = { onDelete(entry) }) { Text("Delete") }
            }
        }
    }
}

@Composable
private fun CalendarMonth(markedDates: Set<String>) {
    val today = LocalDate.now()
    val yearMonth = YearMonth.of(today.year, today.month)
    val firstDay = yearMonth.atDay(1)
    val daysInMonth = yearMonth.lengthOfMonth()
    val leadingBlanks = firstDay.dayOfWeek.value % 7
    val days = (1..leadingBlanks).map { 0 } + (1..daysInMonth).map { it }
    val dotColor = MaterialTheme.colorScheme.primary

    Text("This month", style = MaterialTheme.typography.titleSmall)
    LazyVerticalGrid(
        columns = GridCells.Fixed(7),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.height(200.dp),
    ) {
        items(days) { day ->
            if (day == 0) {
                Spacer(modifier = Modifier.height(1.dp))
            } else {
                val dateStr = yearMonth.atDay(day).toString()
                val marked = markedDates.contains(dateStr)
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(4.dp)) {
                    Text(
                        text = day.toString(),
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    if (marked) {
                        Spacer(
                            modifier = Modifier
                                .height(10.dp)
                                .width(10.dp)
                                .clip(CircleShape)
                                .drawBehind {
                                    drawCircle(color = dotColor)
                                },
                        )
                    } else {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
