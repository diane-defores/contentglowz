import 'dart:html' as html;

String? readHandoffTokenFromCurrentUrl() {
  final current = Uri.parse(html.window.location.href);
  final directToken = current.queryParameters['handoff_token'];
  if (directToken != null && directToken.isNotEmpty) {
    return directToken;
  }

  final fragment = current.fragment;
  if (fragment.isEmpty) {
    return null;
  }

  final normalized = fragment.startsWith('/') ? fragment : '/$fragment';
  final hashUri = Uri.parse(normalized);
  final hashToken = hashUri.queryParameters['handoff_token'];
  if (hashToken != null && hashToken.isNotEmpty) {
    return hashToken;
  }

  return null;
}

bool clearHandoffTokenFromCurrentUrl() {
  final current = Uri.parse(html.window.location.href);
  final searchParams = Map<String, String>.from(current.queryParameters);
  final hadDirectToken = searchParams.remove('handoff_token') != null;

  var cleanedFragment = current.fragment;
  var hadHashToken = false;
  if (current.fragment.isNotEmpty) {
    final normalized = current.fragment.startsWith('/')
        ? current.fragment
        : '/${current.fragment}';
    final hashUri = Uri.parse(normalized);
    final hashParams = Map<String, String>.from(hashUri.queryParameters);
    hadHashToken = hashParams.remove('handoff_token') != null;
    cleanedFragment = hashUri
        .replace(
          query: hashParams.isEmpty
              ? null
              : Uri(queryParameters: hashParams).query,
        )
        .toString();
  }

  if (!hadDirectToken && !hadHashToken) {
    return false;
  }

  final cleanedUrl = current.replace(
    query: searchParams.isEmpty ? null : Uri(queryParameters: searchParams).query,
    fragment: cleanedFragment.isEmpty ? null : cleanedFragment,
  );
  html.window.history.replaceState(null, '', cleanedUrl.toString());
  return true;
}
