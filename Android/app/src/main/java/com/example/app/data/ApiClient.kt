package com.example.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

const val DEFAULT_BASE_URL = "https://vibe-habit-tracker.vercel.app"

suspend fun registerLocal(
    baseUrl: String,
    email: String,
    displayName: String,
    password: String,
): Result<String> = withContext(Dispatchers.IO) {
    val payload = mapOf(
        "email" to email,
        "displayName" to displayName,
        "password" to password,
    )
    runCatching { request("$baseUrl/auth/register", token = null, method = "POST", payload = payload) }
        .mapCatching { json -> JSONObject(json).getString("jwt") }
        .fold(
            onSuccess = { Result.Success(it) },
            onFailure = { Result.Error(it.message ?: "Registration failed") },
        )
}

suspend fun loginLocal(
    baseUrl: String,
    email: String,
    password: String,
): Result<String> = withContext(Dispatchers.IO) {
    val payload = mapOf(
        "email" to email,
        "password" to password,
    )
    runCatching { request("$baseUrl/auth/login", token = null, method = "POST", payload = payload) }
        .mapCatching { json -> JSONObject(json).getString("jwt") }
        .fold(
            onSuccess = { Result.Success(it) },
            onFailure = { Result.Error(it.message ?: "Login failed") },
        )
}

suspend fun fetchHabits(baseUrl: String, token: String): Result<List<Habit>> =
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

suspend fun fetchHabitEntries(
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

suspend fun createHabit(
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

suspend fun deleteHabit(
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

suspend fun createHabitEntry(
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

suspend fun updateHabitEntry(
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

suspend fun deleteHabitEntry(
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
    token: String? = null,
    method: String = "GET",
    payload: Map<String, Any?>? = null,
): String {
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.requestMethod = method
    connection.setRequestProperty("Accept", "application/json")
    connection.setRequestProperty("Content-Type", "application/json")
    if (!token.isNullOrBlank()) {
        connection.setRequestProperty("Authorization", "Bearer $token")
    }
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
