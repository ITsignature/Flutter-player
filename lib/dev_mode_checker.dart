// lib/dev_mode_checker.dart
import 'package:flutter/services.dart';

class DevModeChecker {
  static const _channel = MethodChannel('dev_mode_checker');

  static Future<bool> isDeveloperModeOn() async {
    final result = await _channel.invokeMethod<bool>('isDeveloperModeOn');
    return result ?? false;
  }
}
