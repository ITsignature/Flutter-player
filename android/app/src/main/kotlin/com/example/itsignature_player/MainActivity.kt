// android/app/src/main/kotlin/com/example/itsignature_player/MainActivity.kt
package com.example.itsignature_player

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.WindowManager
import android.widget.Toast
import io.flutter.embedding.android.FlutterActivity
import java.io.File
import java.util.Locale

class MainActivity : FlutterActivity() {

  companion object {
    /**
     * DEBUG SWITCH:
     * - false (default): ENFORCE blocking (finish app) when any reason is found.
     * - true: DO NOT block; only Toast + Log reasons so you can debug on your device.
     */
    const val SECURITY_DEBUG_MODE: Boolean = false

    // Extra logging to Logcat
    const val SECURITY_LOG_VERBOSE: Boolean = true

    private const val MIN_BLOCK_SCORE = 1

    // Debounce: ensure we run once per process
    private var securityEvaluated = false
    private var lastBlockScore = 0
    private var lastReasons: List<String> = emptyList()
    private var toastShown = false

    private const val TAG = "ITS-Security"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Offer Usage Access if not granted (so foreground detection works well)
    maybeRequestUsageAccess(this)

    if (!securityEvaluated) {
      val (reasons, score, runningPkg) = collectSecurityFindings(this)
      securityEvaluated = true
      lastReasons = reasons
      lastBlockScore = score

      if (reasons.isNotEmpty()) {
        if (SECURITY_LOG_VERBOSE) {
          Log.w(TAG, "Security triggers (score=$score):")
          reasons.forEach { Log.w(TAG, " - $it") }
        }

        if (!toastShown) {
          val first = reasons.first()
          val message =
            if (SECURITY_DEBUG_MODE) {
              "DEBUG (not blocking): $first"
            } else {
              // If we are blocking and we detected a running suspicious package, show it explicitly.
              if (score >= MIN_BLOCK_SCORE && runningPkg != null) {
                "Blocked: Monitoring / reverse tool running now: $runningPkg"
              } else {
                "Blocked: $first"
              }
            }
          Toast.makeText(this, message, Toast.LENGTH_LONG).show()
          toastShown = true
        }
      }

      if (!SECURITY_DEBUG_MODE && score >= MIN_BLOCK_SCORE) {
        // ENFORCE block exactly once
        finishAndRemoveTask()
        return
      }
    }

    super.onCreate(savedInstanceState)

    // Prevent screenshots/recording
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }

  /**
   * Collect all triggers so you can see every reason at once while debugging.
   * In enforce mode we still only toast the first, but we log them all.
   * Returns (reasons, score, runningToolPkg).
   */
  private fun collectSecurityFindings(ctx: Context): Triple<List<String>, Int, String?> {
    val reasons = mutableListOf<String>()
    var score = 0
    var runningToolPkg: String? = null

    getEmulatorReason(ctx)?.let { reasons.add(it); score += 2 }
    if (isDeveloperModeOn(ctx)) { reasons.add("Developer mode enabled"); score += 2 }
    if (isAppDebuggable(ctx)) { reasons.add("App is debuggable build"); score += 2 }
    if (isProxySet()) { reasons.add("Proxy detected"); score += 1 }
    if (isVpnActive(ctx)) { reasons.add("VPN connection detected"); score += 1 }

    // Detect RUNNING suspicious tool (reports package/label)
    detectRunningSniffingTool(ctx)?.let { pkg ->
      runningToolPkg = pkg
      reasons.add("Monitoring / reverse tool running now: $pkg")
      score += 2
    }

    if (hasSuspiciousFiles()) { reasons.add("Suspicious files present (root/frida/su)"); score += 2 }

    // If usage access is not granted, surface that for visibility (no score impact)
    if (!isUsageAccessGranted(ctx)) {
      reasons.add("Usage access not granted — foreground detection may be limited")
    }

    return Triple(reasons, score, runningToolPkg)
  }

  // ---------- Existing checks ----------

  private fun isDeveloperModeOn(context: Context): Boolean {
    val devEnabled = try {
      Settings.Global.getInt(context.contentResolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1
    } catch (_: Exception) { false }
    val adb = try {
      Settings.Global.getInt(context.contentResolver, Settings.Global.ADB_ENABLED, 0) == 1
    } catch (_: Exception) { false }
    return devEnabled || adb
  }

  private fun isAppDebuggable(context: Context): Boolean {
    return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
  }

  private fun isVpnActive(context: Context): Boolean {
    return try {
      val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      val networks = cm.allNetworks ?: return false
      for (n in networks) {
        val caps = cm.getNetworkCapabilities(n)
        if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
          return true
        }
      }
      false
    } catch (_: Exception) { false }
  }

  private fun isProxySet(): Boolean {
    val proxyHost = System.getProperty("http.proxyHost") ?: System.getProperty("https.proxyHost")
    val proxyPort = System.getProperty("http.proxyPort") ?: System.getProperty("https.proxyPort")
    return !proxyHost.isNullOrEmpty() && !proxyPort.isNullOrEmpty()
  }

  /**
   * Detects suspicious tools that are RUNNING NOW (foreground or recently foregrounded).
   * Returns "package (Label)" if available, else just package/process name. Returns null if none.
   */
  private fun detectRunningSniffingTool(context: Context, lookbackSeconds: Long = 60): String? {
    val suspiciousTokens = listOf(
      // proxies / MITM / HTTP debugging
      "burp", "charles", "mitm", "mitmproxy", "fiddler", "packetcapture", "packet capture",
      // mobile proxy / debugging apps
      "httpcanary", "network monitor", "netcapture", "ssl capture",
      // instrumentation / dynamic analysis
      "frida", "frida-server", "frida-gadget", "objection", "substrate", "substratum",
      // reverse engineering / decompilers / disassemblers
      "jadx", "jadx-gui", "apktool", "dex2jar", "jd-gui", "jdgui", "ida", "ida pro",
      "radare2", "r2", "hopper", "ghidra", "cutter",
      // patchers / cracking tools
      "luckypatcher", "lucky patcher", "cheat engine", "gameguardian", "xposed", "magisk",
      "edxposed", "titan", "titanium", "sai", "installer", "module",
      // root / su / common rooting frameworks
      "su", "superuser", "kingroot", "kingoroot", "phh", "rootcloak",
      // screen recording / screencast apps
      "azscreen", "az screen", "azrecorder", "mobizen", "du recorder", "scr pro", "recorder",
      "screenrec", "screen recorder", "screenrecorder", "screen recorder & video capture",
      // desktop remote / capture tools that sometimes appear as Android apps
      "vysor", "scrcpy", "teamviewer", "anydesk",
      // VPN / interception apps (common package fragments)
      "openvpn", "wireguard", "strongswan", "vpndialog", "vpn",
      // monitoring / reverse frameworks
      "x64dbg", "olly", "dnspy", "wireshark", "tcpdump", "tshark"
    ).map { it.lowercase(Locale.ROOT) }

    // ---- 1) Preferred: UsageStats foreground events (requires user-granted Usage Access) ----
    try {
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? android.app.usage.UsageStatsManager
      if (usm != null && isUsageAccessGranted(context)) {
        val end = System.currentTimeMillis()
        val start = end - (lookbackSeconds * 1000L)
        val ue = usm.queryEvents(start, end)
        val ev = android.app.usage.UsageEvents.Event()
        var hitPkg: String? = null
        while (ue.hasNextEvent()) {
          ue.getNextEvent(ev)
          val type = ev.eventType
          val moveToFg = type == android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND
          val resumed = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) &&
                        (type == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED)
          if (moveToFg || resumed) {
            val pkg = (ev.packageName ?: "").lowercase(Locale.ROOT)
            if (suspiciousTokens.any { pkg.contains(it) }) {
              hitPkg = ev.packageName
            }
          }
        }
        if (hitPkg != null) {
          val pm = context.packageManager
          val label = try { pm.getApplicationLabel(pm.getApplicationInfo(hitPkg!!, 0)).toString() } catch (_: Exception) { "" }
          return if (label.isNotBlank()) "$hitPkg ($label)" else hitPkg
        }
      }
    } catch (_: Exception) { /* fall through */ }

    // ---- 2) Fallback: ActivityManager running processes (limited on modern Android) ----
    try {
      val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
      am?.runningAppProcesses?.forEach { proc ->
        val pname = (proc.processName ?: "").lowercase(Locale.ROOT)
        if (suspiciousTokens.any { pname.contains(it) }) {
          return proc.processName
        }
      }
    } catch (_: Exception) { /* fall through */ }


// ---- 3) Last resort: parse `ps` output (often restricted; may only show own process) ----
try {
  val p = ProcessBuilder("sh", "-c", "ps -A || ps").start()
  p.inputStream.bufferedReader().useLines { lines ->
    lines.forEach { raw ->
      val line = raw.trim()
      val l = line.lowercase(Locale.ROOT)

      // Only consider lines that contain any suspicious token (word-boundary match)
      if (suspiciousTokens.any { token ->
            Regex("\\b${Regex.escape(token)}\\b").containsMatchIn(l)
          }) {

        // Try to pull out an Android-style package name from the line
        val pkg = extractPackageCandidate(line)
        if (pkg != null) {
          return pkg
        }

        // If we couldn't extract a package, try the final column, but validate/denylist it
        val parts = line.split(Regex("\\s+"))
        val lastCol = parts.lastOrNull()?.trim() ?: ""
        if (isLikelyPackageName(lastCol) && !isDeniedProcess(lastCol)) {
          return lastCol
        }
        // Otherwise ignore matches like 'sh', 'ps', etc.
      }
    }
  }
} catch (_: Exception) { /* ignore */ }

    return null
  }


  // ===== Usage Access helpers =====
/** Returns true if 'name' looks like an Android package: a.b.c */
private fun isLikelyPackageName(name: String): Boolean {
  val n = name.trim()
  // Basic package structure: at least one dot and valid segments
  val pkgRegex = Regex("^[a-zA-Z][a-zA-Z0-9_]*(\\.[a-zA-Z0-9_]+)+$")
  return pkgRegex.matches(n)
}

/** System/generic processes we should ignore in the ps fallback */
private fun isDeniedProcess(name: String): Boolean {
  val n = name.lowercase(Locale.ROOT)
  val deny = setOf(
    "sh", "ps", "toybox", "toolbox",
    "app_process", "app_process64", "app_process32",
    "zygote", "zygote64", "zygote32",
    "logcat", "surfaceflinger", "system_server", "linker", "linker64"
  )
  return n in deny
}

/** Try to extract an Android package name from a ps line (cmd path or args). */
private fun extractPackageCandidate(line: String): String? {
  // Common patterns: package names appear in cmdline/args or after a colon process
  // Examples:
  //   com.example.app
  //   com.example.app:remote
  //   /data/app/~~hash==/com.example.app-some/base.apk
  //   u0_a123  1234  ... com.example.app
  val pkgPattern = Regex("([a-zA-Z][a-zA-Z0-9_]*(?:\\.[a-zA-Z0-9_]+)+)")
  val match = pkgPattern.find(line) ?: return null
  val candidate = match.groupValues[1]
  // Strip colon-suffix (e.g., com.foo.bar:service)
  val base = candidate.substringBefore(':')
  return if (isLikelyPackageName(base) && !isDeniedProcess(base)) base else null
}




  /** True if the app appears to have Usage Access (heuristic but effective). */
  private fun isUsageAccessGranted(context: Context): Boolean {
    return try {
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? android.app.usage.UsageStatsManager ?: return false
      val now = System.currentTimeMillis()
      val stats = usm.queryAndAggregateUsageStats(now - 60_000, now)
      stats.isNotEmpty()
    } catch (_: Exception) { false }
  }

  /** Opens the system Usage Access settings screen. */
  private fun openUsageAccessSettings(context: Context) {
    try {
      context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
    } catch (_: Exception) {
      Toast.makeText(context, "Unable to open Usage Access settings", Toast.LENGTH_LONG).show()
    }
  }

  /**
   * If Usage Access is missing, show a friendly dialog that explains why and lets
   * the user open the settings directly. No scoring/blocking here.
   */
 private fun maybeRequestUsageAccess(context: Context) {
  if (isUsageAccessGranted(context)) return

  // Avoid stacking dialogs if system restores the activity
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && isDestroyed) return

  val dialog = AlertDialog.Builder(this)
    .setTitle("Usage Access Required")
    .setMessage(
      "To continue, you must enable Usage Access for this app.\n\n" +
      "This permission is required to protect your session from active " +
      "MITM/debugging tools."
    )
    .setCancelable(false) // 🔒 Mandatory: user must choose
    .setPositiveButton("Open Settings") { _, _ ->
      openUsageAccessSettings(context)
    }
    .setNegativeButton("Exit App") { _, _ ->
      finishAndRemoveTask()
    }
    .create()

  // If the user comes back without granting, close the app.
  dialog.setOnDismissListener {
    if (!isUsageAccessGranted(context)) {
      finishAndRemoveTask()
    }
  }

  dialog.show()
}


  private fun hasSuspiciousFiles(): Boolean {
    val paths = listOf(
      "/data/local/tmp/frida-server",
      "/system/xbin/su",
      "/system/bin/su",
      "/sbin/su"
    )
    return paths.any { File(it).exists() }
  }

  // ---------- Emulator detection block ----------

  private fun getEmulatorReason(context: Context): String? {
    checkBuildProps()?.let { return it }
    checkEmulatorFiles()?.let { return it }
    checkKnownEmulatorPackages(context.packageManager)?.let { return it }
    checkTelephonyProperties(context)?.let { return it }
    checkSensorCount(context)?.let { return it }
    checkQemuProperty()?.let { return it }
    return null
  }

  private fun checkBuildProps(): String? {
    val fingerprint = Build.FINGERPRINT?.lowercase(Locale.ROOT) ?: ""
    val model = Build.MODEL?.lowercase(Locale.ROOT) ?: ""
    val product = Build.PRODUCT?.lowercase(Locale.ROOT) ?: ""
    val manufacturer = Build.MANUFACTURER?.lowercase(Locale.ROOT) ?: ""
    val brand = Build.BRAND?.lowercase(Locale.ROOT) ?: ""
    val device = Build.DEVICE?.lowercase(Locale.ROOT) ?: ""
    val hardware = Build.HARDWARE?.lowercase(Locale.ROOT) ?: ""

    val checks = listOf(
      fingerprint.startsWith("generic"),
      fingerprint.contains("generic"),
      fingerprint.contains("unknown"),
      model.contains("sdk") || model.contains("emulator") || model.contains("simulator") || model.contains("nox"),
      product.contains("sdk") || product.contains("sdk_x86") || product.contains("vbox86p") || product.contains("nox"),
      manufacturer.contains("genymotion") || manufacturer.contains("nox"),
      brand.startsWith("generic"),
      device.startsWith("generic"),
      hardware.contains("goldfish"),
      hardware.contains("ranchu"),
      hardware.contains("ttvm"),
      hardware.contains("nox"),
      hardware.contains("vbox")
    )

    if (checks.any { it }) {
      if (manufacturer.contains("genymotion")) return "Genymotion emulator detected (manufacturer)"
      if (model.contains("google_sdk") || product.contains("sdk")) return "Android SDK emulator detected"
      if (product.contains("vbox86p") || fingerprint.contains("vbox")) return "VirtualBox-based emulator detected"
      if (model.contains("nox") || product.contains("nox") || hardware.contains("nox")) return "Nox Player detected"
      if (manufacturer.contains("android") && product.contains("sdk_gphone")) return "Android Emulator (GMS image) detected"
      return "Generic emulator environment detected (Build props)"
    }
    return null
  }

  private fun checkEmulatorFiles(): String? {
    val paths = listOf(
      "/dev/socket/qemud",
      "/dev/qemu_pipe",
      "/system/bin/qemu-props",
      "/system/lib/libc_malloc_debug_qemu.so",
      "/sys/qemu_trace",
      "/system/bin/androVM-prop",
      "/system/bin/microvirt-prop"
    )
    for (p in paths) {
      try {
        if (File(p).exists()) {
          return "Emulator-related file found: $p"
        }
      } catch (_: Exception) { }
    }
    return null
  }

  private fun checkKnownEmulatorPackages(pm: PackageManager): String? {
    val emulatorTokens = listOf(
      // NOX / BigNox
      "com.bignox", "com.nox", "com.bignox.app", "com.bignox.appplayer",
      // MEMU
      "com.memu", "com.memu.launcher",
      // LDPlayer
      "com.ledongli.ldplayer", "com.ld", "com.ld.player",
      // BlueStacks
      "com.bluestacks", "com.bluestacks.appplayer",
      // Genymotion
      "com.genymotion", "com.qualcomm.simulator",
      // KOPlayer, Andy, RemixOS etc.
      "com.koplayer", "com.andy", "com.remixos",
      // desktop mirror/control apps
      "com.vysor", "com.amiduos", "com.samsung.android.vysor",
      "com.scrcpy", "com.teamviewer.quicksupport", "com.teamviewer.teamviewer",
      // generic indicators
      "virtualbox", "vbox"
    )
    try {
      val installed = pm.getInstalledApplications(PackageManager.GET_META_DATA)
      for (app in installed) {
        val pkg = app.packageName.lowercase(Locale.ROOT)
        val label = try { (pm.getApplicationLabel(app) ?: "").toString().lowercase(Locale.ROOT) } catch (_: Exception) { "" }
        for (token in emulatorTokens) {
          val t = token.lowercase(Locale.ROOT)
          if (pkg.contains(t) || label.contains(t)) {
            return "Emulator app detected: ${app.packageName} ($label)"
          }
        }
      }
    } catch (_: Exception) { }
    return null
  }

  private fun checkTelephonyProperties(context: Context): String? {
    try {
      val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
      val opName = tm.networkOperatorName?.lowercase(Locale.ROOT) ?: ""
      val phoneType = tm.phoneType

      if (opName == "android" || opName.isEmpty() || opName == "unknown") {
        return "Telephony operator suspicious: '$opName' (likely emulator)"
      }
      if (phoneType == android.telephony.TelephonyManager.PHONE_TYPE_NONE) {
        return "No telephony detected (PHONE_TYPE_NONE) — possible emulator"
      }
    } catch (_: Exception) { }
    return null
  }

  private fun checkSensorCount(context: Context): String? {
    try {
      val sm = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      val sensors: List<Sensor> = sm.getSensorList(Sensor.TYPE_ALL)
      if (sensors.size <= 3) {
        return "Very few sensors detected (${sensors.size}) — possible emulator"
      }
    } catch (_: Exception) { }
    return null
  }

  private fun checkQemuProperty(): String? {
    val product = Build.PRODUCT?.lowercase(Locale.ROOT) ?: ""
    val tags = Build.TAGS?.lowercase(Locale.ROOT) ?: ""
    if (product.contains("sdk") || product.contains("emulator") || tags.contains("test-keys")) {
      return "ro.kernel.qemu/product tags indicate emulator"
    }
    return null
  }
}
