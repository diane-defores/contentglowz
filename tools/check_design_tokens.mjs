#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const FLUTTER_CHECK_FILES = [
  'contentflow_app/lib/presentation/theme/app_theme.dart',
  'contentflow_app/lib/presentation/screens/app_shell.dart',
  'contentflow_app/lib/presentation/screens/entry/entry_screen.dart',
  'contentflow_app/lib/presentation/screens/feed/feed_screen.dart',
  'contentflow_app/lib/presentation/screens/settings/settings_screen.dart',
  'contentflow_app/lib/presentation/screens/auth/auth_screen.dart',
  'contentflow_app/lib/presentation/widgets/in_app_tour_overlay.dart',
];

const SITE_CHECK_ROOTS = [
  'contentflow_site/src/layouts',
  'contentflow_site/src/components',
  'contentflow_site/src/pages',
];

const EXCLUDE_PATH_PATTERNS = [
  /\/build\//,
  /\/dist\//,
  /\/vendor\//,
  /\/spec\//,
];

const LIMITS = {
  flutter: {
    total: 128,
    byRule: {
      dartColor: 7,
      edgeInsets: 43,
      borderRadius: 32,
      fontSize: 44,
      duration: 2,
    },
    byFile: {
      'contentflow_app/lib/presentation/theme/app_theme.dart': 8,
      'contentflow_app/lib/presentation/screens/app_shell.dart': 21,
      'contentflow_app/lib/presentation/screens/entry/entry_screen.dart': 32,
      'contentflow_app/lib/presentation/screens/feed/feed_screen.dart': 25,
      'contentflow_app/lib/presentation/screens/settings/settings_screen.dart': 18,
      'contentflow_app/lib/presentation/screens/auth/auth_screen.dart': 10,
      'contentflow_app/lib/presentation/widgets/in_app_tour_overlay.dart': 14,
    },
  },
  site: {
    total: 401,
    byRule: {
      rawLayoutValue: 401,
    },
    byFile: {
      'contentflow_site/src/layouts/BlogPost.astro': 78,
      'contentflow_site/src/layouts/Layout.astro': 4,
      'contentflow_site/src/components/ClosingCta.astro': 4,
      'contentflow_site/src/components/CtaBanner.astro': 3,
      'contentflow_site/src/components/FAQ.astro': 18,
      'contentflow_site/src/components/Features.astro': 3,
      'contentflow_site/src/components/Footer.astro': 23,
      'contentflow_site/src/components/Hero.astro': 17,
      'contentflow_site/src/components/Navbar.astro': 21,
      'contentflow_site/src/components/Pricing.astro': 31,
      'contentflow_site/src/components/Problem.astro': 16,
      'contentflow_site/src/components/Robots.astro': 26,
      'contentflow_site/src/components/Testimonials.astro': 13,
      'contentflow_site/src/pages/404.astro': 10,
      'contentflow_site/src/pages/blog/index.astro': 47,
      'contentflow_site/src/pages/blog/tag/[tag].astro': 28,
      'contentflow_site/src/pages/design.astro': 18,
      'contentflow_site/src/pages/launch.astro': 11,
      'contentflow_site/src/pages/privacy.astro': 10,
      'contentflow_site/src/pages/sign-in.astro': 10,
      'contentflow_site/src/pages/sign-up.astro': 10,
    },
  },
};

const IGNORE_FLUTTER_FILES = [
  /contentflow_app\/lib\/presentation\/theme\/app_theme_tokens\.dart$/,
];

const LITERALS = {
  flutter: {
    color: /Color\(0x[0-9A-Fa-f]{6,8}\)/,
    edgeInsets:
      /EdgeInsets\.(all|symmetric|only|fromLTRB)\(([^)]*)\)/,
    borderRadius: /BorderRadius\.circular\(([^)]*)\)/,
    fontSize: /\bfontSize\s*:\s*([^,)\n]+)/,
    duration: /Duration\(([^)]*)\)/,
  },
  site: {
    // Common UI properties using unit literals.
    rawLayoutValue:
      /\b(?:padding|margin|gap|row-gap|column-gap|font-size|line-height|border-radius|width|height|top|left|right|bottom|border|box-shadow|transition|animation|text-shadow|transform)\b[^;\n]*?(?:\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%|s|ms))/i,
    styleWithValue: /style\s*=\s*\"[^\"]*(?:\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%|s|ms))[^\"]*\"/i,
    hexColor: /#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/,
    rgbOrHsla: /\b(?:rgb|rgba|hsl|hsla)\(/i,
  },
};

function normalizePath(filePath) {
  return relative(ROOT, filePath).replace(/\\/g, '/');
}

function isIgnoredPath(filePath) {
  const rel = normalizePath(filePath);
  return EXCLUDE_PATH_PATTERNS.some((pattern) => pattern.test(rel));
}

function collectFiles(dir, extensions = ['.dart']) {
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'build' || entry.name === 'dist' || entry.name === 'vendor') {
        continue;
      }
      out.push(...collectFiles(path, extensions));
      continue;
    }
    if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(path);
    }
  }
  return out;
}

function hasNumericLiteral(value) {
  return /\d/.test(value);
}

function scanFlutterFile(filePath) {
  const findings = [];
  const rel = normalizePath(filePath);
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.replace(/\/\/.*$/, '').trim();
    if (!trimmed) {
      return;
    }

    if (LITERALS.flutter.color.test(trimmed)) {
      if (IGNORE_FLUTTER_FILES.some((pattern) => pattern.test(rel))) {
        return;
      }
      findings.push({
        rule: 'dartColor',
        line: index + 1,
        text: trimmed,
      });
      return;
    }

    const edgeInsets = LITERALS.flutter.edgeInsets.exec(trimmed);
    if (edgeInsets && hasNumericLiteral(edgeInsets[2])) {
      findings.push({
        rule: 'edgeInsets',
        line: index + 1,
        text: trimmed,
      });
    }

    const radius = LITERALS.flutter.borderRadius.exec(trimmed);
    if (radius && hasNumericLiteral(radius[1])) {
      findings.push({
        rule: 'borderRadius',
        line: index + 1,
        text: trimmed,
      });
    }

    const font = LITERALS.flutter.fontSize.exec(trimmed);
    if (font && hasNumericLiteral(font[1])) {
      findings.push({
        rule: 'fontSize',
        line: index + 1,
        text: trimmed,
      });
    }

    const duration = LITERALS.flutter.duration.exec(trimmed);
    if (duration && /\b(?:milliseconds|seconds)\s*:\s*\d/.test(duration[1])) {
      findings.push({
        rule: 'duration',
        line: index + 1,
        text: trimmed,
      });
    }
  });

  return findings;
}

function scanSiteFile(filePath) {
  const findings = [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (/^\s*--/.test(trimmed)) {
      return;
    }
    if (trimmed.includes('var(--')) {
      return;
    }

    if (
      LITERALS.site.styleWithValue.test(trimmed) ||
      LITERALS.site.rawLayoutValue.test(trimmed) ||
      LITERALS.site.hexColor.test(trimmed) ||
      LITERALS.site.rgbOrHsla.test(trimmed)
    ) {
      findings.push({
        rule: 'rawLayoutValue',
        line: index + 1,
        text: trimmed,
      });
    }
  });

  return findings;
}

function countByRule(findings) {
  return findings.reduce((acc, it) => {
    acc[it.rule] = (acc[it.rule] || 0) + 1;
    return acc;
  }, {});
}

function formatFinding(file, finding) {
  return `${file}:${finding.line} [${finding.rule}] ${finding.text}`;
}

function run() {
  const findings = [];

  for (const file of FLUTTER_CHECK_FILES) {
    const abs = resolve(ROOT, file);
    if (isIgnoredPath(abs) || !existsSync(abs)) {
      continue;
    }
    const fileFindings = scanFlutterFile(abs);
    if (fileFindings.length > 0) {
      findings.push(...fileFindings.map((f) => ({ surface: 'flutter', file: normalizePath(abs), ...f })));
    }
  }

  for (const root of SITE_CHECK_ROOTS) {
    const absRoot = resolve(ROOT, root);
    const files = collectFiles(absRoot, ['.astro']);
    for (const file of files) {
      if (isIgnoredPath(file)) {
        continue;
      }
      const fileFindings = scanSiteFile(file);
      if (fileFindings.length === 0) {
        continue;
      }
      for (const finding of fileFindings) {
        findings.push({
          surface: 'site',
          file: normalizePath(file),
          ...finding,
        });
      }
    }
  }

  const failures = [];
  const flutterCount = findings.filter((f) => f.surface === 'flutter');
  const siteCount = findings.filter((f) => f.surface === 'site');
  const flutterRules = countByRule(flutterCount);
  const siteRules = countByRule(siteCount);

  if (flutterCount.length > LIMITS.flutter.total) {
    failures.push(
      `flutter global literals (${flutterCount.length}) exceed allowed budget (${LIMITS.flutter.total}).`,
    );
  }
  if (siteCount.length > LIMITS.site.total) {
    failures.push(`site global literals (${siteCount.length}) exceed allowed budget (${LIMITS.site.total}).`);
  }

  for (const [rule, limit] of Object.entries(LIMITS.flutter.byRule)) {
    const count = flutterRules[rule] || 0;
    if (count > limit) {
      failures.push(`flutter:${rule} literals (${count}) exceed allowed budget (${limit}).`);
    }
  }

  for (const [rule, limit] of Object.entries(LIMITS.site.byRule)) {
    const count = siteRules[rule] || 0;
    if (count > limit) {
      failures.push(`site:${rule} literals (${count}) exceed allowed budget (${limit}).`);
    }
  }

  for (const [file, limit] of Object.entries(LIMITS.flutter.byFile)) {
    const count = flutterCount.filter((finding) => finding.file === file).length;
    if (count > limit) {
      failures.push(`flutter file ${file} (${count}) exceeds budget (${limit}).`);
    }
  }

  for (const [file, limit] of Object.entries(LIMITS.site.byFile)) {
    const count = siteCount.filter((finding) => finding.file === file).length;
    if (count > limit) {
      failures.push(`site file ${file} (${count}) exceeds budget (${limit}).`);
    }
  }

  if (failures.length === 0) {
    console.log('design token scan: PASS');
    console.log(
      `flutter findings: ${flutterCount.length} (limit ${LIMITS.flutter.total}), site findings: ${siteCount.length} (limit ${LIMITS.site.total})`,
    );
    return 0;
  }

  const fileGroups = new Map();
  for (const finding of findings) {
    const key = `${finding.file}:${finding.rule}`;
    if (!fileGroups.has(key)) {
      fileGroups.set(key, []);
    }
    fileGroups.get(key).push(finding);
  }

  console.log('design token scan: FAIL');
  console.log('\nBudget failures:');
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }

  console.log('\nLiteral findings:');
  for (const [key, items] of [...fileGroups.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    for (const finding of items) {
      console.log(formatFinding(finding.file, finding));
    }
  }

  console.log(`\nflutter findings: ${flutterCount.length} (limit ${LIMITS.flutter.total}), site findings: ${siteCount.length} (limit ${LIMITS.site.total})`);
  return 1;
}

process.exit(run());
