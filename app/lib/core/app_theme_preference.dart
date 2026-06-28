import 'package:flutter/material.dart';

const String appThemeSystem = 'system';
const String appThemeLight = 'light';
const String appThemeDark = 'dark';
const String appThemeApp = 'app';

String normalizeAppThemePreference(String? raw) {
  final value = raw?.trim().toLowerCase();
  return switch (value) {
    appThemeLight => appThemeLight,
    appThemeDark => appThemeDark,
    appThemeApp => appThemeApp,
    _ => appThemeSystem,
  };
}

ThemeMode themeModeFromPreference(String? raw) {
  return switch (normalizeAppThemePreference(raw)) {
    appThemeLight => ThemeMode.light,
    appThemeDark => ThemeMode.dark,
    appThemeApp => ThemeMode.light,
    _ => ThemeMode.system,
  };
}
