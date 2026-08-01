using System.Diagnostics;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

internal static class Program
{
    private const string WindowClassName = "AeroOnlineInstallerWindow";
    private const string Repo = "Zorblock/AeroP2Pchat";
    private const string InstallerAsset = "Aero-P2P-Chat-Windows-x64-Setup.exe";
    private const uint WmDestroy = 0x0002;
    private const uint WmPaint = 0x000F;
    private const uint WmTimer = 0x0113;
    private const uint WmLButtonUp = 0x0202;
    private const int RetryLeft = 438;
    private const int RetryTop = 330;
    private const int RetryRight = 538;
    private const int RetryBottom = 366;
    private static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromMinutes(10) };
    private static readonly object StateLock = new();
    private static readonly WndProc WindowProcedure = WindowProc;
    private static string status = "Checking the newest release…";
    private static string detail = "Connecting securely to GitHub…";
    private static string version = "Latest version: checking";
    private static double progress;
    private static bool indeterminate = true;
    private static bool failed;
    private static bool installing;
    private static IntPtr window;

    [STAThread]
    private static void Main()
    {
        var instance = GetModuleHandle(null);
        var windowClass = new WndClassEx
        {
            cbSize = (uint)Marshal.SizeOf<WndClassEx>(),
            lpfnWndProc = Marshal.GetFunctionPointerForDelegate(WindowProcedure),
            hInstance = instance,
            hCursor = LoadCursor(IntPtr.Zero, (IntPtr)32512),
            hbrBackground = IntPtr.Zero,
            lpszClassName = WindowClassName,
        };

        RegisterClassEx(ref windowClass);
        window = CreateWindowEx(
            0,
            WindowClassName,
            "Aero P2P Chat Online Installer",
            (uint)(0x00CF0000 & ~0x00010000),
            int.MinValue,
            int.MinValue,
            620,
            430,
            IntPtr.Zero,
            IntPtr.Zero,
            instance,
            IntPtr.Zero);

        SetDarkTitleBar(window);
        ShowWindow(window, 5);
        UpdateWindow(window);
        SetTimer(window, (UIntPtr)1, 80, IntPtr.Zero);
        StartInstallation();

        while (GetMessage(out var message, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref message);
            DispatchMessage(ref message);
        }
    }

    private static void StartInstallation()
    {
        lock (StateLock)
        {
            if (installing) return;
            installing = true;
            failed = false;
            status = "Checking the newest release…";
            detail = "Connecting securely to GitHub…";
            version = "Latest version: checking";
            progress = 0;
            indeterminate = true;
        }
        _ = Task.Run(InstallLatestAsync);
    }

    private static async Task InstallLatestAsync()
    {
        try
        {
            var manifestUrl = $"https://github.com/{Repo}/releases/latest/download/latest.yml";
            var manifest = await HttpClient.GetStringAsync(manifestUrl);
            var latestVersion = ReadManifestValue(manifest, "version");
            var downloadUrl = ReadManifestValue(manifest, "windowsUrl");
            var expectedHash = ReadManifestValue(manifest, "windowsSha256");
            downloadUrl = string.IsNullOrWhiteSpace(downloadUrl) ? ReadManifestValue(manifest, "url") : downloadUrl;
            expectedHash = string.IsNullOrWhiteSpace(expectedHash) ? ReadManifestValue(manifest, "sha256") : expectedHash;

            if (string.IsNullOrWhiteSpace(latestVersion) || string.IsNullOrWhiteSpace(downloadUrl) || string.IsNullOrWhiteSpace(expectedHash))
                throw new InvalidOperationException("The latest release metadata is incomplete.");
            if (!Uri.TryCreate(downloadUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
                !string.Equals(uri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("The release did not provide a trusted GitHub download URL.");

            SetState($"Downloading Aero P2P Chat {latestVersion}…", "Preparing the secure download…", $"Latest version: {latestVersion}", 0, false);
            var targetPath = Path.Combine(Path.GetTempPath(), $"{InstallerAsset}-{Guid.NewGuid():N}.exe");
            await DownloadAsync(uri, targetPath);

            SetState("Verifying the download…", "Checking the published SHA-256 checksum…", null, 100, false);
            await using var installerStream = File.OpenRead(targetPath);
            var actualHash = Convert.ToHexString(await SHA256.HashDataAsync(installerStream));
            if (!string.Equals(actualHash, expectedHash, StringComparison.OrdinalIgnoreCase))
            {
                File.Delete(targetPath);
                throw new InvalidOperationException("The downloaded installer did not match the published checksum.");
            }

            SetState("Starting the verified setup…", "The standard Aero installer will open now.", null, 100, false);
            var process = Process.Start(new ProcessStartInfo(targetPath) { UseShellExecute = true })
                ?? throw new InvalidOperationException("The downloaded installer could not be started.");
            await process.WaitForExitAsync();
            if (process.ExitCode is not 0 and not 3010)
                throw new InvalidOperationException($"The setup ended with exit code {process.ExitCode}.");

            SetState("Installation complete.", "Aero P2P Chat is ready to use.", null, 100, false);
        }
        catch (Exception exception)
        {
            SetState("The latest version could not be installed.", exception.Message, null, 0, false, true);
        }
        finally
        {
            lock (StateLock) installing = false;
        }
    }

    private static async Task DownloadAsync(Uri uri, string targetPath)
    {
        using var response = await HttpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();
        var totalBytes = response.Content.Headers.ContentLength;
        await using var source = await response.Content.ReadAsStreamAsync();
        await using var target = File.Create(targetPath);
        var buffer = new byte[128 * 1024];
        long downloaded = 0;
        int read;

        while ((read = await source.ReadAsync(buffer)) > 0)
        {
            await target.WriteAsync(buffer.AsMemory(0, read));
            downloaded += read;
            if (totalBytes is > 0)
                SetState(null, $"{FormatBytes(downloaded)} of {FormatBytes(totalBytes.Value)} downloaded", null, downloaded * 100d / totalBytes.Value, false);
            else
                SetState(null, $"{FormatBytes(downloaded)} downloaded", null, 0, true);
        }
    }

    private static void SetState(string? nextStatus, string? nextDetail, string? nextVersion, double nextProgress, bool nextIndeterminate, bool nextFailed = false)
    {
        lock (StateLock)
        {
            if (nextStatus is not null) status = nextStatus;
            if (nextDetail is not null) detail = nextDetail;
            if (nextVersion is not null) version = nextVersion;
            progress = nextProgress;
            indeterminate = nextIndeterminate;
            failed = nextFailed;
        }
        if (window != IntPtr.Zero) InvalidateRect(window, IntPtr.Zero, false);
    }

    private static string ReadManifestValue(string manifest, string key)
    {
        var prefix = key + ":";
        foreach (var line in manifest.Split('\n'))
        {
            if (line.StartsWith(prefix, StringComparison.Ordinal)) return line[prefix.Length..].Trim().Trim('"');
        }
        return string.Empty;
    }

    private static string FormatBytes(long bytes) => bytes >= 1024 * 1024 ? $"{bytes / 1024d / 1024d:0.0} MB" : $"{bytes / 1024d:0} KB";

    private static IntPtr WindowProc(IntPtr hwnd, uint message, UIntPtr wParam, IntPtr lParam)
    {
        switch (message)
        {
            case WmPaint:
                Paint(hwnd);
                return IntPtr.Zero;
            case WmTimer:
                InvalidateRect(hwnd, IntPtr.Zero, false);
                return IntPtr.Zero;
            case WmLButtonUp:
                var x = unchecked((short)lParam.ToInt64());
                var y = unchecked((short)(lParam.ToInt64() >> 16));
                if (failed && x >= RetryLeft && x <= RetryRight && y >= RetryTop && y <= RetryBottom) StartInstallation();
                return IntPtr.Zero;
            case WmDestroy:
                PostQuitMessage(0);
                return IntPtr.Zero;
        }
        return DefWindowProc(hwnd, message, wParam, lParam);
    }

    private static unsafe void Paint(IntPtr hwnd)
    {
        var paint = new PaintStruct();
        var hdc = BeginPaint(hwnd, ref paint);
        GetClientRect(hwnd, out var client);
        Fill(hdc, client, Rgb(9, 13, 20));
        FillRounded(hdc, new Rect(24, 24, client.Right - 24, client.Bottom - 24), Rgb(18, 26, 39), 22);
        DrawCircle(hdc, 56, 58, 24, Rgb(19, 126, 165));
        DrawText(hdc, "A", new Rect(48, 42, 64, 68), 21, 700, Rgb(255, 255, 255), 0);
        DrawText(hdc, "Aero P2P Chat", new Rect(92, 41, 340, 67), 20, 700, Rgb(245, 248, 252), 0);
        DrawText(hdc, "ONLINE INSTALLER", new Rect(94, 68, 340, 86), 10, 600, Rgb(139, 164, 191), 0);

        string currentStatus, currentDetail, currentVersion;
        double currentProgress;
        bool currentIndeterminate, currentFailed;
        lock (StateLock)
        {
            currentStatus = status;
            currentDetail = detail;
            currentVersion = version;
            currentProgress = progress;
            currentIndeterminate = indeterminate;
            currentFailed = failed;
        }

        DrawText(hdc, currentStatus, new Rect(56, 124, client.Right - 56, 157), 21, 650, Rgb(245, 248, 252), 0);
        DrawText(hdc, currentDetail, new Rect(56, 164, client.Right - 56, 204), 13, 400, currentFailed ? Rgb(242, 143, 143) : Rgb(169, 184, 201), 0x00000010);
        DrawProgress(hdc, new Rect(56, 232, client.Right - 56, 240), currentProgress, currentIndeterminate);
        DrawText(hdc, currentVersion, new Rect(56, 251, 330, 272), 11, 400, Rgb(126, 149, 174), 0);
        DrawText(hdc, "SHA-256 verified download", new Rect(360, 251, client.Right - 56, 272), 11, 400, Rgb(95, 195, 232), 0x00000002);
        DrawText(hdc, "Your setup is downloaded directly from the latest GitHub release and verified before it starts.", new Rect(56, 289, client.Right - 56, 316), 11, 400, Rgb(190, 208, 227), 0x00000010);

        if (currentFailed)
        {
            FillRounded(hdc, new Rect(RetryLeft, RetryTop, RetryRight, RetryBottom), Rgb(25, 126, 165), 8);
            DrawText(hdc, "Try again", new Rect(RetryLeft, RetryTop + 7, RetryRight, RetryBottom), 12, 600, Rgb(255, 255, 255), 0x00000001);
        }
        EndPaint(hwnd, ref paint);
    }

    private static void DrawProgress(IntPtr hdc, Rect rect, double value, bool isIndeterminate)
    {
        FillRounded(hdc, rect, Rgb(36, 54, 78), 4);
        var width = isIndeterminate ? Math.Max(58, (rect.Right - rect.Left) / 4) : Math.Max(0, (int)((rect.Right - rect.Left) * Math.Clamp(value, 0, 100) / 100));
        FillRounded(hdc, new Rect(rect.Left, rect.Top, rect.Left + width, rect.Bottom), Rgb(34, 166, 216), 4);
    }

    private static void Fill(IntPtr hdc, Rect rect, uint color)
    {
        var brush = CreateSolidBrush(color);
        FillRect(hdc, ref rect, brush);
        DeleteObject(brush);
    }

    private static void FillRounded(IntPtr hdc, Rect rect, uint color, int radius)
    {
        var brush = CreateSolidBrush(color);
        var previous = SelectObject(hdc, brush);
        RoundRect(hdc, rect.Left, rect.Top, rect.Right, rect.Bottom, radius, radius);
        SelectObject(hdc, previous);
        DeleteObject(brush);
    }

    private static void DrawCircle(IntPtr hdc, int x, int y, int radius, uint color)
    {
        var brush = CreateSolidBrush(color);
        var previous = SelectObject(hdc, brush);
        Ellipse(hdc, x - radius, y - radius, x + radius, y + radius);
        SelectObject(hdc, previous);
        DeleteObject(brush);
    }

    private static void DrawText(IntPtr hdc, string text, Rect rect, int size, int weight, uint color, uint flags)
    {
        var font = CreateFont(-size, 0, 0, 0, weight, 0, 0, 0, 1, 0, 0, 0, 0, "Segoe UI");
        var previous = SelectObject(hdc, font);
        SetTextColor(hdc, color);
        SetBkMode(hdc, 1);
        DrawTextW(hdc, text, text.Length, ref rect, flags | 0x00000004);
        SelectObject(hdc, previous);
        DeleteObject(font);
    }

    private static uint Rgb(byte red, byte green, byte blue) => (uint)(red | (green << 8) | (blue << 16));

    private static void SetDarkTitleBar(IntPtr hwnd)
    {
        var enabled = 1;
        DwmSetWindowAttribute(hwnd, 20, ref enabled, sizeof(int));
    }

    [UnmanagedFunctionPointer(CallingConvention.Winapi)]
    private delegate IntPtr WndProc(IntPtr hwnd, uint message, UIntPtr wParam, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WndClassEx
    {
        public uint cbSize, style;
        public IntPtr lpfnWndProc;
        public int cbClsExtra, cbWndExtra;
        public IntPtr hInstance, hIcon, hCursor, hbrBackground, hIconSm;
        public string lpszMenuName, lpszClassName;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Point { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)]
    private struct Rect { public int Left, Top, Right, Bottom; public Rect(int left, int top, int right, int bottom) => (Left, Top, Right, Bottom) = (left, top, right, bottom); }
    [StructLayout(LayoutKind.Sequential)]
    private struct Message { public IntPtr Hwnd; public uint MessageId; public UIntPtr WParam; public IntPtr LParam; public uint Time; public Point Point; }
    [StructLayout(LayoutKind.Sequential)]
    private unsafe struct PaintStruct { public IntPtr Hdc; public int Erase; public Rect PaintRect; public int Restore, IncUpdate; public fixed byte Reserved[32]; }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr GetModuleHandle(string? name);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern ushort RegisterClassEx(ref WndClassEx windowClass);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr CreateWindowEx(uint exStyle, string className, string windowName, uint style, int x, int y, int width, int height, IntPtr parent, IntPtr menu, IntPtr instance, IntPtr param);
    [DllImport("user32.dll")] private static extern IntPtr DefWindowProc(IntPtr hwnd, uint message, UIntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr hwnd, int command);
    [DllImport("user32.dll")] private static extern bool UpdateWindow(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern int GetMessage(out Message message, IntPtr hwnd, uint min, uint max);
    [DllImport("user32.dll")] private static extern bool TranslateMessage(ref Message message);
    [DllImport("user32.dll")] private static extern IntPtr DispatchMessage(ref Message message);
    [DllImport("user32.dll")] private static extern void PostQuitMessage(int exitCode);
    [DllImport("user32.dll")] private static extern IntPtr LoadCursor(IntPtr instance, IntPtr cursor);
    [DllImport("user32.dll")] private static extern UIntPtr SetTimer(IntPtr hwnd, UIntPtr id, uint milliseconds, IntPtr callback);
    [DllImport("user32.dll")] private static extern bool InvalidateRect(IntPtr hwnd, IntPtr rect, bool erase);
    [DllImport("user32.dll")] private static extern IntPtr BeginPaint(IntPtr hwnd, ref PaintStruct paint);
    [DllImport("user32.dll")] private static extern bool EndPaint(IntPtr hwnd, ref PaintStruct paint);
    [DllImport("user32.dll")] private static extern bool GetClientRect(IntPtr hwnd, out Rect rect);
    [DllImport("user32.dll")] private static extern int FillRect(IntPtr hdc, ref Rect rect, IntPtr brush);
    [DllImport("gdi32.dll")] private static extern IntPtr CreateSolidBrush(uint color);
    [DllImport("gdi32.dll")] private static extern bool DeleteObject(IntPtr objectHandle);
    [DllImport("gdi32.dll")] private static extern IntPtr SelectObject(IntPtr hdc, IntPtr objectHandle);
    [DllImport("gdi32.dll")] private static extern bool RoundRect(IntPtr hdc, int left, int top, int right, int bottom, int width, int height);
    [DllImport("gdi32.dll")] private static extern bool Ellipse(IntPtr hdc, int left, int top, int right, int bottom);
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr CreateFont(int height, int width, int escapement, int orientation, int weight, uint italic, uint underline, uint strikeout, uint charset, uint outputPrecision, uint clipPrecision, uint quality, uint pitchAndFamily, string face);
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)] private static extern int DrawTextW(IntPtr hdc, string text, int count, ref Rect rect, uint format);
    [DllImport("gdi32.dll")] private static extern uint SetTextColor(IntPtr hdc, uint color);
    [DllImport("gdi32.dll")] private static extern int SetBkMode(IntPtr hdc, int mode);
    [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);
}
