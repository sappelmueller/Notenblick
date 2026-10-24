using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("Notenblick")]
[assembly: AssemblyProduct("Notenblick")]
[assembly: AssemblyVersion("1.8.0.0")]
[assembly: AssemblyFileVersion("1.8.0.0")]
[assembly: AssemblyInformationalVersion("1.8.0")]

public static class Launcher
{
    [DllImport("kernel32", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetDllDirectory(string path);

    [STAThread]
    public static void Main()
    {
        try
        {
            var root = AppDomain.CurrentDomain.BaseDirectory;
            var libraries = new Notenblick.Native.ProgramLibraries(root);
            AppDomain.CurrentDomain.AssemblyResolve += libraries.Resolve;

            // Preload every managed dependency explicitly. Assembly.LoadFrom
            // rejects Internet-zone files before the ordinary resolver can help.
            // The release allowlist and hashes are checked before any code loads.
            // No file-zone markers or Windows security settings are changed.
            libraries.ValidateProgramFiles();
            libraries.LoadAll();

            var machine = Environment.GetEnvironmentVariable("PROCESSOR_ARCHITECTURE") ?? "";
            var arch = machine.Equals("ARM64", StringComparison.OrdinalIgnoreCase)
                ? "arm64" : Environment.Is64BitProcess ? "x64" : "x86";
            var nativeFolder = Path.Combine(root, "Programm", "Windows", arch);
            if (!File.Exists(Path.Combine(nativeFolder, "WebView2Loader.dll")))
                throw new FileNotFoundException("Eine benötigte Programmdatei fehlt. Bitte entpacke den vollständigen Ordner der Version 1.8.0 erneut.");
            if (!SetDllDirectory(nativeFolder))
                throw new IOException("Die Programmdateien konnten nicht geöffnet werden.");

            libraries.Get("Notenblick.Fenster")
                .GetType("Notenblick.Native.Window", true)
                .GetMethod("Run")
                .Invoke(null, new object[] { root });
        }
        catch (Exception error)
        {
            while (error.InnerException != null) error = error.InnerException;
            MessageBox.Show("Notenblick 1.8.0 konnte nicht geöffnet werden.\n\n" + error.Message,
                "Notenblick 1.8.0", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
