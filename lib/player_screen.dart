// lib/player_screen.dart
import 'dart:io';
import 'dart:collection'; // <-- for UnmodifiableListView
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({
    super.key,
    required this.token,
    required this.domain,
  });

  final String token;
  final String domain;

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  InAppWebViewController? _controller;

  @override
  Widget build(BuildContext context) {
        final query = Uri(queryParameters: {
        'id': widget.token,
        }).query;

    // Android loads assets via virtual HTTPS origin:
        final androidWebUri = WebUri(
        'https://appassets.androidplatform.net/assets/flutter_assets/assets/player/player.html?$query'
        );

    // iOS loads from file:
    const iosFilePath = 'assets/player/player.html';

    return Scaffold(
      appBar: AppBar(title: const Text('ITS Platinum Player')),
      body: InAppWebView(
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          // ✅ correct setting name in current versions
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true, // inline <video> on iOS
          allowsBackForwardNavigationGestures: true,
              webViewAssetLoader: WebViewAssetLoader(
                pathHandlers: [
                    // This handler lets you load your Flutter app assets via the special host
                    AssetsPathHandler(path: '/assets/'),
                ],
    ),
        ),
        initialUrlRequest: URLRequest(
          url: Platform.isAndroid ? androidWebUri : null,
        ),
        initialFile: Platform.isIOS || Platform.isMacOS ? iosFilePath : null,
        initialUserScripts: UnmodifiableListView<UserScript>([
          UserScript(
            source: """
              // Optional: expose a place to stash values if you ever need it
              window.ITS_BRIDGE_DATA = window.ITS_BRIDGE_DATA || {};
            """,
            injectionTime: UserScriptInjectionTime.AT_DOCUMENT_START,
          ),
        ]),
        onWebViewCreated: (controller) async {
          _controller = controller;

          // JS -> Flutter bridge
          controller.addJavaScriptHandler(
            handlerName: 'fromJs',
            callback: (args) {
              debugPrint('fromJs: $args');
              return {'ok': true};
            },
          );

          // Append query on iOS after load so your JS can read location.search
          if (Platform.isIOS || Platform.isMacOS) {
            await controller.loadFile(assetFilePath: iosFilePath);
            await controller.evaluateJavascript(source: """
              (function() {
                const params = new URLSearchParams(window.location.search);
                if (!params.has('id')) params.set('id', '${Uri.encodeComponent(widget.token)}');
                if (!params.has('domain')) params.set('domain', '${Uri.encodeComponent(widget.domain)}');
                const url = window.location.origin + window.location.pathname + '?' + params.toString() + window.location.hash;
                history.replaceState(null, '', url);
              })();
            """);
          }
        },
        shouldOverrideUrlLoading: (controller, action) async {
          final uri = action.request.url;
          if (uri == null) return NavigationActionPolicy.ALLOW;
          if (Platform.isAndroid && uri.host == 'appassets.androidplatform.net') {
            return NavigationActionPolicy.ALLOW;
          }
          return NavigationActionPolicy.ALLOW;
        },
      ),
    );
  }
}
