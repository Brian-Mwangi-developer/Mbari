package com.mbari.app

import android.Manifest
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.io.File

/**
 * Voice messages for "Send to community": MediaRecorder captures AAC (.m4a,
 * mono, 44.1 kHz) into the cache directory, and its peak amplitude drives the
 * recording screen's visual. MediaPlayer plays the take back before it is sent.
 */
class VoiceRecorderModule(reactContext: ReactApplicationContext) :
  NativeVoiceRecorderSpec(reactContext) {

  private var recorder: MediaRecorder? = null
  private var file: File? = null
  private var startedAt = 0L

  private var player: MediaPlayer? = null
  private var playback: Promise? = null

  override fun getName() = NAME

  override fun start(promise: Promise) {
    val context = reactApplicationContext
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("permission", "Microphone permission has not been granted.")
      return
    }
    if (recorder != null) {
      promise.reject("busy", "Already recording.")
      return
    }
    finishPlayback()

    val out = File(context.cacheDir, "voice-${System.currentTimeMillis()}.m4a")
    @Suppress("DEPRECATION")
    val next = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context) else MediaRecorder()
    try {
      next.setAudioSource(MediaRecorder.AudioSource.MIC)
      next.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
      next.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      next.setAudioChannels(1)
      next.setAudioSamplingRate(44_100)
      next.setAudioEncodingBitRate(96_000)
      next.setOutputFile(out.absolutePath)
      next.prepare()
      next.start()
    } catch (e: Exception) {
      next.release()
      out.delete()
      promise.reject("failed", e.message ?: "Could not start the microphone.", e)
      return
    }
    recorder = next
    file = out
    startedAt = SystemClock.elapsedRealtime()
    promise.resolve(null)
  }

  override fun stop(promise: Promise) {
    val current = recorder
    val out = file
    if (current == null || out == null) {
      promise.reject("idle", "Not recording.")
      return
    }
    val durationMs = SystemClock.elapsedRealtime() - startedAt
    recorder = null
    file = null
    try {
      current.stop()
    } catch (e: RuntimeException) {
      // MediaRecorder throws when stopped before it captured any audio.
      current.release()
      out.delete()
      promise.reject("too_short", "The recording was too short.", e)
      return
    }
    current.release()
    val result = Arguments.createMap()
    result.putString("uri", Uri.fromFile(out).toString())
    result.putDouble("durationMs", durationMs.toDouble())
    promise.resolve(result)
  }

  override fun cancel() {
    recorder?.let {
      try {
        it.stop()
      } catch (_: RuntimeException) {
        // Nothing captured yet; the file is deleted below either way.
      }
      it.release()
    }
    recorder = null
    file?.delete()
    file = null
  }

  override fun level(): Double {
    val current = recorder ?: return 0.0
    return try {
      (current.maxAmplitude / 32_767.0).coerceIn(0.0, 1.0)
    } catch (_: IllegalStateException) {
      0.0
    }
  }

  override fun play(uri: String, promise: Promise) {
    finishPlayback()
    val next = MediaPlayer()
    try {
      next.setDataSource(reactApplicationContext, Uri.parse(uri))
      next.setOnCompletionListener { finishPlayback() }
      next.prepare()
      next.start()
    } catch (e: Exception) {
      next.release()
      promise.reject("failed", e.message ?: "Could not play the recording.", e)
      return
    }
    player = next
    playback = promise
  }

  override fun stopPlayback() {
    finishPlayback()
  }

  override fun position(): Double = try {
    player?.currentPosition?.toDouble() ?: 0.0
  } catch (_: IllegalStateException) {
    0.0
  }

  /** Releases the player and settles the promise of the play() that started it. */
  private fun finishPlayback() {
    player?.let {
      try {
        it.stop()
      } catch (_: IllegalStateException) {
        // Already stopped.
      }
      it.release()
    }
    player = null
    playback?.resolve(null)
    playback = null
  }

  override fun invalidate() {
    cancel()
    finishPlayback()
    super.invalidate()
  }

  companion object {
    const val NAME = "NativeVoiceRecorder"
  }
}
