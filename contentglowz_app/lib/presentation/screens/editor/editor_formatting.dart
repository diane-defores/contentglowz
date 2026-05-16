import 'package:flutter/services.dart';

class EditorFormattingResult {
  const EditorFormattingResult({required this.text, required this.selection});

  final String text;
  final TextSelection selection;
}

class EditorFormatting {
  static EditorFormattingResult toggleBold(
    String text,
    TextSelection selection,
  ) {
    return _wrapSelection(text, selection, '**', '**');
  }

  static EditorFormattingResult toggleItalic(
    String text,
    TextSelection selection,
  ) {
    return _wrapSelection(text, selection, '_', '_');
  }

  static EditorFormattingResult toggleHeading(
    String text,
    TextSelection selection,
  ) {
    return _prefixLines(text, selection, '# ');
  }

  static EditorFormattingResult toggleBulletedList(
    String text,
    TextSelection selection,
  ) {
    return _prefixLines(text, selection, '- ');
  }

  static EditorFormattingResult toggleQuote(
    String text,
    TextSelection selection,
  ) {
    return _prefixLines(text, selection, '> ');
  }

  static EditorFormattingResult clearBasicFormatting(
    String text,
    TextSelection selection,
  ) {
    final normalized = _normalizeSelection(selection, text.length);
    if (!normalized.isValid) {
      return EditorFormattingResult(text: text, selection: selection);
    }

    final start = normalized.start;
    final end = normalized.end;
    final selected = text.substring(start, end);
    final cleaned = selected
        .replaceAll(RegExp(r'\*\*(.*?)\*\*'), r'$1')
        .replaceAll(RegExp(r'_(.*?)_'), r'$1')
        .replaceAll(RegExp(r'^#\s+', multiLine: true), '')
        .replaceAll(RegExp(r'^-\s+', multiLine: true), '')
        .replaceAll(RegExp(r'^>\s+', multiLine: true), '');
    final nextText = text.replaceRange(start, end, cleaned);
    return EditorFormattingResult(
      text: nextText,
      selection: TextSelection(
        baseOffset: start,
        extentOffset: start + cleaned.length,
      ),
    );
  }

  static EditorFormattingResult insertLink(
    String text,
    TextSelection selection, {
    required String url,
    String? label,
  }) {
    final normalized = _normalizeSelection(selection, text.length);
    if (!normalized.isValid) {
      return EditorFormattingResult(text: text, selection: selection);
    }

    final start = normalized.start;
    final end = normalized.end;
    final selectedText = text.substring(start, end);
    final linkLabel = (label == null || label.trim().isEmpty)
        ? (selectedText.isEmpty ? 'link' : selectedText)
        : label.trim();
    final markdown = '[$linkLabel](${url.trim()})';
    final nextText = text.replaceRange(start, end, markdown);
    final endOffset = start + markdown.length;
    return EditorFormattingResult(
      text: nextText,
      selection: TextSelection.collapsed(offset: endOffset),
    );
  }

  static EditorFormattingResult deleteCurrentParagraph(
    String text,
    TextSelection selection,
  ) {
    final normalized = _normalizeSelection(selection, text.length);
    if (!normalized.isValid || text.isEmpty) {
      return EditorFormattingResult(text: text, selection: selection);
    }

    var paragraphStart = text.lastIndexOf('\n', normalized.start - 1);
    paragraphStart = paragraphStart == -1 ? 0 : paragraphStart + 1;
    var paragraphEnd = text.indexOf('\n', normalized.end);
    paragraphEnd = paragraphEnd == -1 ? text.length : paragraphEnd + 1;

    final nextText = text.replaceRange(paragraphStart, paragraphEnd, '');
    final cursor = paragraphStart > nextText.length
        ? nextText.length
        : paragraphStart;
    return EditorFormattingResult(
      text: nextText,
      selection: TextSelection.collapsed(offset: cursor),
    );
  }

  static EditorFormattingResult _wrapSelection(
    String text,
    TextSelection selection,
    String prefix,
    String suffix,
  ) {
    final normalized = _normalizeSelection(selection, text.length);
    if (!normalized.isValid) {
      return EditorFormattingResult(text: text, selection: selection);
    }

    final start = normalized.start;
    final end = normalized.end;
    final selected = text.substring(start, end);
    if (selected.isEmpty) {
      final insert = '$prefix$suffix';
      final nextText = text.replaceRange(start, end, insert);
      final cursor = start + prefix.length;
      return EditorFormattingResult(
        text: nextText,
        selection: TextSelection.collapsed(offset: cursor),
      );
    }

    final wrapped = '$prefix$selected$suffix';
    final nextText = text.replaceRange(start, end, wrapped);
    return EditorFormattingResult(
      text: nextText,
      selection: TextSelection(
        baseOffset: start,
        extentOffset: start + wrapped.length,
      ),
    );
  }

  static EditorFormattingResult _prefixLines(
    String text,
    TextSelection selection,
    String prefix,
  ) {
    final normalized = _normalizeSelection(selection, text.length);
    if (!normalized.isValid) {
      return EditorFormattingResult(text: text, selection: selection);
    }

    final start = normalized.start;
    final end = normalized.end;
    final searchFrom = start <= 0 ? 0 : start - 1;
    final lineStart = text.lastIndexOf('\n', searchFrom);
    final realStart = lineStart == -1 ? 0 : lineStart + 1;
    final lineEnd = text.indexOf('\n', end);
    final realEnd = lineEnd == -1 ? text.length : lineEnd;
    final block = text.substring(realStart, realEnd);
    final lines = block.split('\n');
    final nextBlock = lines
        .map((line) {
          if (line.isEmpty) return line;
          return line.startsWith(prefix)
              ? line.substring(prefix.length)
              : '$prefix$line';
        })
        .join('\n');
    final nextText = text.replaceRange(realStart, realEnd, nextBlock);
    final nextSelectionEnd = realStart + nextBlock.length;
    return EditorFormattingResult(
      text: nextText,
      selection: TextSelection(
        baseOffset: realStart,
        extentOffset: nextSelectionEnd,
      ),
    );
  }

  static TextSelection _normalizeSelection(
    TextSelection selection,
    int length,
  ) {
    final base = selection.baseOffset.clamp(0, length);
    final extent = selection.extentOffset.clamp(0, length);
    final start = base < extent ? base : extent;
    final end = base < extent ? extent : base;
    return TextSelection(baseOffset: start, extentOffset: end);
  }
}
