package tech.numberless.port
import android.content.Context
import tech.numberless.port.specs.NativeMediaUploadModuleSpec
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import tech.numberless.port.fileuploaders.IUploader
import tech.numberless.port.fileuploaders.MultipartUploader
import tech.numberless.port.fileuploaders.SingleShotUploader
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.ceil

/**
 * React module for uploading files in chunks
 */
class PortMediaUploader(reactContext: ReactApplicationContext) : NativeMediaUploadModuleSpec(reactContext) {
    /**
     * Companion object for the module.
     * @property NAME The name of the module.
     */
    companion object {
        const val NAME = "NativeMediaUploadModule"
    }

    /**
     * Returns the name of the module.
     * @return The name of the module.
     */
    override fun getName(): String = NAME

    /**
     * API endpoints for file upload
     * @property presignedFetchResource The endpoint for fetching a presigned URL.
     * @property multipartBeginResource The endpoint for starting a multipart upload.
     * @property multipartCompleteResource The endpoint for completing a multipart upload.
     * @property multipartAbortResource The endpoint for aborting a multipart upload.
     */
    private var presignUrl: String? = null
    private var multipartBeginUrl: String? = null
    private var multipartCompleteUrl: String? = null
    private var multipartAbortUrl: String? = null

    /**
     * Concurrency related fields
     * @property uploadJobs ConcurrentHashMap for storing upload jobs.
     * @property uploadPromises ConcurrentHashMap for storing upload promises.
     * @property coroutineScope CoroutineScope for IO dispatcher.
     */
    private val uploadJobs = ConcurrentHashMap<String, Job>()
    private val uploadPromises = ConcurrentHashMap<String, Promise>()
    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    /**
     * Helper function to determine which type of upload to perform
     *
     * @param numChunks Number of chunks
     * @param partSize Size of each chunk
     * @return The uploader selected
     */
    fun selectUploader(
        path: String,
        partSize: Double,
    ): IUploader {
        mapOf(
            "presignUrl" to presignUrl,
            "multipartBeginUrl" to multipartBeginUrl,
            "multipartCompleteUrl" to multipartCompleteUrl,
            "multipartAbortUrl" to multipartAbortUrl,
        ).forEach { (name, url) ->
            if (url.isNullOrBlank()) {
                throw IllegalStateException("$name not initialized. Call initialize() first.")
            }
        } // If this check passes, values are safe to unwrap with !! later
        val numChunks =
            File(path)
                .takeIf { it.exists() }
                ?.let { ceil(it.length() / partSize).toInt() }
                ?: throw IllegalArgumentException("File not found or inaccessible: $path")
        if (numChunks <= 0) throw IllegalArgumentException("Invalid chunk count ($numChunks) for file: $path")

        if (numChunks == 1) {
            return SingleShotUploader(presignUrl!!)
        } else {
            return MultipartUploader(
                numChunks,
                partSize,
                multipartBeginUrl!!,
                multipartCompleteUrl!!,
                multipartAbortUrl!!,
            )
        }
    }

    /**
     * JavaScript must call this once before uploadFile to configure endpoints.
     * @param presign The endpoint for fetching a presigned URL.
     * @param begin The endpoint for starting a multipart upload.
     * @param complete The endpoint for completing a multipart upload.
     * @param abort The endpoint for aborting a multipart upload.
     */
    override fun initialize(
        presign: String,
        begin: String,
        complete: String,
        abort: String,
    ) {
        presignUrl = presign
        multipartBeginUrl = begin
        multipartCompleteUrl = complete
        multipartAbortUrl = abort
        Log.i(NAME, "Initialized URLs for file uploading.")
    }

    /**
     * Program entrypoint. Starts the upload process, dynamically choosing between single-shot and multipart upload.
     *
     * @param path The path of the file to be uploaded.
     * @param token The authentication token.
     * @param partSize The size of each chunk.
     * @param promise The promise to resolve or reject.
     * @return Technically, nothing. But if the upload is successful, the promise will resolve with a mediaId.
     */
    override fun uploadFile(
        path: String,
        token: String,
        partSize: Double,
        promise: Promise,
    ) {
        val uploadJob =
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    uploadPromises[path] = promise // Store the promise
                    var uploader: IUploader = selectUploader(path, partSize)
                    val mediaId = uploader.upload(token, path)
                    Log.i("PortMediaUploader", "${uploader.type} upload completed")
                    promise.resolve(mediaId)
                } catch (e: Exception) {
                    Log.e("PortMediaUploader", "Error in uploadFile", e)
                    promise.reject("UPLOAD_ERROR", e.message ?: "Unknown error")
                } finally {
                    uploadJobs.remove(path)
                    uploadPromises.remove(path) // Clean up after completion
                }
            }
        uploadJobs[path] = uploadJob
    }

    /**
     * Cancels an upload.
     * @param path The path of the file to be uploaded.
     * @return True if the upload was canceled, false otherwise.
     */
    override fun cancelUpload(path: String, promise: Promise) {
        val job = uploadJobs.remove(path) // Remove the job reference

        if (job == null) {
            Log.w("PortMediaUploader", "Cancel request ignored: No active upload for $path")
            promise.resolve(false)
        }

        job?.cancel() // Cancel the upload if it's still running
        promise.resolve(true)

        Log.i("PortMediaUploader", "Upload for $path successfully canceled.")
    }
}
