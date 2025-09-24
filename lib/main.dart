// lib/main.dart
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'player_screen.dart';
import 'package:screen_protector/screen_protector.dart';

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
    _protectScreens();
    _initDeepLinks();
  }


 Future<void> _protectScreens() async {
    // Blocks screenshots/screen recording on Android; no-op on iOS (per docs)
    await ScreenProtector.protectDataLeakageOn();         // Android only :contentReference[oaicite:1]{index=1}
    await ScreenProtector.preventScreenshotOn();           // Android + iOS supported API name :contentReference[oaicite:2]{index=2}

    // iOS: observe events and react (e.g., overlay or pause player)
    ScreenProtector.addListener(
      () {
        // Screenshot taken (iOS)
        debugPrint('📸 iOS screenshot detected');
        // TODO: show overlay / pause via navigatorKey + JS call if you want
      },
      (bool isRecording) {
        debugPrint('🎥 iOS recording: $isRecording');
        // TODO: show/hide overlay or pause/resume the WebView video
      },
    );
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
  void dispose() {
    ScreenProtector.removeListener();                       // iOS observer off :contentReference[oaicite:3]{index=3}
    ScreenProtector.preventScreenshotOff();                 // cleanup :contentReference[oaicite:4]{index=4}
    ScreenProtector.protectDataLeakageOff();                // cleanup :contentReference[oaicite:5]{index=5}
    super.dispose();
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
