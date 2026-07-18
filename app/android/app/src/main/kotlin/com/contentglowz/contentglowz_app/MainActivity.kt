package com.contentglowz.app

import android.content.Intent
import android.os.Bundle
import com.contentglowz.app.auth.ClerkAuthChannel
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import com.contentglowz.app.capture.ScreenCaptureChannel
import com.contentglowz.app.media.AndroidMediaLibraryChannel

class MainActivity : FlutterActivity() {
    private var screenCaptureChannel: ScreenCaptureChannel? = null
    private var androidMediaLibraryChannel: AndroidMediaLibraryChannel? = null
    private var clerkAuthChannel: ClerkAuthChannel? = null
    private var pendingAuthCallback: android.net.Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingAuthCallback = intent?.data
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        screenCaptureChannel = ScreenCaptureChannel(this, flutterEngine.dartExecutor.binaryMessenger)
        androidMediaLibraryChannel = AndroidMediaLibraryChannel(this, flutterEngine.dartExecutor.binaryMessenger)
        clerkAuthChannel = ClerkAuthChannel(flutterEngine.dartExecutor.binaryMessenger)
        clerkAuthChannel?.handleCallback(pendingAuthCallback)
        pendingAuthCallback = null
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (clerkAuthChannel == null) {
            pendingAuthCallback = intent.data
        } else {
            clerkAuthChannel?.handleCallback(intent.data)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        if (screenCaptureChannel?.handleActivityResult(requestCode, resultCode, data) == true) {
            return
        }
        if (androidMediaLibraryChannel?.handleActivityResult(requestCode, resultCode, data) == true) {
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        if (screenCaptureChannel?.handleRequestPermissionsResult(requestCode, permissions, grantResults) == true) {
            return
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }

    override fun onDestroy() {
        screenCaptureChannel?.dispose()
        screenCaptureChannel = null
        androidMediaLibraryChannel?.dispose()
        androidMediaLibraryChannel = null
        clerkAuthChannel?.dispose()
        clerkAuthChannel = null
        super.onDestroy()
    }
}
