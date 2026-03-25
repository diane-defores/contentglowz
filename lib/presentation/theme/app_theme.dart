import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const _primaryColor = Color(0xFF6C5CE7);
  static const _secondaryColor = Color(0xFF00B894);
  static const _errorColor = Color(0xFFE17055);
  static const _approveColor = Color(0xFF00B894);
  static const _rejectColor = Color(0xFFE17055);
  static const _editColor = Color(0xFF0984E3);

  static Color get approveColor => _approveColor;
  static Color get rejectColor => _rejectColor;
  static Color get editColor => _editColor;

  static ThemeData get darkTheme {
    final textTheme = GoogleFonts.interTextTheme(ThemeData.dark().textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: _primaryColor,
        secondary: _secondaryColor,
        error: _errorColor,
        surface: const Color(0xFF1A1A2E),
        onSurface: Colors.white,
      ),
      scaffoldBackgroundColor: const Color(0xFF0F0F23),
      textTheme: textTheme,
      cardTheme: CardThemeData(
        color: const Color(0xFF1A1A2E),
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF1A1A2E),
        indicatorColor: _primaryColor.withAlpha(50),
        labelTextStyle: WidgetStateProperty.all(
          textTheme.labelSmall?.copyWith(color: Colors.white70),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF16213E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primaryColor, width: 2),
        ),
      ),
    );
  }

  static Color colorForContentType(String type) {
    return switch (type) {
      'Article' => const Color(0xFF6C5CE7),
      'Social' => const Color(0xFF0984E3),
      'Newsletter' => const Color(0xFFFDAA5E),
      'Video' => const Color(0xFFE17055),
      'Reel' => const Color(0xFFE84393),
      'Short' => const Color(0xFFFF6B6B),
      _ => _primaryColor,
    };
  }
}
