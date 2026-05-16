import 'package:contentglowz_app/presentation/screens/editor/editor_formatting.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('toggleBold wraps the selected text', () {
    const text = 'hello world';
    const selection = TextSelection(baseOffset: 0, extentOffset: 5);
    final result = EditorFormatting.toggleBold(text, selection);
    expect(result.text, '**hello** world');
  });

  test('toggleItalic wraps the selected text', () {
    const text = 'hello world';
    const selection = TextSelection(baseOffset: 6, extentOffset: 11);
    final result = EditorFormatting.toggleItalic(text, selection);
    expect(result.text, 'hello _world_');
  });

  test('toggleBulletedList prefixes selected lines', () {
    const text = 'line1\nline2';
    const selection = TextSelection(baseOffset: 0, extentOffset: 11);
    final result = EditorFormatting.toggleBulletedList(text, selection);
    expect(result.text, '- line1\n- line2');
  });

  test('insertLink inserts markdown link', () {
    const text = 'hello world';
    const selection = TextSelection(baseOffset: 6, extentOffset: 11);
    final result = EditorFormatting.insertLink(
      text,
      selection,
      url: 'https://example.com',
    );
    expect(result.text, 'hello [world](https://example.com)');
  });

  test('deleteCurrentParagraph removes paragraph around cursor', () {
    const text = 'first\nsecond\nthird';
    const selection = TextSelection.collapsed(offset: 8);
    final result = EditorFormatting.deleteCurrentParagraph(text, selection);
    expect(result.text, 'first\nthird');
  });
}
