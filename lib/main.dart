import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ItsignatureApp());
}

class ItsignatureApp extends StatefulWidget {
  const ItsignatureApp({super.key});

  @override
  State<ItsignatureApp> createState() => _ItsignatureAppState();
}

class _ItsignatureAppState extends State<ItsignatureApp> {
  late final AppLinks _appLinks;           // AppLinks is a singleton
  StreamSubscription<Uri>? _linkSub;

  String? _rawLink;
  String? _token;
  String? _domain;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();                 // instantiate EARLY (cold-start)
    try {
      // ✅ Correct API for 6.x
      final initial = await _appLinks.getInitialLink(); // Uri?
      if (initial != null) _parseAndSet(initial);
    } catch (e) {
      setState(() => _error = 'Failed to read initial link: $e');
    }

    // Also handle links while the app is running/resumed
    _linkSub = _appLinks.uriLinkStream.listen(
      (uri) => _parseAndSet(uri),
      onError: (err) => setState(() => _error = 'Link stream error: $err'),
    );
  }

  void _parseAndSet(Uri uri) {
    try {
      final token = uri.queryParameters['token'];
      final domain = uri.queryParameters['domain'];
      setState(() {
        _rawLink = uri.toString();
        _token = token;
        _domain = domain;
        _error = null;
      });
      // ignore: avoid_print
      print('Token: $_token, Domain: $_domain');
    } catch (e) {
      setState(() {
        _rawLink = uri.toString();
        _token = null;
        _domain = null;
        _error = 'Invalid link: $e';
      });
    }
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'itsignature player',
      home: Scaffold(
        appBar: AppBar(title: const Text('itsignature player')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Deep Link:', style: TextStyle(fontWeight: FontWeight.bold)),
              SelectableText(_rawLink ?? '(none)'),
              const SizedBox(height: 16),
              const Text('Parsed values:', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('token: ${_token ?? '(missing)'}'),
              Text('domain: ${_domain ?? '(missing)'}'),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text('Error: $_error', style: const TextStyle(color: Colors.red)),
              ],
              const Spacer(),
              const Text('Try: itsignature://?token=abc123&domain=its.com',
                  style: TextStyle(fontStyle: FontStyle.italic)),
            ],
          ),
        ),
      ),
    );
  }
}
