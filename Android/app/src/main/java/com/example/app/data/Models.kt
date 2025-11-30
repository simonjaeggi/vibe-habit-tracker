package com.example.app.data

data class Habit(
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

data class HabitEntry(
    val id: String,
    val entryDate: String,
    val textContent: String?,
    val pictureUrl: String?,
    val voiceMemoUrl: String?,
    val updatedAt: String?,
)

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}
