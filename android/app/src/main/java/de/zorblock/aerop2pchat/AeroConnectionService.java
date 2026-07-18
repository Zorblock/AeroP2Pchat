package de.zorblock.aerop2pchat;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AeroConnectionService extends Service {
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_ICON = "icon";
    public static final String EXTRA_ALLOW_CLOSE = "allowClose";
    public static final String EXTRA_CLOSE_TITLE = "closeTitle";

    private static final String ACTION_STOP =
        "de.zorblock.aerop2pchat.action.STOP_CONNECTION_SERVICE";
    private static final String CHANNEL_ID = "aero_connections";
    private static final int NOTIFICATION_ID = 7401;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        PowerManager powerManager =
            (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "AeroP2PChat:Connections"
            );
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String title = getExtra(intent, EXTRA_TITLE, "Aero P2P Chat");
        String text = getExtra(intent, EXTRA_TEXT, "Connected");
        String iconName = getExtra(intent, EXTRA_ICON, "ic_stat_aero");
        boolean allowClose =
            intent == null || intent.getBooleanExtra(EXTRA_ALLOW_CLOSE, true);
        String closeTitle = getExtra(intent, EXTRA_CLOSE_TITLE, "Stop");
        startForeground(
            NOTIFICATION_ID,
            createNotification(title, text, iconName, allowClose, closeTitle)
        );
        return START_STICKY;
    }

    private String getExtra(Intent intent, String key, String fallback) {
        if (intent == null) {
            return fallback;
        }
        String value = intent.getStringExtra(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Active connections",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Keeps active peer-to-peer connections available.");
        channel.setShowBadge(false);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification(
        String title,
        String text,
        String iconName,
        boolean allowClose,
        String closeTitle
    ) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(
            getPackageName()
        );
        PendingIntent contentIntent = launchIntent == null
            ? null
            : PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        int smallIcon = getResources().getIdentifier(
            iconName,
            "drawable",
            getPackageName()
        );
        if (smallIcon == 0) {
            smallIcon = getApplicationInfo().icon;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
            this,
            CHANNEL_ID
        )
            .setSmallIcon(smallIcon)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE);

        if (allowClose) {
            Intent stopIntent = new Intent(this, AeroConnectionService.class)
                .setAction(ACTION_STOP);
            PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                1,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(0, closeTitle, stopPendingIntent);
        }
        return builder.build();
    }

    @Override
    public void onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE);
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        wakeLock = null;
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
