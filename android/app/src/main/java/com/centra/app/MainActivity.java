package com.centra.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.JavascriptInterface;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CentraMainActivity";
    public static final String CHANNEL_ID = "centra_alerts";
    private static final int NOTIFICATION_PERMISSION_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createNotificationChannel();
        requestNotificationPermission();

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new CentraNativeBridge(this), "CentraAndroid");
            Log.d(TAG, "CentraAndroid native bridge registered successfully");
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Centra Alerts";
            String description = "Financial notifications, budget alerts, and download status";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_CODE
                );
            }
        }
    }

    public static class CentraNativeBridge {
        private final Context context;

        public CentraNativeBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void showNotification(String title, String body, int id) {
            try {
                Intent intent = new Intent(context, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(context, id, intent, flags);

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(pendingIntent);

                NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
                if (Build.VERSION.SDK_INT >= 33) {
                    if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                            == PackageManager.PERMISSION_GRANTED) {
                        notificationManager.notify(id, builder.build());
                    } else {
                        Log.w(TAG, "Cannot post notification: POST_NOTIFICATIONS permission not granted");
                    }
                } else {
                    notificationManager.notify(id, builder.build());
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to display native status-bar notification", e);
            }
        }

        @JavascriptInterface
        public boolean saveFileToDownloads(String filename, String mimeType, String content) {
            try {
                boolean success = false;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, (mimeType != null && !mimeType.isEmpty()) ? mimeType : "text/csv");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                    Uri uri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (OutputStream os = context.getContentResolver().openOutputStream(uri)) {
                            if (os != null) {
                                os.write(content.getBytes(StandardCharsets.UTF_8));
                                os.flush();
                                success = true;
                            }
                        }
                    }
                } else {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!downloadsDir.exists()) {
                        downloadsDir.mkdirs();
                    }
                    File file = new File(downloadsDir, filename);
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        fos.write(content.getBytes(StandardCharsets.UTF_8));
                        fos.flush();
                        success = true;
                    }
                }

                if (success) {
                    int notifId = (int) (System.currentTimeMillis() & 0xfffffff);
                    showNotification("Download Complete", "Saved " + filename + " to Downloads", notifId);
                    return true;
                }
                return false;
            } catch (Exception e) {
                Log.e(TAG, "Error saving file to Downloads folder", e);
                return false;
            }
        }
    }
}
