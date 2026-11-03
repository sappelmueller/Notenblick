using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("Notenblick")]
[assembly: AssemblyProduct("Notenblick")]
[assembly: AssemblyVersion("@ASSEMBLY_VERSION@")]
[assembly: AssemblyFileVersion("@ASSEMBLY_VERSION@")]
[assembly: AssemblyInformationalVersion("@VERSION@")]

public static class Launcher
{
    [DllImport("kernel32", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetDllDirectory(string path);

    [STAThread]
    public static void Main(string[] args)
    {
        try
        {
            var root = AppDomain.CurrentDomain.BaseDirectory;
            bool probe = args.Length == 1 && args[0] == "--verify-update";
            if (!probe && Notenblick.Native.UpdateBootstrap.RecoverBeforeStart(root)) return;
            var libraries = new Notenblick.Native.ProgramLibraries(root);
            AppDomain.CurrentDomain.AssemblyResolve += libraries.Resolve;

            // Preload every managed dependency explicitly. Assembly.LoadFrom
            // rejects Internet-zone files before the ordinary resolver can help.
            // The release allowlist and hashes are checked before any code loads.
            // No file-zone markers or Windows security settings are changed.
            libraries.ValidateProgramFiles();
            libraries.LoadAll();

            var arch = Notenblick.Native.ProcessArchitecture.Current();
            var nativeFolder = Path.Combine(root, "Programm", "Windows", arch);
            if (!File.Exists(Path.Combine(nativeFolder, "WebView2Loader.dll")))
                throw new FileNotFoundException("Eine benötigte Programmdatei fehlt. Bitte entpacke den vollständigen Ordner der Version @VERSION@ erneut.");
            if (!SetDllDirectory(nativeFolder))
                throw new IOException("Die Programmdateien konnten nicht geöffnet werden.");

            // Pin the verified matching loader before any WebView2 API runs.
            libraries.Get("Microsoft.Web.WebView2.Core")
                .GetType("Microsoft.Web.WebView2.Core.CoreWebView2Environment", true)
                .GetMethod("SetLoaderDllFolderPath", new Type[] { typeof(string) })
                .Invoke(null, new object[] { nativeFolder });

            // Verify the release without constructing Window/Storage or opening Daten.
            if (probe) return;

            libraries.Get("Notenblick.Fenster")
                .GetType("Notenblick.Native.Window", true)
                .GetMethod("Run")
                .Invoke(null, new object[] { root });
        }
        catch (Exception error)
        {
            if (args.Length == 1 && args[0] == "--verify-update") { Environment.ExitCode = 1; return; }
            while (error.InnerException != null) error = error.InnerException;
            MessageBox.Show("Notenblick @VERSION@ konnte nicht geöffnet werden.\n\n" + error.Message,
                "Notenblick @VERSION@", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
