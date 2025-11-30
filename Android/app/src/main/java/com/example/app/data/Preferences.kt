package com.example.app.data

import android.content.Context
import androidx.core.content.edit

private const val PREFS_NAME = "vibe_habit_prefs"
private const val PREF_JWT = "jwt"
private const val PREF_BASE_URL = "base_url"

fun loadStoredToken(context: Context): String? =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(PREF_JWT, null)

fun loadBaseUrl(context: Context): String =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(PREF_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

fun storeToken(context: Context, token: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
        putString(PREF_JWT, token)
    }
}

fun clearStoredToken(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
        remove(PREF_JWT)
    }
}

fun storeBaseUrl(context: Context, baseUrl: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit {
        putString(PREF_BASE_URL, baseUrl)
    }
}
