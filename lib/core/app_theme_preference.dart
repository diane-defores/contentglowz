import 'package:flutter/material.dart';

const String appThemeSystem = 'system';
const String appThemeLight = 'light';
const String appThemeDark = 'dark';

String normalizeAppThemePreference(String? raw) {
  final value = raw?.trim().toLowerCase();
  return switch (value) {
    appThemeLight => appThemeLight,
    appThemeDark => appThemeDark,
    _ => appThemeSystem,
  };
}

ThemeMode themeModeFromPreference(String? raw) {
  return switch (normalizeAppThemePreference(raw)) {
    appThemeLight => ThemeMode.light,
    appThemeDark => ThemeMode.dark,
    _ => ThemeMode.system,
  };
}
