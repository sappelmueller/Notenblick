using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json.Linq;
using Notenblick.Native;

internal static class RescueProbe {
    private const string Password = "Notenblick sichert meine Prüfdaten!1";
    private const string ListPath = "Notenlisten/2026-27/6a/Deutsch/Notenübersicht.txt";
    private const string ListText = "\ufeffDeutsch – fiktive Klasse\r\nErika Beispiel: 2\r\n";
    private const string Legacy = "{\"format\":\"notenraum\",\"version\":1,\"commitId\":\"258\",\"updatedAt\":\"2026-11-25T12:00:00Z\",\"years\":[],\"classes\":[],\"students\":[],\"courses\":[],\"assessments\":[],\"finals\":[]}";
    private const string Previous = "Sicherungen/Stand_00000001_257.json";
    private static int checks;

    private static void Check(bool ok, string caption) {
        checks++;
        if (!ok) throw new Exception(caption);
    }

    private static void Reject(Action action, string caption) {
        try { action(); }
        catch (Exception error) when (error is IOException || error is InvalidDataException || error is InvalidOperationException || error is Newtonsoft.Json.JsonException) { checks++; return; }
        throw new Exception("Accepted: " + caption);
    }

    private static void RejectAs<T>(Action action, string caption) where T : Exception {
        try { action(); }
        catch (T) { checks++; return; }
        throw new Exception("Accepted: " + caption);
    }

    private static byte[] Bytes(string value) => new UTF8Encoding(false).GetBytes(value);
    private static void Write(string folder, string relative, byte[] bytes) {
        var path = Path.Combine(folder, relative.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        File.WriteAllBytes(path, bytes);
    }
    private static byte[] Read(string folder, string relative) => File.ReadAllBytes(Path.Combine(folder, relative.Replace('/', Path.DirectorySeparatorChar)));
    private static string Hex(byte[] bytes) { using (var sha = SHA256.Create()) return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(); }
    private static string[] Tree(string root) => Directory.GetFiles(root, "*", SearchOption.AllDirectories).OrderBy(p => p).Select(p => p.Substring(root.Length) + ":" + Hex(File.ReadAllBytes(p))).ToArray();
    private static JArray Lists() => new JArray(new JObject { ["path"] = ListPath, ["text"] = ListText });

    internal static int Main(string[] args) {
        string work = Path.GetFullPath(args[0]);
        Directory.CreateDirectory(work);
        var data = Path.Combine(work, "Daten");
        var legacyPath = Path.Combine(work, "Alte-Sicherung.json");
        File.WriteAllBytes(legacyPath, Bytes(Legacy));
        using (var source = new RescueSource(legacyPath))
        using (var result = source.Open(null, null, null)) {
            Check(!source.Protected && result.CommitId == "258", "Legacy manual backup");
            Check(!result.Lists.Any(), "No current list substituted into old backup");
            source.SaveSnapshot(result, Path.Combine(work, "Legacy-Ausgabe"));
            Check(JObject.Parse(RescueSource.Text(Read(Path.Combine(work, "Legacy-Ausgabe"), "notenverwaltung.json")))["format"].ToString() == "notenraum", "Legacy structured copy usable");
        }

        var manualData = JObject.Parse(Legacy);
        manualData["notfallListen"] = Lists();
        var withLists = Path.Combine(work, "Sicherung-mit-Listen.json");
        File.WriteAllBytes(withLists, Bytes(manualData.ToString()));
        using (var source = new RescueSource(withLists))
        using (var result = source.Open(null, null, null)) {
            Check(result.Lists.SequenceEqual(new[] { ListPath }), "Prepared lists from plain manual backup");
            Check(result.Files[ListPath].SequenceEqual(Bytes(ListText)), "TXT contents preserved byte for byte");
            source.SaveSnapshot(result, Path.Combine(work, "TXT"), new[] { ListPath });
            Check(Directory.GetFiles(Path.Combine(work, "TXT"), "*", SearchOption.AllDirectories).Length == 1, "Only selected text list emitted");
            Reject(() => source.SaveSnapshot(result, Path.Combine(work, "TXT")), "No overwrite existing folder");
            Reject(() => source.SaveSnapshot(result, withLists), "No write over the source file");
        }
        foreach (var badPath in new[] { "Notenlisten/2026-27/../../Ausbruch.txt", "Notenlisten/2026-27/6a/CON.txt", "Notenlisten/2026-27/6a/Namen.txt:stream", "Notenlisten/2026-27/6a/Name. /Liste.txt" }) {
            var bad = JObject.Parse(Legacy);
            bad["notfallListen"] = new JArray(new JObject { ["path"] = badPath, ["text"] = "Test" });
            Reject(() => { using (RescueSource.Parse(Bytes(bad.ToString()))) {} }, "Unsafe list path");
        }
        var duplicate = JObject.Parse(Legacy);
        duplicate["notfallListen"] = new JArray(Lists()[0], new JObject { ["path"] = ListPath.ToUpperInvariant().Replace("NOTENLISTEN", "Notenlisten"), ["text"] = "Test" });
        Reject(() => { using (RescueSource.Parse(Bytes(duplicate.ToString()))) {} }, "Case alias");
        Reject(() => { using (RescueSource.Parse(Bytes(Legacy + "{}"))) {} }, "Trailing JSON");
        Reject(() => { using (RescueSource.Parse(Bytes(Legacy.Replace("\"years\":[]", "\"years\":[],\"years\":[]")))) {} }, "Duplicate JSON property");

        string archive = Path.Combine(work, "Vor_Migration.zip");
        using (var zip = ZipFile(archive, ZipArchiveMode.Create)) {
            Add(zip, "Daten/notenverwaltung.json", Legacy);
            Add(zip, "Daten/" + ListPath, ListText);
        }
        using (var source = new RescueSource(archive))
        using (var snapshot = source.Open(null, null, null)) Check(snapshot.Lists.Single() == ListPath, "Migration archive with adjacent valid text list");
        string compressed = Path.Combine(work, "Komprimierte-Migration.zip");
        string longList = String.Concat(Enumerable.Repeat("Eine synthetische Zeile der Notenliste.\n", 4000));
        using (var zip = ZipFile(compressed, ZipArchiveMode.Create)) {
            Add(zip, "Daten/notenverwaltung.json", Legacy);
            Add(zip, "Daten/" + ListPath, longList);
        }
        Check(new FileInfo(compressed).Length < longList.Length, "Test list is longer than its compressed migration archive");
        Check((string)VaultStore.ReadPortableZipSnapshot(File.ReadAllBytes(compressed))["notfallListen"][0]["text"] == longList,
            "Migrated backup keeps a text list longer than the compressed archive");
        string invalidArchive = Path.Combine(work, "unlesbar.zip");
        using (var zip = ZipFile(invalidArchive, ZipArchiveMode.Create)) { Add(zip, "notenverwaltung.json", Legacy); Add(zip, "../irgendwo.txt", "Test"); }
        using (var source = new RescueSource(invalidArchive)) Reject(() => source.Open(null, null, null), "Reject unsafe ZIP path");

        foreach (bool interruptedRotation in new[] { false, true }) {
            var retiredId = "00112233445566778899aabbccddeeff";
            var old = Path.Combine(work, interruptedRotation ? "Wechsel-abgebrochen" : "Alter-Datenordner");
            var archiveData = Path.Combine(work, interruptedRotation ? "Archiv-nach-Abbruch" : "Aktuelles-Datenarchiv");
            Write(old, "notenverwaltung.json", Bytes(Legacy));
            var oldKey = VaultCrypto.GenerateRecovery();
            using (var vault = new VaultStore(old)) vault.Enable(Password, oldKey, oldKey);
            var retired = Path.Combine(archiveData, "Geschuetzt-" + retiredId);
            Directory.CreateDirectory(archiveData);
            Directory.Move(Directory.GetDirectories(old, "Geschuetzt-*").Single(), retired);
            if (interruptedRotation) {
                var secret = VaultCrypto.UnlockHeader(Read(retired, "Zugang.bin"), null, oldKey);
                try { Write(retired, "Drehen.bin", VaultCrypto.SealRecord(secret, "Drehen.bin", Bytes("[\"Geschuetzt-ffeeddccbbaa99887766554433221100\"]"))); }
                finally { VaultCrypto.Clear(secret); }
            } else {
                Write(retired, "Frueherer-Stand.txt", Bytes("Früherer geschützter Notenstand. Zum Öffnen diesen Ordner im Notfallzugriff auswählen."));
            }
            Write(archiveData, "notenverwaltung.json", Bytes(Legacy));
            using (var plain = new VaultStore(archiveData)) plain.FinishPlainCleanup();
            Check(!Directory.Exists(retired), "Remove previous test-build generation after archiving");
            var retained = Path.Combine(archiveData, "Sicherungen", "Notenblick-Archiv-" + retiredId + ".zip");
            var retainedHash = Hex(File.ReadAllBytes(retained));
            using (var source = new RescueSource(retained)) {
                Check(source.Protected, "Archived generation remains protected");
                Reject(() => source.Open(null, "Ungültig", null), "Old archive rejects wrong password");
                using (var opened = source.Open(null, null, oldKey)) Check(opened.CommitId == "258", "Old archive keeps its own recovery credential");
            }
            Check(Hex(File.ReadAllBytes(retained)) == retainedHash, "Notfallzugriff leaves previous archive unchanged");
        }

        var manifest = new JObject {
            ["state"] = "complete", ["commitId"] = "258", ["files"] = new JArray(ListPath.Substring("Notenlisten/".Length)),
            ["hashes"] = new JObject { [ListPath.Substring("Notenlisten/".Length)] = Hex(Bytes(ListText.Substring(1))) }
        };
        Write(data, "notenverwaltung.json", Bytes(Legacy));
        Write(data, "Ansicht.json", Bytes("{\"assessmentDrafts\":[\"Prüfentwurf\"]}"));
        Write(data, Previous, Bytes(Legacy.Replace("\"258\"", "\"257\"")));
        string previousName = Path.GetFileName(Previous);
        var previousInfo = new FileInfo(Path.Combine(data, Previous));
        Write(data, "Sicherungen/Aufbewahrung.json", Bytes(new JObject {
            [previousName] = new JObject {
                ["name"] = previousName, ["size"] = previousInfo.Length,
                ["lastModified"] = new DateTimeOffset(previousInfo.LastWriteTimeUtc).ToUnixTimeMilliseconds(),
                ["digest"] = Hex(File.ReadAllBytes(previousInfo.FullName))
            }
        }.ToString()));
        Write(data, ListPath, Bytes(ListText));
        Write(data, "Sicherungen/Notenlistenverzeichnis.json", Bytes(manifest.ToString()));
        var legacyBefore = Tree(data);
        var lockPath = Path.Combine(data, "InBenutzung.lock");
        using (var locked = new FileStream(lockPath, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None))
        using (var source = new RescueSource(data)) RejectAs<RescueSourceInUseException>(() => source.Open(null, null, null), "Open Notenblick folder has its own status");
        File.Delete(lockPath);
        using (var source = new RescueSource(data)) {
            Check(source.Earlier().Single().Key == Previous, "Old point listed");
            using (var now = source.Open(null, null, null)) {
                Check(now.Lists.Single() == ListPath, "BOM normalized for comparison, list retained");
                Check(now.Files.ContainsKey("Ansicht.json"), "Current workspace retained");
                Reject(() => source.SaveSnapshot(now, Path.Combine(data, "Klartext")), "No plaintext copy inside source");
            }
            using (var earlier = source.Open(Previous, null, null)) Check(earlier.CommitId == "257" && !earlier.Lists.Any(), "Earlier point does not show unrelated current text lists");
        }
        Check(Tree(data).SequenceEqual(legacyBefore), "Legacy reader never writes source");
        Write(data, "Sicherungen/Notenlistenverzeichnis.json", Bytes("{"));
        using (var source = new RescueSource(data))
        using (var snapshot = source.Open(null, null, null)) Check(snapshot.CommitId == "258" && snapshot.AdditionalDataUnavailable && !snapshot.Lists.Any(), "Malformed optional text list index does not impede recovery of the actual data");
        Write(data, "Sicherungen/Notenlistenverzeichnis.json", Bytes(manifest.ToString()));

        string key = VaultCrypto.GenerateRecovery();
        string other = VaultCrypto.GenerateRecovery();
        string backupPath = Path.Combine(work, "Geschuetzte-Sicherung.nbx");
        const string inner = "Sicherungen/Notenblick-Sicherung-2026-11-25.nbx";
        const string innerPassword = "Unabhängiges Prüfpasswort!9";
        var protectedData = new JObject { ["version"] = 1, ["data"] = JObject.Parse(Legacy), ["lists"] = Lists() };
        using (var vault = new VaultStore(data)) {
            vault.Enable(Password, key, key);
            Check(vault.Exists(ListPath), "Existing text-list migration retains real BOM lists");
            File.WriteAllBytes(backupPath, vault.Backup(Bytes(protectedData.ToString())));
            var innerKey = VaultCrypto.Random(VaultCrypto.SecretBytes);
            try { vault.Write(inner, VaultCrypto.SealBackup(innerKey, VaultCrypto.CreateHeader(innerKey, innerPassword, other), Bytes(protectedData.ToString()))); }
            finally { VaultCrypto.Clear(innerKey); }
        }
        var expected = File.ReadAllBytes(backupPath);
        using (var source = new RescueSource(backupPath)) {
            var to = Path.Combine(work, "Ciphercopy");
            Check(source.Protected && !source.IsUnlocked, "Standalone backup detected and locked");
            source.SaveProtected(to);
            Check(Read(to, Path.GetFileName(backupPath)).SequenceEqual(expected) && !source.IsUnlocked, "Exact protected copy available before unlock");
            RejectAs<VaultAccessException>(() => source.Open(null, "Falsches Passwort hier", null), "Wrong password");
            RejectAs<VaultAccessException>(() => source.Open(null, null, other), "Wrong recovery key");
            RejectAs<VaultAccessException>(() => source.Open(null, null, "unvollständig"), "Malformed recovery key");
            using (var opened = source.Open(null, Password, null)) Check(opened.Lists.Single() == ListPath, "Unlock backup using current password");
        }
        using (var source = new RescueSource(backupPath))
        using (var opened = source.Open(null, null, key)) {
            Check(source.IsUnlocked, "Standalone backup recovery unlock");
            source.SaveSnapshot(opened, Path.Combine(work, "Klar-Sicherung"));
            Check(Read(Path.Combine(work, "Klar-Sicherung"), ListPath).SequenceEqual(Bytes(ListText)), "Clear TXT output complete");
        }
        var mangledPath = Path.Combine(work, "Veraendert.nbx");
        var altered = (byte[])expected.Clone(); altered[altered.Length - 1] ^= 1;
        File.WriteAllBytes(mangledPath, altered);
        using (var source = new RescueSource(mangledPath)) RejectAs<InvalidDataException>(() => source.Open(null, null, key), "Authenticated damage distinguished from wrong access");

        var before = Tree(data);
        var recovered = Path.Combine(work, "Klar-Bestand");
        var cipher = Path.Combine(work, "Geschuetzter-Bestand");
        using (var source = new RescueSource(data)) {
            source.SaveProtected(cipher);
            using (var result = source.Open(null, null, key)) {
                Check(result.Lists.Single() == ListPath && result.Files.ContainsKey("Ansicht.json"), "Protected data reader and prepared plans");
                source.SaveSnapshot(result, recovered);
                Check(Read(recovered, ListPath).SequenceEqual(Bytes(ListText)), "Full readable data copy includes TXT lists");
            }
            Check(source.EarlierNeedsCredential(inner) && !source.EarlierNeedsCredential(Previous), "Archived backup requires its own credentials");
            RejectAs<VaultAccessException>(() => source.Open(inner, Password, null), "Folder password cannot open an independently protected backup");
            using (var opened = source.Open(inner, innerPassword, null)) Check(opened.Lists.Single() == ListPath, "Archived backup opens with its original password");
            using (var opened = source.Open(inner, null, other)) Check(opened.Lists.Single() == ListPath, "Archived backup opens with its original recovery key");
        }
        Check(Tree(data).SequenceEqual(before), "Protected source remains byte identical");
        using (var source = new RescueSource(cipher))
        using (var result = source.Open(null, Password, null)) Check(result.CommitId == "258", "Copied protected folder opens independently");
        var detached = Directory.GetDirectories(data, "Geschuetzt-*").Single();
        var cipherDetached = Path.Combine(work, "Geschuetzter-Einzelstand");
        using (var source = new RescueSource(detached)) {
            Reject(() => source.SaveProtected(Path.Combine(data, "Unerwuenscht")), "No output in parent Daten after selecting a detached generation");
            source.SaveProtected(cipherDetached);
        }
        using (var source = new RescueSource(cipherDetached))
        using (var result = source.Open(null, null, key)) Check(result.CommitId == "258", "Detached protected copy opens directly");
        Check(Tree(data).SequenceEqual(before), "Repeated protected copies leave source untouched");

        var interrupted = Directory.GetDirectories(cipher, "Geschuetzt-*").Single();
        byte[] header = Read(interrupted, "Zugang.bin");
        byte[] liveKey = VaultCrypto.UnlockHeader(header, null, key);
        try { Write(interrupted, "Bereinigen.bin", VaultCrypto.SealRecord(liveKey, "Bereinigen.bin", Bytes("[]"))); }
        finally { Array.Clear(liveKey, 0, liveKey.Length); }
        File.Delete(Path.Combine(cipher, VaultStore.MarkerName));
        var orphanCopy = Path.Combine(work, "Kopie-unterbrochener-Schutz");
        using (var source = new RescueSource(cipher)) {
            Check(source.Protected, "Prepared orphan recognized before unlock");
            source.SaveProtected(orphanCopy);
            Check(!File.Exists(Path.Combine(cipher, VaultStore.MarkerName)) && File.Exists(Path.Combine(orphanCopy, "Zugang.bin")), "Rescue never commits an interrupted original transition and emits a directly reopenable copy");
        }
        using (var source = new RescueSource(orphanCopy))
        using (var result = source.Open(null, null, key)) Check(result.CommitId == "258", "Orphan copy opens with the recovery key");
        Console.WriteLine("Notfallzugriff: " + checks + " Datei-, Sicherungs- und Schutzprüfungen erfolgreich.");
        return 0;
    }

    private static ZipArchive ZipFile(string path, ZipArchiveMode mode) => new ZipArchive(File.Open(path, FileMode.CreateNew, FileAccess.ReadWrite), mode);
    private static void Add(ZipArchive zip, string name, string payload) {
        using (var writer = new StreamWriter(zip.CreateEntry(name).Open(), new UTF8Encoding(false))) writer.Write(payload);
    }
}
