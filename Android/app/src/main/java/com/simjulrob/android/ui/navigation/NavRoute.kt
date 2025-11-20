package com.simjulrob.android.ui.navigation

sealed class NavRoute(val route: String) {
    data object Home : NavRoute("home")
    data object AddHabit : NavRoute("add_habit")
}