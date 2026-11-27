using System;
using System.IO;
using System.Security.Cryptography;

namespace Notenblick.Native
{
    // An old updater installs only Notenblick.exe and Programm. The new launcher
    // can then place the byte-identical independent reader beside itself.
    internal static partial class ReleaseRescue
    {
        internal const string FileName = "Notenblick-Notfallzugriff.exe";
        internal const string ResourceName = "Notenblick.Notfallzugriff.exe";

        static string Destination(string root)
        {
            var folder = new DirectoryInfo(Path.GetFullPath(root));
            for (var entry = folder; entry != null; entry = entry.Parent)
            {
                if (!entry.Exists || (entry.Attributes & FileAttributes.ReparsePoint) != 0 ||
                    string.Equals(entry.Name, "Daten", StringComparison.OrdinalIgnoreCase))
                    throw new IOException("Nicht unterstützter Programmordner.");
            }
            return Path.Combine(folder.FullName, FileName);
        }

        static string Checksum(string path)
        {
            var info = new FileInfo(path);
            if (!info.Exists || (info.Attributes & FileAttributes.ReparsePoint) != 0 ||
                info.Length > 64L * 1024 * 1024) return null;
            using (var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(file)).Replace("-", "");
        }

        internal static bool IsReady(string root)
        {
            try { return string.Equals(Checksum(Destination(root)), Hash, StringComparison.Ordinal); }
            catch (IOException) { return false; }
            catch (UnauthorizedAccessException) { return false; }
        }

        internal static bool Provision(string root)
        {
            string staged = null;
            try
            {
                var target = Destination(root);
                var previous = Checksum(target);
                if (previous == Hash) return true;
                var exists = File.Exists(target) || Directory.Exists(target);
                if (exists && Array.IndexOf(PreviousHashes, previous) < 0) return false;
                using (var resource = typeof(ReleaseRescue).Assembly.GetManifestResourceStream(ResourceName))
                {
                    if (resource == null || resource.Length != Bytes) return false;
                    staged = Path.Combine(Path.GetDirectoryName(target), ".notenblick-notfall-" + Guid.NewGuid().ToString("N") + ".tmp");
                    using (var file = new FileStream(staged, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough))
                    {
                        resource.CopyTo(file);
                        file.Flush(true);
                    }
                }
                if (Checksum(staged) != Hash) return false;
                if (exists)
                {
                    if (Checksum(target) != previous) return false;
                    File.Replace(staged, target, null);
                }
                else File.Move(staged, target);
                return IsReady(root);
            }
            catch (IOException) { return IsReady(root); }
            catch (UnauthorizedAccessException) { return false; }
            finally
            {
                if (staged != null)
                {
                    try { File.Delete(staged); }
                    catch (IOException) { }
                    catch (UnauthorizedAccessException) { }
                }
            }
        }
    }
}
