package de.zorblock.aerop2pchat;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "AeroFileSave")
public class AeroFileSavePlugin extends Plugin {
    private static final int MAX_CHUNK_BYTES = 256 * 1024;
    private static final long DISK_RESERVE_BYTES = 64L * 1024L * 1024L;
    private static final Set<String> BLOCKED_EXTENSIONS = new HashSet<>(Arrays.asList(
        "apk", "app", "appimage", "bat", "bin", "cmd", "com", "command", "cpl",
        "deb", "desktop", "dll", "dmg", "exe", "gadget", "hta", "img", "iso",
        "jar", "jse", "js", "lnk", "msi", "msp", "mst", "pkg", "ps1", "psd1",
        "psm1", "reg", "rpm", "scr", "sh", "sys", "url", "vb", "vbe", "vbs",
        "wsf", "wsh"
    ));

    private static final class ReceiveState {
        final File file;
        final String name;
        final String mimeType;
        final long expectedSize;
        final String expectedHash;
        final MessageDigest digest;
        FileOutputStream output;
        long received;
        boolean finalized;

        ReceiveState(File file, String name, String mimeType, long expectedSize, String expectedHash) throws Exception {
            this.file = file;
            this.name = name;
            this.mimeType = mimeType;
            this.expectedSize = expectedSize;
            this.expectedHash = expectedHash;
            this.digest = MessageDigest.getInstance("SHA-256");
            this.output = new FileOutputStream(file, false);
        }
    }

    private final ConcurrentHashMap<String, ReceiveState> receives = new ConcurrentHashMap<>();

    @Override
    public void load() {
        File directory = getReceiveDirectory();
        if (!directory.exists()) directory.mkdirs();
        File[] leftovers = directory.listFiles();
        if (leftovers != null) for (File file : leftovers) file.delete();
    }

    private File getReceiveDirectory() {
        return new File(getContext().getCacheDir(), "aero-received");
    }

    private String safeFileName(String value) {
        String raw = value == null ? "file" : value.replace('\\', '/');
        raw = raw.substring(raw.lastIndexOf('/') + 1)
            .replaceAll("[\\x00-\\x1f\\x7f<>:\"|?*]", "_")
            .replaceAll("[. ]+$", "")
            .trim();
        if (raw.isEmpty() || raw.equals(".") || raw.equals("..")) raw = "file";
        return raw.length() > 180 ? raw.substring(0, 180) : raw;
    }

    private String extensionOf(String name) {
        int index = name.lastIndexOf('.');
        return index > 0 && index < name.length() - 1
            ? name.substring(index + 1).toLowerCase(Locale.ROOT)
            : "";
    }

    private String safeMimeType(String value) {
        if (value == null || !value.matches("^[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+$")) {
            return "application/octet-stream";
        }
        return value.toLowerCase(Locale.ROOT);
    }

    private String hex(byte[] data) {
        StringBuilder result = new StringBuilder(data.length * 2);
        for (byte value : data) result.append(String.format("%02x", value));
        return result.toString();
    }

    private String sha256(byte[] data) throws Exception {
        return hex(MessageDigest.getInstance("SHA-256").digest(data));
    }

    private boolean blockedSignature(byte[] data) {
        if (data.length >= 2 && data[0] == 0x4d && data[1] == 0x5a) return true;
        if (data.length < 4) return false;
        if ((data[0] & 0xff) == 0x7f && data[1] == 0x45 && data[2] == 0x4c && data[3] == 0x46) return true;
        int signature = ((data[0] & 0xff) << 24) | ((data[1] & 0xff) << 16) |
            ((data[2] & 0xff) << 8) | (data[3] & 0xff);
        return signature == 0xfeedface || signature == 0xfeedfacf ||
            signature == 0xcefaedfe || signature == 0xcffaedfe || signature == 0xcafebabe;
    }

    private boolean invalidName(String name) {
        String[] nameParts = name.toLowerCase(Locale.ROOT).split("\\.");
        return name.matches(".*[\\u202a-\\u202e\\u2066-\\u2069].*") ||
            BLOCKED_EXTENSIONS.contains(extensionOf(name)) ||
            (nameParts.length >= 3 && BLOCKED_EXTENSIONS.contains(nameParts[nameParts.length - 2]));
    }

    private byte[] validatedData(PluginCall call, String name) throws Exception {
        byte[] data = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
        String expectedHash = call.getString("sha256", "").toLowerCase(Locale.ROOT);
        if (data.length < 1 || invalidName(name) || blockedSignature(data) ||
            !expectedHash.matches("^[a-f0-9]{64}$") || !sha256(data).equals(expectedHash)) {
            throw new SecurityException("The file failed Aero's security checks.");
        }
        return data;
    }

    private ReceiveState validatedReceive(PluginCall call, String name) throws Exception {
        ReceiveState state = receives.get(call.getString("tempRef", ""));
        String expectedHash = call.getString("sha256", "").toLowerCase(Locale.ROOT);
        if (state == null || !state.finalized || !state.file.isFile() ||
            !state.name.equals(name) || state.expectedSize != state.file.length() ||
            !state.expectedHash.equals(expectedHash) || invalidName(name)) {
            throw new SecurityException("The temporary file failed Aero's security checks.");
        }
        return state;
    }

    private void copyCallData(PluginCall call, String name, OutputStream output) throws Exception {
        if (!call.getString("tempRef", "").isEmpty()) {
            ReceiveState state = validatedReceive(call, name);
            try (FileInputStream input = new FileInputStream(state.file)) {
                byte[] buffer = new byte[128 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            }
        } else {
            output.write(validatedData(call, name));
        }
        output.flush();
    }

    @PluginMethod
    public void beginReceive(PluginCall call) {
        new Thread(() -> {
            try {
                String id = call.getString("id", "");
                String rawName = call.getString("name", "");
                String name = safeFileName(rawName);
                Long sizeValue = call.getLong("size");
                long size = sizeValue == null ? 0 : sizeValue;
                String expectedHash = call.getString("sha256", "").toLowerCase(Locale.ROOT);
                if (!id.matches("^file-[a-f0-9]{24}$") || !rawName.equals(name) || invalidName(name) ||
                    size < 1 || !expectedHash.matches("^[a-f0-9]{64}$")) {
                    throw new SecurityException("Invalid file metadata.");
                }
                File directory = getReceiveDirectory();
                if (!directory.exists() && !directory.mkdirs()) throw new Exception("Android could not create private temporary storage.");
                if (directory.getUsableSpace() < size + DISK_RESERVE_BYTES) {
                    JSObject result = new JSObject();
                    result.put("ok", false);
                    result.put("noSpace", true);
                    result.put("error", "Not enough free storage is available for this file.");
                    call.resolve(result);
                    return;
                }
                String tempRef = java.util.UUID.randomUUID().toString().replace("-", "");
                ReceiveState state = new ReceiveState(
                    new File(directory, tempRef + ".part"), name,
                    safeMimeType(call.getString("mimeType", "application/octet-stream")), size, expectedHash
                );
                receives.put(tempRef, state);
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("tempRef", tempRef);
                call.resolve(result);
            } catch (SecurityException error) {
                JSObject result = new JSObject();
                result.put("ok", false);
                result.put("blocked", true);
                result.put("error", error.getMessage());
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "Temporary storage could not be created." : error.getMessage());
            }
        }, "AeroReceiveStart").start();
    }

    @PluginMethod
    public void appendReceive(PluginCall call) {
        new Thread(() -> {
            try {
                ReceiveState state = receives.get(call.getString("tempRef", ""));
                byte[] data = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
                if (state == null || state.finalized || data.length < 1 || data.length > MAX_CHUNK_BYTES ||
                    state.received + data.length > state.expectedSize) {
                    throw new SecurityException("Invalid temporary file data.");
                }
                state.output.write(data);
                state.digest.update(data);
                state.received += data.length;
                JSObject result = new JSObject();
                result.put("ok", true);
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "Temporary file write failed." : error.getMessage());
            }
        }, "AeroReceiveChunk").start();
    }

    @PluginMethod
    public void finishReceive(PluginCall call) {
        new Thread(() -> {
            String tempRef = call.getString("tempRef", "");
            ReceiveState state = receives.get(tempRef);
            try {
                if (state == null || state.finalized || state.received != state.expectedSize) {
                    throw new SecurityException("The temporary file is incomplete.");
                }
                state.output.getFD().sync();
                state.output.close();
                state.output = null;
                if (!hex(state.digest.digest()).equals(state.expectedHash)) throw new SecurityException("SHA-256 mismatch.");
                byte[] header = new byte[(int)Math.min(64 * 1024, state.expectedSize)];
                try (FileInputStream input = new FileInputStream(state.file)) {
                    int offset = 0;
                    while (offset < header.length) {
                        int read = input.read(header, offset, header.length - offset);
                        if (read < 0) break;
                        offset += read;
                    }
                }
                if (blockedSignature(header)) throw new SecurityException("Executable content was detected.");
                state.finalized = true;
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("size", state.expectedSize);
                result.put("headerBase64", Base64.encodeToString(header, Base64.NO_WRAP));
                call.resolve(result);
            } catch (Exception error) {
                if (state != null) {
                    try { if (state.output != null) state.output.close(); } catch (Exception ignored) {}
                    state.file.delete();
                    receives.remove(tempRef);
                }
                JSObject result = new JSObject();
                result.put("ok", false);
                result.put("blocked", error instanceof SecurityException);
                result.put("error", error.getMessage() == null ? "Temporary file verification failed." : error.getMessage());
                call.resolve(result);
            }
        }, "AeroReceiveFinish").start();
    }

    @PluginMethod
    public void getReceiveUri(PluginCall call) {
        ReceiveState state = receives.get(call.getString("tempRef", ""));
        JSObject result = new JSObject();
        result.put("uri", state != null && state.finalized ? Uri.fromFile(state.file).toString() : "");
        call.resolve(result);
    }

    @PluginMethod
    public void releaseReceive(PluginCall call) {
        ReceiveState state = receives.remove(call.getString("tempRef", ""));
        if (state != null) {
            try { if (state.output != null) state.output.close(); } catch (Exception ignored) {}
            state.file.delete();
        }
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @PluginMethod
    public void cleanupReceives(PluginCall call) {
        for (ReceiveState state : receives.values()) {
            try { if (state.output != null) state.output.close(); } catch (Exception ignored) {}
            state.file.delete();
        }
        receives.clear();
        File[] leftovers = getReceiveDirectory().listFiles();
        if (leftovers != null) for (File file : leftovers) file.delete();
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    private void resolveSaved(PluginCall call, Uri uri) {
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("uri", uri.toString());
        result.put("scanStatus", "platform");
        call.resolve(result);
    }

    private void writeToUri(PluginCall call, Uri uri) {
        new Thread(() -> {
            try {
                String name = safeFileName(call.getString("name", "file"));
                try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "w")) {
                    if (output == null) throw new Exception("The selected destination is unavailable.");
                    copyCallData(call, name, output);
                }
                resolveSaved(call, uri);
            } catch (SecurityException error) {
                JSObject result = new JSObject();
                result.put("ok", false);
                result.put("blocked", true);
                result.put("error", error.getMessage());
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "The file could not be saved." : error.getMessage());
            }
        }, "AeroFileSave").start();
    }

    private void startCreateDocument(PluginCall call) {
        String name = safeFileName(call.getString("name", "file"));
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType(safeMimeType(call.getString("mimeType", "application/octet-stream")))
            .putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, intent, "createdDocument");
    }

    @PluginMethod
    public void chooseDirectory(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            .addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "selectedDirectory");
    }

    @ActivityCallback
    private void selectedDirectory(PluginCall call, ActivityResult activityResult) {
        Intent data = activityResult.getData();
        if (activityResult.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject result = new JSObject();
            result.put("ok", false);
            result.put("canceled", true);
            call.resolve(result);
            return;
        }
        Uri uri = data.getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(
                uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );
            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("uri", uri.toString());
            result.put("label", DocumentsContract.getTreeDocumentId(uri));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("The selected folder permission could not be saved.");
        }
    }

    @ActivityCallback
    private void createdDocument(PluginCall call, ActivityResult activityResult) {
        Intent data = activityResult.getData();
        if (activityResult.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject result = new JSObject();
            result.put("ok", false);
            result.put("canceled", true);
            call.resolve(result);
            return;
        }
        writeToUri(call, data.getData());
    }

    private void saveToDownloads(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            startCreateDocument(call);
            return;
        }
        new Thread(() -> {
            ContentResolver resolver = getContext().getContentResolver();
            Uri uri = null;
            try {
                String name = safeFileName(call.getString("name", "file"));
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, safeMimeType(call.getString("mimeType", "application/octet-stream")));
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new Exception("Android could not create the download.");
                try (OutputStream output = resolver.openOutputStream(uri, "w")) {
                    if (output == null) throw new Exception("Android could not open the download.");
                    copyCallData(call, name, output);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
                resolveSaved(call, uri);
            } catch (SecurityException error) {
                if (uri != null) resolver.delete(uri, null, null);
                JSObject result = new JSObject();
                result.put("ok", false);
                result.put("blocked", true);
                result.put("error", error.getMessage());
                call.resolve(result);
            } catch (Exception error) {
                if (uri != null) resolver.delete(uri, null, null);
                call.reject(error.getMessage() == null ? "The file could not be saved." : error.getMessage());
            }
        }, "AeroDownloadsSave").start();
    }

    private void saveToCustomDirectory(PluginCall call, String directoryUri) {
        try {
            Uri treeUri = Uri.parse(directoryUri);
            String documentId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri parentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, documentId);
            Uri created = DocumentsContract.createDocument(
                getContext().getContentResolver(), parentUri,
                safeMimeType(call.getString("mimeType", "application/octet-stream")),
                safeFileName(call.getString("name", "file"))
            );
            if (created == null) throw new Exception("The selected folder is unavailable.");
            writeToUri(call, created);
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "The selected folder is unavailable." : error.getMessage());
        }
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String mode = call.getString("mode", "ask");
        String directoryUri = call.getString("directory", "");
        if (mode.equals("downloads")) saveToDownloads(call);
        else if (mode.equals("custom") && directoryUri.startsWith("content://")) saveToCustomDirectory(call, directoryUri);
        else startCreateDocument(call);
    }
}
