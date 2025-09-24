// lib/main.dart
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'player_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final AppLinks _appLinks;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    // Cold start
    final initial = await _appLinks.getInitialLink();
    if (initial != null) {
      _handleLink(initial);
    }

    // While app is running and receives links
    _appLinks.uriLinkStream.listen(_handleLink);
  }

  void _handleLink(Uri uri) {
    final token = uri.queryParameters['token'];
    if (token != null && token.isNotEmpty) {
      // Navigate to PlayerScreen with the real token
      navigatorKey.currentState?.pushReplacement(
        MaterialPageRoute(builder: (_) => PlayerScreen(token: token, domain: '')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      // Instead of HomeScreen, make the player always the first screen
      // Passing empty token => will show the “no content” screen in your JS
      home: const PlayerScreen(token: '', domain: ''),
    );
  }
}
