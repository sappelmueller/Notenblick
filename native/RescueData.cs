using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Notenblick.Native {
    internal sealed class RescueSnapshot : IDisposable {
        internal readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
        internal string CommitId;
        internal DateTimeOffset Updated;
        internal bool AdditionalDataUnavailable;
        private long size;

        internal void Add(string path, byte[] bytes) {
            RescuePaths.ValidateRelative(path);
            if (Files.ContainsKey(path)) throw new InvalidDataException("Zwei Dateien haben denselben Namen.");
            if (Files.Count >= 100000 || (size += bytes.LongLength) > VaultStore.MaxPayload)
                throw new InvalidDataException("Diese Datenkopie ist zu groß. Wähle einen einzelnen Sicherungsstand.");
            Files.Add(path, bytes);
        }

        internal void Drop(string path) {
            byte[] data;
            if (!Files.TryGetValue(path, out data)) return;
            Files.Remove(path);
            size -= data.LongLength;
            Array.Clear(data, 0, data.Length);
        }

        internal IEnumerable<string> Lists {
            get { return Files.Keys.Where(RescuePaths.IsList).OrderBy(x => x, StringComparer.CurrentCultureIgnoreCase); }
        }

        public void Dispose() {
            foreach (var file in Files.Values) Array.Clear(file, 0, file.Length);
            Files.Clear();
        }
    }

    internal static class RescuePaths {
        private static readonly Regex Reserved = new Regex(@"^(CON|PRN|AUX|NUL|CONIN\$|CONOUT\$|COM[1-9¹²³]|LPT[1-9¹²³])( *\.|$)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        private const string Invalid = "<>:\"\\|?*";

        internal static void ValidateRelative(string name) {
            if (String.IsNullOrEmpty(name) || name.Length > 2000) throw new InvalidDataException("Ungültiger Dateiname.");
            foreach (var part in name.Split('/')) {
                if (part.Length == 0 || part.Length > 255 || part == "." || part == ".." || part != part.TrimEnd('.', ' ') || Reserved.IsMatch(part) || part.Any(c => c < 32 || c == 127 || Invalid.IndexOf(c) >= 0))
                    throw new InvalidDataException("Ungültiger Dateiname.");
            }
        }

        internal static string Full(string path) {
            var full = Path.GetFullPath(path);
            var root = Path.GetPathRoot(full);
            return full.Length > root.Length ? full.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) : full;
        }

        internal static string Under(string root, string relative) {
            ValidateRelative(relative);
            var full = Full(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
            if (!Within(full, root) || String.Equals(full, root, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Die Datei liegt außerhalb des Ordners.");
            return full;
        }

        internal static bool Within(string path, string root) {
            return String.Equals(path, root, StringComparison.OrdinalIgnoreCase) || path.StartsWith(root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
        }

        internal static void Separate(string source, string target) {
            if (Within(target, source) || Within(source, target)) throw new IOException("Wähle einen neuen Zielordner außerhalb der Originaldaten.");
        }

        internal static void NoLinks(string path) {
            var full = Full(path);
            var root = Path.GetPathRoot(full);
            string current = root;
            foreach (var part in full.Substring(root.Length).Split(new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries)) {
                current = Path.Combine(current, part);
                try {
                    if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new IOException("Verknüpfte Dateien und Ordner werden ausgelassen. Wähle den ursprünglichen Speicherort.");
                } catch (FileNotFoundException) { return; }
                catch (DirectoryNotFoundException) { return; }
            }
        }

        internal static bool IsList(string path) {
            var parts = path.Split('/');
            return parts.Length >= 4 && parts.Length <= 6 && parts[0] == "Notenlisten" && path.EndsWith(".txt", StringComparison.OrdinalIgnoreCase);
        }

        internal static string ListPath(string path) {
            if (path != null && !path.StartsWith("Notenlisten/", StringComparison.Ordinal)) path = "Notenlisten/" + path;
            ValidateRelative(path);
            if (!IsList(path)) throw new InvalidDataException("Eine Notenliste steht an einer unerwarteten Stelle.");
            return path;
        }
    }

    internal sealed class RescueSourceInUseException : IOException {
        internal RescueSourceInUseException() : base("Der Datenordner ist gerade in Notenblick geöffnet. Schließe Notenblick oder wähle eine gespeicherte Sicherung.") {}
    }

    internal sealed class RescueSource : IDisposable {
        private const string MainFile = "notenverwaltung.json";
        private const string Manifest = "Sicherungen/Notenlistenverzeichnis.json";
        private const string BlockerText = "Dieser Notenstand ist verschlüsselt. Bitte starte Notenblick oder Notfallzugriff für Notenblick.";
        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);
        private static readonly Regex SnapshotName = new Regex(@"\.(?:json|zip|nbx|nbk|tmp)$", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        private readonly VaultStore vault;
        internal readonly string SelectedPath;
        internal readonly bool IsFolder;
        internal readonly bool Protected;
        private bool standaloneUnlocked;
        internal bool IsUnlocked { get { return IsFolder ? !vault.Locked : standaloneUnlocked; } }

        internal RescueSource(string source) {
            SelectedPath = RescuePaths.Full(source);
            RescuePaths.NoLinks(SelectedPath);
            IsFolder = Directory.Exists(SelectedPath);
            if (IsFolder) { vault = new VaultStore(SelectedPath); Protected = vault.Enabled; }
            else {
                if (!File.Exists(SelectedPath)) throw new FileNotFoundException("Die gewählte Sicherung wurde nicht gefunden.");
                Protected = VaultCrypto.HasMagic(SelectedPath);
            }
        }

        public void Dispose() { if (vault != null) vault.Dispose(); }

        private FileStream WaitForClosed() {
            string lockRoot = SelectedPath;
            if (Protected && String.Equals(vault.PhysicalRoot, SelectedPath, StringComparison.OrdinalIgnoreCase)) {
                string parent = Path.GetDirectoryName(SelectedPath);
                if (parent != null && (File.Exists(RescuePaths.Under(parent, VaultStore.MarkerName)) ||
                    File.Exists(RescuePaths.Under(parent, "InBenutzung.lock")))) lockRoot = parent;
            }
            string path = RescuePaths.Under(lockRoot, "InBenutzung.lock");
            RescuePaths.NoLinks(path);
            try { return new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read); }
            catch (FileNotFoundException) { return null; }
            catch (IOException) { throw new RescueSourceInUseException(); }
        }

        private void RecheckOwner() { using (WaitForClosed()) {} }

        internal KeyValuePair<string, string>[] Earlier() {
            if (!IsFolder || vault.Locked || !Exists("Sicherungen", true)) return new KeyValuePair<string, string>[0];
            using (WaitForClosed()) {
                return EarlierEntries("Sicherungen", 0)
                    .OrderByDescending(x => x.LastModifiedUtc).ThenByDescending(x => x.Name, StringComparer.Ordinal)
                    .Take(10000).Select(x => new KeyValuePair<string, string>(x.Name, EarlierLabel(x))).ToArray();
            }
        }

        private static bool EarlierFile(string path) {
            return VaultStore.InBackupFolder(path) && SnapshotName.IsMatch(path) && !VaultStore.IsBackupIndex(path) &&
                !Path.GetFileName(path).StartsWith("Ansicht_Vor_Wiederherstellung_", StringComparison.OrdinalIgnoreCase);
        }

        private IEnumerable<VaultEntry> EarlierEntries(string parent, int depth) {
            if (depth > 14) yield break;
            foreach (var entry in Entries(parent)) {
                var path = parent + "/" + entry.Name;
                if (entry.IsDirectory) foreach (var item in EarlierEntries(path, depth + 1)) yield return item;
                else if (EarlierFile(path)) yield return new VaultEntry { Name = path, LastModifiedUtc = entry.LastModifiedUtc };
            }
        }

        private static string EarlierLabel(VaultEntry entry) {
            var name = Path.GetFileName(entry.Name);
            string reason = name.StartsWith("Vor_Wiederherstellung_", StringComparison.Ordinal) ? "vor Wiederherstellung" :
                name.StartsWith("Vor_Leistungsbereichen_", StringComparison.Ordinal) ? "vor Änderung der Leistungsbereiche" :
                name.StartsWith("Vor_Muendlich_Zuordnung_", StringComparison.Ordinal) ? "vor Zuordnung mündlicher Noten" :
                name.StartsWith("Vor_Einstellungen_", StringComparison.Ordinal) ? "vor Änderung der Einstellungen" :
                name.StartsWith("Stand_", StringComparison.Ordinal) ? "früherer Stand" :
                name.StartsWith("Beschaedigt_", StringComparison.Ordinal) || name.StartsWith("Ansicht_Beschaedigt_", StringComparison.Ordinal) ? "beschädigte Sicherung" : name;
            return entry.LastModifiedUtc.ToLocalTime().ToString("g", CultureInfo.CurrentCulture) + " – " + reason;
        }

        private bool Exists(string path, bool directory = false) {
            if (Protected) return vault.Exists(path, directory);
            string name = RescuePaths.Under(SelectedPath, path);
            RescuePaths.NoLinks(name);
            return directory ? Directory.Exists(name) : File.Exists(name);
        }

        private byte[] Read(string path) {
            return Protected ? vault.Read(path) : ReadFile(RescuePaths.Under(SelectedPath, path), VaultStore.MaxPayload);
        }

        private IEnumerable<VaultEntry> Entries(string path) {
            if (Protected) return vault.Entries(path);
            string root = RescuePaths.Under(SelectedPath, path);
            RescuePaths.NoLinks(root);
            return Directory.EnumerateFileSystemEntries(root).Where(p => (File.GetAttributes(p) & FileAttributes.ReparsePoint) == 0)
                .Select(p => new VaultEntry { Name = Path.GetFileName(p), IsDirectory = Directory.Exists(p), LastModifiedUtc = File.GetLastWriteTimeUtc(p) });
        }

        internal void Unlock(string password, string recovery) {
            if (!IsFolder || !vault.Locked) return;
            using (WaitForClosed()) vault.Unlock(password, recovery);
        }

        internal bool EarlierNeedsCredential(string file) {
            if (file == null || !EarlierFile(file)) return false;
            using (WaitForClosed()) {
                if (!Protected) {
                    var physical = RescuePaths.Under(SelectedPath, file);
                    RescuePaths.NoLinks(physical);
                    return VaultCrypto.HasMagic(physical);
                }
                var bytes = Read(file);
                try { return VaultCrypto.IsProtected(bytes); }
                finally { Array.Clear(bytes, 0, bytes.Length); }
            }
        }

        internal RescueSnapshot Open(string file, string password, string recovery) {
            if (!IsFolder) {
                if (!Protected && String.Equals(Path.GetExtension(SelectedPath), ".zip", StringComparison.OrdinalIgnoreCase)) {
                    RescuePaths.NoLinks(SelectedPath);
                    using (var input = new FileStream(SelectedPath, FileMode.Open, FileAccess.Read, FileShare.Read)) return OpenLegacyZip(input);
                }
                byte[] bytes = ReadFile(SelectedPath, VaultStore.MaxEnvelope);
                if (VaultCrypto.IsProtected(bytes)) {
                    byte[] clear = VaultStore.OpenBackup(bytes, password, recovery);
                    try { var result = Parse(clear); standaloneUnlocked = true; return result; } finally { Array.Clear(clear, 0, clear.Length); }
                }
                try { return Parse(bytes); } finally { Array.Clear(bytes, 0, bytes.Length); }
            }
            if (file != null && !EarlierFile(file))
                throw new InvalidDataException("Diese Sicherung ist hier nicht verfügbar.");
            Unlock(password, recovery);
            using (WaitForClosed()) {
                string path = file ?? MainFile;
                byte[] first = Read(path);
                RescueSnapshot snapshot = null;
                try {
                    if (file != null && VaultCrypto.IsProtected(first)) {
                        byte[] clear = VaultStore.OpenBackup(first, password, recovery);
                        try { snapshot = Parse(clear); } finally { Array.Clear(clear, 0, clear.Length); }
                    } else if (file != null && file.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) {
                        using (var input = new MemoryStream(first, false)) snapshot = OpenLegacyZip(input);
                    } else snapshot = Parse(first);
                    if (file == null) {
                        var contained = new HashSet<string>(snapshot.Lists, StringComparer.OrdinalIgnoreCase);
                        try {
                            if (Exists(Manifest)) AttachCurrentLists(snapshot);
                            else if (!vault.Enabled && Exists("Notenlisten", true)) ReadLegacyLists(snapshot, "Notenlisten", 1);
                        } catch (Exception error) when (OptionalReadFailed(error)) {
                            foreach (var list in snapshot.Lists.Where(p => !contained.Contains(p)).ToArray()) snapshot.Drop(list);
                            snapshot.AdditionalDataUnavailable = true;
                        }
                        foreach (var extra in ExtraDataFiles) try {
                            if (Exists(extra)) snapshot.Add(extra, Read(extra));
                        } catch (Exception error) when (OptionalReadFailed(error)) { snapshot.AdditionalDataUnavailable = true; }
                    }
                    var last = Read(path);
                    try {
                        if (!first.SequenceEqual(last)) throw new IOException("Die Daten wurden während des Lesens geändert. Öffne den Notenstand erneut.");
                    } finally { Array.Clear(last, 0, last.Length); }
                    RecheckOwner();
                    return snapshot;
                } catch { if (snapshot != null) snapshot.Dispose(); throw; }
                finally { Array.Clear(first, 0, first.Length); }
            }
        }

        private static readonly string[] ExtraDataFiles = { "Ansicht.json" };

        private static bool OptionalReadFailed(Exception error) {
            return error is IOException || error is InvalidDataException || error is UnauthorizedAccessException || error is JsonException || error is DecoderFallbackException;
        }

        private void AttachCurrentLists(RescueSnapshot snapshot) {
            var first = Read(Manifest);
            try {
                var metadata = ReadObject(first);
                if ((string)metadata["state"] != "complete" || (string)metadata["commitId"] != snapshot.CommitId) {
                    snapshot.AdditionalDataUnavailable = true;
                    return;
                }
                var files = metadata["files"] as JArray;
                var hashes = metadata["hashes"] as JObject;
                if (files == null || hashes == null || files.Count > 100000) throw new InvalidDataException("Das Verzeichnis der Notenlisten ist nicht lesbar.");
                foreach (var file in files) {
                    if (file.Type != JTokenType.String) throw new InvalidDataException("Das Verzeichnis der Notenlisten ist nicht lesbar.");
                    string name = (string)file;
                    string path = RescuePaths.ListPath(name);
                    if (snapshot.Files.ContainsKey(path)) continue;
                    try {
                        if (!Exists(path)) { snapshot.AdditionalDataUnavailable = true; continue; }
                        var contents = Read(path);
                        var normalized = Utf8.GetBytes(Text(contents));
                        try {
                            string digest = (string)hashes[name];
                            if (String.Equals(digest, Hex(normalized), StringComparison.OrdinalIgnoreCase)) snapshot.Add(path, contents);
                            else { snapshot.AdditionalDataUnavailable = true; Array.Clear(contents, 0, contents.Length); }
                        } finally { Array.Clear(normalized, 0, normalized.Length); }
                    } catch (Exception error) when (OptionalReadFailed(error)) { snapshot.AdditionalDataUnavailable = true; }
                }
                var second = Read(Manifest);
                try {
                    if (!first.SequenceEqual(second)) throw new IOException("Die Notenlisten wurden während des Lesens geändert. Öffne den Notenstand erneut.");
                } finally { Array.Clear(second, 0, second.Length); }
            } finally { Array.Clear(first, 0, first.Length); }
        }

        private void ReadLegacyLists(RescueSnapshot snapshot, string path, int depth) {
            if (depth > 6) return;
            foreach (var entry in Entries(path)) {
                string next = path + "/" + entry.Name;
                RescuePaths.ValidateRelative(next);
                if (entry.IsDirectory) ReadLegacyLists(snapshot, next, depth + 1);
                else if (RescuePaths.IsList(next) && !snapshot.Files.ContainsKey(next)) snapshot.Add(next, Read(next));
            }
        }

        internal static string Text(byte[] bytes) { var text = Utf8.GetString(bytes); return text.Length > 0 && text[0] == '\ufeff' ? text.Substring(1) : text; }

        private static JObject ReadObject(byte[] bytes) {
            using (var stream = new MemoryStream(bytes, false))
            using (var text = new StreamReader(stream, Utf8, true))
            using (var json = new JsonTextReader(text) { MaxDepth = 128, DateParseHandling = DateParseHandling.None }) {
                if (!json.Read() || json.TokenType != JsonToken.StartObject) throw new InvalidDataException("Der gespeicherte Stand ist nicht lesbar.");
                var result = JObject.Load(json, new JsonLoadSettings { DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Error });
                if (json.Read()) throw new InvalidDataException("Der gespeicherte Stand enthält unerwartete zusätzliche Daten.");
                return result;
            }
        }

        internal static RescueSnapshot Parse(byte[] bytes) {
            var payload = ReadObject(bytes);
            bool envelope = payload["data"] != null;
            var data = VaultStore.SnapshotData(payload);
            if (data == null)
                throw new InvalidDataException("Wähle eine vollständige Notenblick-Sicherung.");
            string id = (string)data["commitId"];
            DateTimeOffset when;
            if (String.IsNullOrWhiteSpace(id) || !DateTimeOffset.TryParse((string)data["updatedAt"], CultureInfo.InvariantCulture, DateTimeStyles.None, out when))
                throw new InvalidDataException("Dieser Notenstand ist beschädigt.");
            var snapshot = new RescueSnapshot { CommitId = id, Updated = when };
            try {
                var lists = envelope ? payload["lists"] : data["notfallListen"];
                if (lists != null && lists.Type != JTokenType.Null) {
                    if (!(lists is JArray)) throw new InvalidDataException("Die Notenlisten in der Sicherung sind nicht lesbar.");
                    foreach (var item in (JArray)lists) {
                        var entry = item as JObject;
                        if (entry == null || entry["path"]?.Type != JTokenType.String || entry["text"]?.Type != JTokenType.String)
                            throw new InvalidDataException("Eine Notenliste in der Sicherung ist nicht lesbar.");
                        snapshot.Add(RescuePaths.ListPath((string)entry["path"]), Utf8.GetBytes((string)entry["text"]));
                    }
                }
                bool hasEmbeddedLists = data["notfallListen"] != null;
                if (hasEmbeddedLists) data.Remove("notfallListen");
                snapshot.Add(MainFile, envelope || hasEmbeddedLists ? Utf8.GetBytes(data.ToString(Formatting.None)) : (byte[])bytes.Clone());
                return snapshot;
            } catch { snapshot.Dispose(); throw; }
        }

        private static RescueSnapshot OpenLegacyZip(Stream file) {
            using (var zip = new ZipArchive(file, ZipArchiveMode.Read)) {
                if (file.Length > VaultStore.MaxEnvelope || zip.Entries.Count > 100000) throw new InvalidDataException("Die Sicherung ist zu groß.");
                var entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.OrdinalIgnoreCase);
                foreach (var item in zip.Entries) {
                    if (item.FullName.EndsWith("/", StringComparison.Ordinal)) { RescuePaths.ValidateRelative(item.FullName.Substring(0, item.FullName.Length - 1)); continue; }
                    RescuePaths.ValidateRelative(item.FullName);
                    if (entries.ContainsKey(item.FullName)) throw new InvalidDataException("In der Sicherung kommen Dateinamen doppelt vor.");
                    entries.Add(item.FullName, item);
                }
                var prefix = entries.ContainsKey("Daten/" + MainFile) ? "Daten/" : "";
                ZipArchiveEntry main;
                if (!entries.TryGetValue(prefix + MainFile, out main)) throw new InvalidDataException("In der Sicherung fehlen die Noten.");
                byte[] mainBytes = ReadEntry(main);
                RescueSnapshot snapshot = null;
                try {
                    snapshot = Parse(mainBytes);
                    foreach (var pair in entries) {
                        if (!pair.Key.StartsWith(prefix, StringComparison.Ordinal)) continue;
                        var rel = pair.Key.Substring(prefix.Length);
                        if ((RescuePaths.IsList(rel) || ExtraDataFiles.Contains(rel)) && !snapshot.Files.ContainsKey(rel)) snapshot.Add(rel, ReadEntry(pair.Value));
                    }
                    return snapshot;
                } catch { if (snapshot != null) snapshot.Dispose(); throw; }
                finally { Array.Clear(mainBytes, 0, mainBytes.Length); }
            }
        }

        private static byte[] ReadEntry(ZipArchiveEntry entry) {
            using (var input = entry.Open()) return ReadStream(input, entry.Length, VaultStore.MaxPayload);
        }

        private static byte[] ReadFile(string path, long limit) {
            RescuePaths.NoLinks(path);
            using (var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read)) return ReadStream(file, file.Length, limit);
        }

        private static byte[] ReadStream(Stream input, long length, long limit) {
            if (length < 0 || length > limit) throw new InvalidDataException("Die gewählte Datei ist zu groß.");
            var bytes = new byte[(int)length];
            for (int offset = 0; offset < bytes.Length;) {
                int count = input.Read(bytes, offset, bytes.Length - offset);
                if (count == 0) throw new EndOfStreamException("Die Datei ist unvollständig.");
                offset += count;
            }
            if (input.ReadByte() != -1) throw new IOException("Die Datei hat sich beim Lesen verändert.");
            return bytes;
        }

        internal void SaveSnapshot(RescueSnapshot snapshot, string target, string[] listPaths = null) {
            var selected = listPaths == null ? snapshot.Files : listPaths.ToDictionary(n => n, n => snapshot.Files[n], StringComparer.OrdinalIgnoreCase);
            if (selected.Count == 0) throw new IOException("Wähle mindestens eine Notenliste.");
            SaveDirectory(target, stage => {
                foreach (var item in selected) WriteVerified(RescuePaths.Under(stage, item.Key), item.Value);
            });
        }

        internal void SaveProtected(string target) {
            if (!Protected) throw new InvalidOperationException("Diese Daten sind nicht verschlüsselt.");
            if (!IsFolder) {
                byte[] bytes = ReadFile(SelectedPath, VaultStore.MaxEnvelope);
                if (!VaultCrypto.IsProtected(bytes)) throw new InvalidDataException("Diese Sicherung ist nicht mehr verschlüsselt. Wähle sie erneut aus.");
                SaveDirectory(target, stage => WriteVerified(RescuePaths.Under(stage, Path.GetFileName(SelectedPath)), bytes));
                return;
            }
            using (WaitForClosed()) SaveDirectory(target, stage => {
                CopyProtectedFolder(stage);
                RecheckOwner();
            });
        }

        private static readonly Regex OpaqueDirectory = new Regex("^d-[a-f0-9]{32}$", RegexOptions.CultureInvariant);
        private static readonly Regex OpaqueLabel = new Regex("^d-[a-f0-9]{32}\\.bin$", RegexOptions.CultureInvariant);
        private static readonly Regex OpaqueFile = new Regex("^f-[a-f0-9]{32}$", RegexOptions.CultureInvariant);

        private void CopyProtectedFolder(string destination) {
            var known = vault.ProtectedPaths;
            if (known.Length == 0) throw new InvalidDataException("Der geschützte Datenordner ist nicht vollständig.");
            var rawRoot = RescuePaths.Full(vault.PhysicalRoot);
            RescuePaths.NoLinks(rawRoot);
            string pointer = RescuePaths.Under(SelectedPath, VaultStore.MarkerName);
            if (String.Equals(rawRoot, SelectedPath, StringComparison.OrdinalIgnoreCase) || !File.Exists(pointer)) {
                // A prepared generation can survive an interruption while the main
                // pointer is being written. A detached copy is directly readable.
                CopyOpaqueRoot(rawRoot, destination);
                return;
            }
            var targetRoot = RescuePaths.Under(destination, Path.GetFileName(rawRoot));
            foreach (var item in known) {
                string name = Path.GetFileName(item);
                if (String.Equals(rawRoot, RescuePaths.Full(item), StringComparison.OrdinalIgnoreCase)) CopyOpaqueRoot(rawRoot, targetRoot);
                else if (name == VaultStore.MarkerName) {
                    string value = Text(ReadFile(item, 128));
                    if (value != "NBSTORE1\n" + Path.GetFileName(rawRoot)) throw new InvalidDataException("Der geschützte Datenordner wurde geändert. Wähle ihn erneut aus.");
                    CopyFile(item, RescuePaths.Under(destination, name));
                } else if (name == MainFile) {
                    var blocker = RescuePaths.Under(item, "Geschuetzt.txt");
                    if (Text(ReadFile(blocker, 512)) != BlockerText)
                        throw new InvalidDataException("Der geschützte Datenordner wurde geändert. Wähle ihn erneut aus.");
                    CopyFile(blocker, RescuePaths.Under(destination, MainFile + "/Geschuetzt.txt"));
                } else if (name == "Sicherungen") {
                    if (Text(ReadFile(item, 512)) != BlockerText) throw new InvalidDataException("Der geschützte Datenordner wurde geändert. Wähle ihn erneut aus.");
                    CopyFile(item, RescuePaths.Under(destination, name));
                }
            }
        }

        private static void CopyOpaqueRoot(string from, string to) {
            CopyFile(RescuePaths.Under(from, "Zugang.bin"), RescuePaths.Under(to, "Zugang.bin"), "NBKEY001");
            CopyFile(RescuePaths.Under(from, "Pruefung.bin"), RescuePaths.Under(to, "Pruefung.bin"), "NBREC001");
            foreach (var file in new[] { "Bereinigen.bin", "Entschluesseln.bin", "Drehen.bin" }) {
                var path = RescuePaths.Under(from, file);
                if (File.Exists(path)) CopyFile(path, RescuePaths.Under(to, file), "NBREC001");
            }
            foreach (var directory in Directory.EnumerateDirectories(from).Where(x => Path.GetFileName(x) == "Dateien" || OpaqueDirectory.IsMatch(Path.GetFileName(x)))) {
                RescuePaths.NoLinks(directory);
                string target = RescuePaths.Under(to, Path.GetFileName(directory));
                Directory.CreateDirectory(target);
                foreach (var path in Directory.EnumerateFileSystemEntries(directory)) {
                    string name = Path.GetFileName(path);
                    if (OpaqueLabel.IsMatch(name)) CopyFile(path, RescuePaths.Under(target, name), "NBREC001");
                    else if (OpaqueFile.IsMatch(name)) {
                        var node = RescuePaths.Under(target, name);
                        CopyFile(RescuePaths.Under(path, "Name.bin"), RescuePaths.Under(node, "Name.bin"), "NBREC001");
                        CopyFile(RescuePaths.Under(path, "Inhalt.bin"), RescuePaths.Under(node, "Inhalt.bin"), "NBREC001");
                    }
                }
            }
            if (!Directory.Exists(RescuePaths.Under(to, "Dateien"))) throw new InvalidDataException("Die geschützte Kopie enthält keine vollständige Datenablage.");
        }

        private static void CopyFile(string source, string target, string prefix = null) {
            RescuePaths.NoLinks(source);
            CreateParent(target);
            using (var input = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read))
            using (var sha = SHA256.Create()) {
                if (input.Length > VaultStore.MaxEnvelope) throw new InvalidDataException("Eine Datei der Sicherung ist zu groß.");
                if (prefix != null) {
                    foreach (char c in prefix) if (input.ReadByte() != c) throw new InvalidDataException("Eine verschlüsselte Datei konnte nicht geprüft werden.");
                    input.Position = 0;
                }
                var expected = sha.ComputeHash(input);
                input.Position = 0;
                using (var output = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough)) {
                    input.CopyTo(output);
                    output.Flush(true);
                }
                using (var output = File.OpenRead(target)) if (!sha.ComputeHash(output).SequenceEqual(expected)) throw new IOException("Die geschützte Kopie konnte nicht vollständig geprüft werden.");
            }
        }

        private void SaveDirectory(string target, Action<string> copy) {
            target = RescuePaths.Full(target);
            RescuePaths.Separate(DataBoundary(SelectedPath), target);
            RejectDataDestination(target);
            string parent = Path.GetDirectoryName(target);
            if (String.IsNullOrEmpty(parent) || !Directory.Exists(parent)) throw new IOException("Wähle einen vorhandenen übergeordneten Ordner.");
            RescuePaths.ValidateRelative(Path.GetFileName(target));
            RescuePaths.NoLinks(SelectedPath);
            RescuePaths.NoLinks(target);
            if (File.Exists(target) || Directory.Exists(target)) throw new IOException("Dieser Name ist schon vergeben. Wähle einen neuen Ordnernamen.");
            string stage = Path.Combine(parent, ".Notenblick-Kopie-unvollstaendig-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(stage);
            try {
                copy(stage);
                RescuePaths.NoLinks(stage);
                RescuePaths.NoLinks(target);
                Directory.Move(stage, target);
            } finally {
                if (Directory.Exists(stage)) {
                    // The copy may hold private information. Never descend into a redirected folder.
                    try { DeleteStage(stage); } catch { /* Still named as incomplete. */ }
                }
            }
        }

        private static string DataBoundary(string source) {
            for (var dir = new DirectoryInfo(source); dir != null; dir = dir.Parent) {
                if (String.Equals(dir.Name, "Daten", StringComparison.OrdinalIgnoreCase)) return dir.FullName;
            }
            return source;
        }

        private static void RejectDataDestination(string target) {
            for (var dir = new DirectoryInfo(target); dir != null; dir = dir.Parent) {
                if (String.Equals(dir.Name, "Daten", StringComparison.OrdinalIgnoreCase) && dir.Exists &&
                    (File.Exists(Path.Combine(dir.FullName, MainFile)) || File.Exists(Path.Combine(dir.FullName, VaultStore.MarkerName)) ||
                    (dir.Parent != null && File.Exists(Path.Combine(dir.Parent.FullName, "Notenblick.exe")))))
                    throw new IOException("Wähle einen neuen Zielordner außerhalb der Originaldaten.");
            }
        }

        private static void DeleteStage(string path) {
            RescuePaths.NoLinks(path);
            foreach (string child in Directory.EnumerateFileSystemEntries(path)) {
                RescuePaths.NoLinks(child);
                if (Directory.Exists(child)) DeleteStage(child);
                else File.Delete(child);
            }
            Directory.Delete(path, false);
        }

        private static void CreateParent(string target) {
            RescuePaths.NoLinks(target);
            Directory.CreateDirectory(Path.GetDirectoryName(target));
            RescuePaths.NoLinks(target);
        }

        private static void WriteVerified(string path, byte[] bytes) {
            CreateParent(path);
            using (var file = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough)) {
                file.Write(bytes, 0, bytes.Length);
                file.Flush(true);
            }
            using (var file = File.OpenRead(path))
            using (var hash = SHA256.Create()) if (bytes.LongLength != file.Length || !hash.ComputeHash(bytes).SequenceEqual(hash.ComputeHash(file))) throw new IOException("Die Kopie konnte nicht vollständig geprüft werden.");
        }

        private static string Hex(byte[] bytes) { using (var hash = SHA256.Create()) return BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(); }
    }
}
