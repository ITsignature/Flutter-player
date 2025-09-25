// lib/main.dart
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'player_screen.dart';
import 'package:screen_protector/screen_protector.dart';
import 'dev_mode_checker.dart';
import 'package:upgrader/upgrader.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Upgrader.clearSavedSettings();
  // 🚫 Do NOT await any platform channel here. Just boot.
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final AppLinks _appLinks;
  bool _blocked = false; // overlay flag

  @override
  void initState() {
    super.initState();
    _protectScreens();
    _initDeepLinks();
    _checkDevModeAfterBoot();
  }

  // Start the dev-mode check asynchronously, with a safety timeout.
  Future<void> _checkDevModeAfterBoot() async {
    bool blocked = false;
    try {
      final result = await DevModeChecker
          .isDeveloperModeOn()
          .timeout(const Duration(seconds: 2)); // don’t stall first frame
      blocked = result;
    } catch (_) {
      // If it times out or errors, don’t block UI.
      blocked = false;
    }
    if (mounted && blocked != _blocked) {
      setState(() => _blocked = blocked);
    }
  }

  Future<void> _protectScreens() async {
    // Keep this minimal to avoid jank. FLAG_SECURE is applied natively already.
    try {
      await ScreenProtector.preventScreenshotOn(); // one call is enough
      // Listener signature is (onScreenshot, onRecordingChanged)
      ScreenProtector.addListener(
        () {
          debugPrint('📸 iOS screenshot detected');
        },
        (bool isRecording) {
          debugPrint('🎥 iOS recording: $isRecording');
        },
      );
    } catch (_) {}
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    final initial = await _appLinks.getInitialLink();
    if (initial != null) _handleLink(initial);

    _appLinks.uriLinkStream.listen(_handleLink, onError: (_) {});
  }

  void _handleLink(Uri uri) {
    final token = uri.queryParameters['token'];
    if (token != null && token.isNotEmpty) {
      navigatorKey.currentState?.pushReplacement(
        MaterialPageRoute(builder: (_) => PlayerScreen(token: token, domain: '')),
      );
    }
  }

  @override
  void dispose() {
    try {
      ScreenProtector.removeListener();
      ScreenProtector.preventScreenshotOff();
      // (protectDataLeakageOn/Off not needed when FLAG_SECURE + preventScreenshotOn are used)
    } catch (_) {}
    super.dispose();
  }


@override
Widget build(BuildContext context) {
  return UpgradeAlert(
        showIgnore: false,
        showLater: false,
        dialogStyle: UpgradeDialogStyle.material,
        
    // upgrader: Upgrader(
    //     debugLogging: true,
    //     debugDisplayAlways: true,
    //     minAppVersion: '9.9.9'
    // ),
    
    child: MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      home: Stack(
        children: [
          const PlayerScreen(token: '', domain: ''),
          if (_blocked) const _BlockedOverlay(),
        ],
      ),
    ),
  );
}
}

class _BlockedOverlay extends StatelessWidget {
  const _BlockedOverlay();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.block, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                "🚫 Developer Mode is enabled",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),
              Text(
                "Please disable it to continue.",
                style: TextStyle(fontSize: 16, color: Colors.black54),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
