using System;
using System.IO;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Windows.Forms;

namespace Notenblick.Native {
    internal static class RescueProgram {
        [STAThread]
        private static int Main(string[] args) {
            AppDomain.CurrentDomain.AssemblyResolve += ResolveLibrary;
            try {
                if (args.Length == 1 && args[0] == "--verify-readers") return VerifyReaders();
                Run();
                return 0;
            } catch {
                if (args.Length == 1 && args[0] == "--verify-readers") return 1;
                MessageBox.Show("Der Notfallzugriff konnte nicht gestartet werden. Entpacke ihn erneut oder öffne eine Kopie auf einem anderen Rechner.", "Notfallzugriff für Notenblick", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }
        }

        private static Assembly ResolveLibrary(object sender, ResolveEventArgs request) {
            var requested = new AssemblyName(request.Name);
            if (requested.Name != "Newtonsoft.Json" && requested.Name != "BouncyCastle.Cryptography") return null;
            using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("Notenblick." + requested.Name + ".dll")) {
                if (stream == null) return null;
                using (var bytes = new MemoryStream()) {
                    stream.CopyTo(bytes);
                    var result = Assembly.Load(bytes.ToArray());
                    if (result.GetName().FullName != requested.FullName) throw new FileLoadException("Eine Komponente passt nicht zu diesem Notfallzugriff.");
                    return result;
                }
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void Run() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new RescueWindow());
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static int VerifyReaders() {
            const string snapshot = "{\"format\":\"notenraum\",\"version\":1,\"commitId\":\"probe\",\"updatedAt\":\"2026-01-01T00:00:00Z\",\"years\":[],\"classes\":[],\"students\":[],\"courses\":[],\"assessments\":[],\"finals\":[]}";
            const string password = "Notenblick Prüfdaten öffnen";
            var expected = System.Text.Encoding.UTF8.GetBytes(snapshot);
            var key = VaultCrypto.Random(VaultCrypto.SecretBytes);
            try {
                string recovery = VaultCrypto.GenerateRecovery();
                byte[] header = VaultCrypto.CreateHeader(key, password, recovery);
                byte[] protectedBackup = VaultCrypto.SealBackup(key, header, expected);
                foreach (bool useRecovery in new[] { false, true }) {
                    byte[] clear = VaultStore.OpenBackup(protectedBackup, useRecovery ? null : password, useRecovery ? recovery : null);
                    try {
                        using (var opened = RescueSource.Parse(clear)) if (opened.CommitId != "probe") return 1;
                    } finally { VaultCrypto.Clear(clear); }
                }
                return 0;
            } finally { VaultCrypto.Clear(key); VaultCrypto.Clear(expected); }
        }
    }
}
