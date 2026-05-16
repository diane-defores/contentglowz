package com.contentglowz.contentglowz_app.capture

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.File

class ScreenRecordService : Service() {
    interface Listener {
        fun onRecordingEvent(event: Map<String, Any?>)
    }

    private val handler = Handler(Looper.getMainLooper())
    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null
    private var startedAt = 0L
    private var width = 0
    private var height = 0
    private var microphoneEnabled = false
    private var stopping = false

    private val progressRunnable = object : Runnable {
        override fun run() {
            val duration = System.currentTimeMillis() - startedAt
            emit(mapOf("type" to "progress", "durationMs" to duration, "maxDurationMs" to MAX_DURATION_MS))
            if (duration >= MAX_DURATION_MS) {
                stopCapture(completed = true, reason = "duration_cap")
            } else {
                handler.postDelayed(this, 1_000)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopCapture(completed = true, reason = "user_stop")
            return START_NOT_STICKY
        }

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        @Suppress("DEPRECATION")
        val data = intent?.getParcelableExtra<Intent>(EXTRA_DATA)
        microphoneEnabled = intent?.getBooleanExtra(EXTRA_MICROPHONE, false) == true && hasRecordAudioPermission()
        activeService = this
        try {
            startCaptureForeground(microphoneEnabled)
        } catch (error: Exception) {
            failStartup(error.message ?: "Screen recording foreground service could not start.")
            return START_NOT_STICKY
        }

        if (resultCode == 0 || data == null) {
            failStartup("Missing Android screen capture consent data.")
            return START_NOT_STICKY
        }

        try {
            startProjection(resultCode, data)
        } catch (error: Exception) {
            failStartup(error.message ?: "Screen recording failed to start.")
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        if (!stopping) {
            stopCapture(completed = true, reason = "service_destroyed")
        }
        if (activeService === this) {
            activeService = null
        }
        super.onDestroy()
    }

    private fun startProjection(resultCode: Int, data: Intent) {
        val metrics = displayMetrics()
        width = even(metrics.widthPixels.coerceAtLeast(1))
        height = even(metrics.heightPixels.coerceAtLeast(1))
        val density = metrics.densityDpi
        outputFile = CaptureAssetMetadata.newRecordingFile(this)

        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val mediaProjection = projectionManager.getMediaProjection(resultCode, data)
            ?: throw IllegalStateException("Android did not return a MediaProjection session.")
        projection = mediaProjection
        mediaProjection.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                stopCapture(completed = true, reason = "projection_stopped")
            }
        }, handler)

        val mediaRecorder = createRecorder(outputFile!!, width, height, microphoneEnabled)
        recorder = mediaRecorder
        virtualDisplay = mediaProjection.createVirtualDisplay(
            "ContentGlowzRecording",
            width,
            height,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaRecorder.surface,
            null,
            handler
        )

        mediaRecorder.start()
        startedAt = System.currentTimeMillis()
        emit(
            mapOf(
                "type" to "recording",
                "durationMs" to 0L,
                "maxDurationMs" to MAX_DURATION_MS,
                "microphoneEnabled" to microphoneEnabled
            )
        )
        handler.postDelayed(progressRunnable, 1_000)
    }

    private fun createRecorder(file: File, videoWidth: Int, videoHeight: Int, includeMicrophone: Boolean): MediaRecorder {
        val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        if (includeMicrophone) {
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
        }
        mediaRecorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)
        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        mediaRecorder.setOutputFile(file.absolutePath)
        mediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264)
        mediaRecorder.setVideoSize(videoWidth, videoHeight)
        mediaRecorder.setVideoFrameRate(30)
        mediaRecorder.setVideoEncodingBitRate((videoWidth * videoHeight * 4).coerceIn(4_000_000, 16_000_000))
        if (includeMicrophone) {
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            mediaRecorder.setAudioEncodingBitRate(128_000)
            mediaRecorder.setAudioSamplingRate(44_100)
        }
        mediaRecorder.prepare()
        return mediaRecorder
    }

    private fun stopCapture(completed: Boolean, reason: String) {
        if (stopping) return
        stopping = true
        handler.removeCallbacks(progressRunnable)
        val duration = if (startedAt > 0) System.currentTimeMillis() - startedAt else 0L
        val file = outputFile
        var finalized = completed

        try {
            recorder?.stop()
        } catch (_: Exception) {
            finalized = false
        }

        releaseResources(deleteOutput = !finalized)

        if (finalized && file != null && file.exists() && file.length() > 0L) {
            emit(
                mapOf(
                    "type" to "completed",
                    "reason" to reason,
                    "asset" to CaptureAssetMetadata.mapForFile(
                        file = file,
                        kind = "recording",
                        mimeType = "video/mp4",
                        createdAt = startedAt,
                        durationMs = duration,
                        width = width,
                        height = height,
                        microphoneEnabled = microphoneEnabled,
                        captureScopeLabel = "system-selected"
                    )
                )
            )
        } else {
            emit(mapOf("type" to "canceled", "reason" to reason, "message" to "Screen recording stopped before a usable file was saved."))
        }

        stopForegroundCompat()
        if (activeService === this) {
            activeService = null
        }
        stopSelf()
    }

    private fun failStartup(message: String) {
        if (stopping) return
        stopping = true
        handler.removeCallbacks(progressRunnable)
        emit(mapOf("type" to "failed", "message" to message))
        releaseResources(deleteOutput = true)
        stopForegroundCompat()
        if (activeService === this) {
            activeService = null
        }
        stopSelf()
    }

    private fun releaseResources(deleteOutput: Boolean) {
        try {
            virtualDisplay?.release()
        } catch (_: Exception) {
        }
        virtualDisplay = null
        try {
            recorder?.reset()
            recorder?.release()
        } catch (_: Exception) {
        }
        recorder = null
        try {
            projection?.stop()
        } catch (_: Exception) {
        }
        projection = null
        if (deleteOutput) {
            try {
                outputFile?.delete()
            } catch (_: Exception) {
            }
        }
    }

    private fun startCaptureForeground(includeMicrophone: Boolean) {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                if (includeMicrophone) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                } else {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                }
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        if (!hasPostNotificationsPermission()) {
            emit(
                mapOf(
                    "type" to "notice",
                    "recoverable" to true,
                    "message" to "Android notification permission is off. Android still shows system screen-recording indicators."
                )
            )
        }
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "ContentGlowz capture", NotificationManager.IMPORTANCE_LOW)
            )
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
            .setSmallIcon(android.R.drawable.presence_video_online)
            .setContentTitle("ContentGlowz screen recording")
            .setContentText("Screen recording is active.")
            .setOngoing(true)
            .build()
    }

    private fun displayMetrics(): DisplayMetrics {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        (getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.getRealMetrics(metrics)
        return metrics
    }

    private fun even(value: Int): Int = if (value % 2 == 0) value else value - 1

    private fun hasRecordAudioPermission(): Boolean {
        return if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            true
        } else {
            checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun hasPostNotificationsPermission(): Boolean {
        return if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            true
        } else {
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun emit(event: Map<String, Any?>) {
        listener?.onRecordingEvent(event)
    }

    private fun currentStatusEvent(): Map<String, Any?>? {
        if (startedAt <= 0L || stopping) return null
        return mapOf(
            "type" to "recording",
            "durationMs" to System.currentTimeMillis() - startedAt,
            "maxDurationMs" to MAX_DURATION_MS,
            "microphoneEnabled" to microphoneEnabled
        )
    }

    private fun stopForegroundCompat() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
        } catch (_: Exception) {
        }
    }

    companion object {
        @Volatile
        var listener: Listener? = null

        @Volatile
        private var activeService: ScreenRecordService? = null

        private const val CHANNEL_ID = "contentglowz_capture"
        private const val NOTIFICATION_ID = 4407
        private const val MAX_DURATION_MS = 300_000L
        private const val ACTION_STOP = "com.contentglowz.contentglowz_app.capture.STOP"
        private const val EXTRA_RESULT_CODE = "resultCode"
        private const val EXTRA_DATA = "data"
        private const val EXTRA_MICROPHONE = "microphone"

        fun start(
            context: Context,
            resultCode: Int,
            data: Intent,
            microphoneEnabled: Boolean,
            eventListener: Listener
        ): Boolean {
            if (activeService != null) return false
            listener = eventListener
            val intent = Intent(context, ScreenRecordService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_DATA, data)
                putExtra(EXTRA_MICROPHONE, microphoneEnabled)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            return true
        }

        fun stopActive(): Boolean {
            val service = activeService ?: return false
            service.stopCapture(completed = true, reason = "user_stop")
            return true
        }

        fun currentStatusEvent(): Map<String, Any?>? {
            return activeService?.currentStatusEvent()
        }
    }
}
