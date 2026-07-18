package com.contentglowz.app

import android.app.Application
import com.clerk.api.Clerk

/** Owns Clerk initialization for the Android process. Never log the publishable key. */
class ContentGlowzApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val key = BuildConfig.CLERK_PUBLISHABLE_KEY.trim()
        if (key.isNotEmpty()) {
            Clerk.initialize(this, publishableKey = key)
        }
    }
}
