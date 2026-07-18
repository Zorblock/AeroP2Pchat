package de.zorblock.aerop2pchat;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AeroBackgroundMode")
public class AeroBackgroundModePlugin extends Plugin {
    private Intent createServiceIntent(PluginCall call) {
        return new Intent(getContext(), AeroConnectionService.class)
            .putExtra(AeroConnectionService.EXTRA_TITLE, call.getString("title", "Aero P2P Chat"))
            .putExtra(AeroConnectionService.EXTRA_TEXT, call.getString("text", "Connected"))
            .putExtra(AeroConnectionService.EXTRA_ICON, call.getString("icon", "ic_stat_aero"))
            .putExtra(AeroConnectionService.EXTRA_ALLOW_CLOSE, call.getBoolean("allowClose", true))
            .putExtra(AeroConnectionService.EXTRA_CLOSE_TITLE, call.getString("closeTitle", "Stop"));
    }

    private void startOrUpdateService(PluginCall call) {
        Context context = getContext();
        Intent intent = createServiceIntent(call);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @PluginMethod
    public void enable(PluginCall call) {
        startOrUpdateService(call);
    }

    @PluginMethod
    public void updateNotification(PluginCall call) {
        startOrUpdateService(call);
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getContext().stopService(
            new Intent(getContext(), AeroConnectionService.class)
        );
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }
}
