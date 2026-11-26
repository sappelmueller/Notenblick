using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Notenblick.Native {
 public sealed class VaultEntry {
  public string Name { get; internal set; }
  public bool IsDirectory { get; internal set; }
  public long Size { get; internal set; }
  public DateTime LastModifiedUtc { get; internal set; }
 }

 // The physical tree contains opaque, keyed names. Logical names and contents
 // are independently authenticated, allowing direct lookup and cheap listing.
 // The program's existing lock serializes every mutable operation across processes.
 public sealed class VaultStore : IDisposable {
  public const int MaxPayload = VaultCrypto.MaxPayload;
  public const int MaxEnvelope = MaxPayload + VaultCrypto.EnvelopeOverhead;
  public const string MarkerName = "Notenblick-Schutz.txt";
  const string MainName = "notenverwaltung.json";
  const string HeaderName = "Zugang.bin";
  const string EnableJournal = "Bereinigen.bin";
  const string DisableJournal = "Entschluesseln.bin";
  const string RotateJournal = "Drehen.bin";
  const string BackupFolder = "Sicherungen";
  const string BlockerText = "Dieser Notenstand ist verschlüsselt. Bitte starte Notenblick oder Notfallzugriff für Notenblick.";
  const string RetiredMarker = "Frueherer-Stand.txt";
  const string ProofName = "Pruefung.bin";
  const string Proof = "Notenblick Daten schützen 1";
  const string PointerHeader = "NBSTORE1\n";
  const string CleanupHeader = "NBPLAIN1\n";
  const string RetiredText = "Früherer geschützter Notenstand. Zum Öffnen diesen Ordner im Notfallzugriff auswählen.";
  const string ArchivePrefix = "Notenblick-Archiv-";
  const string PlainStage = "Ausgabe-Entschluesselung.tmp";
  const string ArchiveStage = "Ausgabe-Archiv.tmp";
  const string ArchiveClaim = "Archiv-Auftrag.txt";
  static readonly Regex Generation = new Regex("^Geschuetzt-[a-f0-9]{32}$", RegexOptions.CultureInvariant);
  static readonly Regex OpaqueDirectory = new Regex("^d-[a-f0-9]{32}$", RegexOptions.CultureInvariant);
  static readonly Regex ProtectionStage = new Regex("^\\.schutz-[a-f0-9]{32}$", RegexOptions.CultureInvariant);
  static readonly Regex Node = new Regex("^(?:f-[a-f0-9]{32}|d-[a-f0-9]{32}\\.bin)$", RegexOptions.CultureInvariant);
  const string GeneratedId = @"(?:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|n[0-9a-z]{10,})";
  const string BackupDate = @"\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z";
  static readonly Regex GeneratedBackup = new Regex(
   @"^(?:Stand_\d{8,}_" + GeneratedId +
   @"|(?:Vor_Wiederherstellung|Vor_Einstellungen_1-4|Vor_Muendlich_Zuordnung|Vor_Leistungsbereichen|Ansicht_Vor_Wiederherstellung|Ansicht_Beschaedigt)_" + BackupDate + "_" + GeneratedId +
   @"|Beschaedigt_" + BackupDate + @"(?:_" + GeneratedId + ")?" +
   @"|(?:Notenblick|Notenraum)-Sicherung-" + BackupDate + @")(?: \(\d+\))?\.(?:json|nbx|nbk)$" +
   @"|^Vor_(?:Migration|Ersetzen)_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_[a-f0-9]{32}\.zip$|^\.notenblick-[a-f0-9]{32}\.tmp$",
   RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
  static readonly string[] SnapshotCollections = { "years", "classes", "students", "courses", "assessments", "finals" };
  readonly string dataRoot;
  readonly bool detached;
  readonly Action<string> boundary;
  bool pointerMissing;
  string cleanup;
  string plainHash;
  string physicalRoot;
  byte[] key, header;

  public VaultStore(string dataRoot) : this(dataRoot, null) {}
  internal VaultStore(string dataRoot, Action<string> boundary) {
   this.boundary = boundary;
   this.dataRoot = Path.GetFullPath(dataRoot);
   CheckPath(this.dataRoot);
   var candidate = Path.Combine(this.dataRoot, HeaderName);
   if (File.Exists(candidate)) { CheckPath(candidate); detached = true; physicalRoot = this.dataRoot; return; }
   var marker = Path.Combine(this.dataRoot, MarkerName);
   if (Directory.Exists(marker)) throw FormatError();
   if (File.Exists(marker)) {
    var value = VaultCrypto.Utf8.GetString(ReadBounded(marker, 160));
    if (value.StartsWith(CleanupHeader, StringComparison.Ordinal)) {
     var parts = value.Substring(CleanupHeader.Length).Split('\n');
     if (parts.Length != 2 || !Generation.IsMatch(parts[0]) || !Regex.IsMatch(parts[1], "^[0-9A-F]{64}$")) throw FormatError();
     cleanup = parts[0]; plainHash = parts[1]; return;
    }
    if (!value.StartsWith(PointerHeader, StringComparison.Ordinal)) throw FormatError();
    var name = value.Substring(PointerHeader.Length);
    if (!Generation.IsMatch(name)) throw FormatError();
    physicalRoot = Path.Combine(this.dataRoot, name);
    CheckPath(physicalRoot);
    if (!Directory.Exists(physicalRoot)) throw FormatError();
   } else if (Directory.Exists(this.dataRoot)) {
    var generations = Directory.EnumerateDirectories(this.dataRoot, "Geschuetzt-*").Where(path => Generation.IsMatch(Path.GetFileName(path))).ToArray();
    var candidates = generations.Where(path => !File.Exists(Path.Combine(path, RetiredMarker))).Take(2).ToArray();
    if (candidates.Length == 1 && File.Exists(Path.Combine(candidates[0], EnableJournal))) {
     CheckPath(candidates[0]);
     physicalRoot = candidates[0]; pointerMissing = true;
    } else if (candidates.Length != 0 || Directory.Exists(Path.Combine(this.dataRoot, MainName)) ||
               (generations.Length != 0 && !File.Exists(Path.Combine(this.dataRoot, MainName)))) {
     throw new InvalidDataException("Ein geschützter Datenstand ist vorhanden. Bitte öffne den geschützten Ordner über den Notfallzugriff.");
    }
   }
  }

  public string PhysicalRoot => physicalRoot;
  public bool Enabled => physicalRoot != null;
  public bool Locked => Enabled && key == null;
  public bool Pending => cleanup != null || Enabled && !detached && new[] { EnableJournal, DisableJournal, RotateJournal }.Any(name => File.Exists(Path.Combine(physicalRoot, name)));
  public string[] ProtectedPaths {
   get {
    if (!Enabled) return new string[0];
    if (detached) return new[] { physicalRoot };
    var paths = new List<string> { Path.Combine(dataRoot, MarkerName), physicalRoot };
    var blocker = Path.Combine(dataRoot, MainName);
    if (IsBlocker(blocker)) paths.Add(blocker);
    var backupBlocker = Path.Combine(dataRoot, BackupFolder);
    if (IsBackupBlocker(backupBlocker)) paths.Add(backupBlocker);
    return paths.ToArray();
   }
  }

  static InvalidDataException FormatError() => new InvalidDataException("Der geschützte Datenstand ist beschädigt oder wird nicht unterstützt. Bitte öffne eine Sicherung.");
  static InvalidOperationException LockedError() => new InvalidOperationException("Bitte entsperre zuerst deine Noten.");
  static IOException Collision(string path) => new IOException("Eine vorhandene Datei stimmt nicht mit den geschützten Daten überein. Sie wurde beibehalten: " + path);
  void RequireUnlocked() { if (!Enabled || key == null) throw LockedError(); }
  void RequireTransitionAccess() { if (detached) throw new InvalidOperationException("Notfallzugriff liest nur."); }
  public void Lock() { VaultCrypto.Clear(key); key = null; header = null; }
  public void Dispose() => Lock();

  public void Unlock(string password, string recovery) {
   if (!Enabled) throw new InvalidOperationException("Der Passwortschutz ist ausgeschaltet.");
   var next = ReadBounded(Path.Combine(physicalRoot, HeaderName), VaultCrypto.HeaderBytes);
   var secret = VaultCrypto.UnlockHeader(next, password, recovery);
   try { VerifyProof(physicalRoot, secret); }
   catch { VaultCrypto.Clear(secret); throw; }
   Lock(); key = secret; header = next;
  }
  public void VerifyAccess(string password, string recovery) {
   RequireUnlocked();
   var unlocked = VaultCrypto.UnlockHeader(header, password, recovery);
   try {
    if (!VaultCrypto.Equal(unlocked, key)) throw FormatError();
    VerifyProof(physicalRoot, unlocked);
   } finally { VaultCrypto.Clear(unlocked); }
  }
  static void VerifyProof(string root, byte[] secret) {
   var proof = VaultCrypto.OpenRecord(secret, "proof", ReadBounded(Path.Combine(root, ProofName), 1024));
   try { if (VaultCrypto.Utf8.GetString(proof) != Proof) throw FormatError(); }
   finally { VaultCrypto.Clear(proof); }
  }

  // Supply portable authenticated snapshots, independent of the location and
  // any future password or key changes in the original installation.
  public byte[] Backup(byte[] payload) { RequireUnlocked(); return VaultCrypto.SealBackup(key, header, payload); }
  public static byte[] OpenBackup(byte[] bytes, string password, string recovery) => VaultCrypto.OpenBackup(bytes, password, recovery);
  public byte[] ImportBackup(byte[] bytes, string password, string recovery) => VaultCrypto.OpenBackup(bytes, password, recovery, key);

  public bool Exists(string logical, bool directory = false) {
   RequireUnlocked();
   if (logical == "") return directory;
   var path = Location(physicalRoot, key, logical, directory);
   CheckPath(path);
   if (directory) {
    if (!File.Exists(path)) return false;
    if (!Directory.Exists(DirectoryNode(physicalRoot, key, logical))) throw FormatError();
    return true;
   }
   if (!Directory.Exists(path)) return false;
   if (!File.Exists(Path.Combine(path, "Inhalt.bin")) || !File.Exists(Path.Combine(path, "Name.bin"))) throw FormatError();
   return true;
  }
  public void DirectoryAt(string logical, bool create) {
   RequireUnlocked();
   if (logical == "") return;
   if (create) MakeDirectory(physicalRoot, key, logical);
   else if (!Exists(logical, true)) throw new DirectoryNotFoundException();
  }
  public IEnumerable<VaultEntry> Entries(string logical) {
   RequireUnlocked();
   return Enumerate(physicalRoot, key, logical).ToArray();
  }
  public byte[] Read(string logical) { RequireUnlocked(); return ReadFile(physicalRoot, key, logical); }
  public void Write(string logical, byte[] data) { RequireUnlocked(); WriteFile(physicalRoot, key, logical, data); }
  public void Remove(string logical) {
   RequireUnlocked();
   if (Exists(logical)) {
    var file = Location(physicalRoot, key, logical, false);
    var trash = Path.Combine(Path.GetDirectoryName(file), ".weg-" + Guid.NewGuid().ToString("N"));
    CheckPath(file); CheckPath(trash);
    CheckFileNode(file);
    Directory.Move(file, trash);
    TryRemoveTransient(trash);
   } else if (Exists(logical, true)) {
    var dir = DirectoryNode(physicalRoot, key, logical);
    CheckPath(dir);
    if (Directory.EnumerateFileSystemEntries(dir).Any()) throw new IOException("Dieser Ordner enthält noch Dateien.");
    File.Delete(Location(physicalRoot, key, logical, true));
    Directory.Delete(dir);
   } else throw new FileNotFoundException();
  }

  static string Validate(string logical) {
   if (string.IsNullOrEmpty(logical) || logical.Length > 2000 || logical.Contains("\\")) throw new InvalidDataException("Ungültiger Dateiname.");
   var parts = logical.Split('/');
   if (parts.Length > 16 || parts.Any(segment => string.IsNullOrEmpty(segment) || segment.Length > 240 || segment == "." || segment == ".." ||
       segment.TrimEnd(' ', '.') != segment || Regex.IsMatch(segment, "[<>:\"|?*\\x00-\\x1f\\x7f]") ||
       Regex.IsMatch(segment, @"^(CON|PRN|AUX|NUL|CONIN\$|CONOUT\$|COM[1-9¹²³]|LPT[1-9¹²³])( *\.|$)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)))
    throw new InvalidDataException("Ungültiger Dateiname.");
   return logical;
  }
  static string Canonical(string relative) => Validate(relative).ToUpperInvariant();
  static string NameOf(string logical) => logical.Substring(logical.LastIndexOf('/') + 1);
  static string ParentOf(string logical) { int i = logical.LastIndexOf('/'); return i < 0 ? "" : logical.Substring(0, i); }
  static string Child(string parent, string name) => parent.Length == 0 ? name : parent + "/" + name;
  static string Hex(byte[] input) => BitConverter.ToString(input).Replace("-", "").ToLowerInvariant();
  static string Id(byte[] secret, string logical) => Hex(VaultCrypto.Slice(VaultCrypto.Mac(secret, VaultCrypto.Utf8.GetBytes("Notenblick name 1/" + Canonical(logical))), 0, 16));
  static string Location(string root, byte[] secret, string logical, bool directory) => Path.Combine(DirectoryNode(root, secret, ParentOf(logical)), (directory ? "d-" : "f-") + Id(secret, logical) + (directory ? ".bin" : ""));
  static string DirectoryNode(string root, byte[] secret, string logical) => Path.Combine(root, logical.Length == 0 ? "Dateien" : "d-" + Id(secret, logical));
  static string Purpose(string item, string logical) => item + ":" + Canonical(logical);
  static int FileLimit(string logical) => InBackupFolder(logical) ? MaxEnvelope : MaxPayload;

  static void MakeDirectory(string root, byte[] secret, string logical) {
   if (logical.Length == 0) return;
   Validate(logical);
   string current = "";
   foreach (var name in logical.Split('/')) {
    current = Child(current, name);
    var data = DirectoryNode(root, secret, current);
    var label = Location(root, secret, current, true);
    if (Directory.Exists(Location(root, secret, current, false))) throw Collision(current);
    CheckPath(data); CheckPath(label);
    if (!Directory.Exists(data)) Directory.CreateDirectory(data);
    if (!File.Exists(label)) WriteAtomic(label, VaultCrypto.SealRecord(secret, "name:" + Path.GetFileName(label), VaultCrypto.Utf8.GetBytes(name)));
   }
  }
  static byte[] ReadFile(string root, byte[] secret, string logical) {
   var node = Location(root, secret, logical, false);
   CheckPath(node);
   var content = Path.Combine(node, "Inhalt.bin");
   if (Directory.Exists(node) && (!File.Exists(content) || !File.Exists(Path.Combine(node, "Name.bin")))) throw FormatError();
   if (!Directory.Exists(node)) throw new FileNotFoundException();
   int limit = FileLimit(logical);
   return VaultCrypto.OpenRecord(secret, Purpose("file", logical), ReadBounded(content, limit + VaultCrypto.RecordOverhead), maximum:limit);
  }
  static void WriteFile(string root, byte[] secret, string logical, byte[] data) {
   Validate(logical);
   var node = Location(root, secret, logical, false);
   CheckPath(node);
   if (File.Exists(Location(root, secret, logical, true))) throw Collision(logical);
   if (Directory.Exists(node)) {
    CheckFileNode(node);
    WriteAtomic(Path.Combine(node, "Inhalt.bin"), VaultCrypto.SealRecord(secret, Purpose("file", logical), data, FileLimit(logical)));
    return;
   }
   MakeDirectory(root, secret, ParentOf(logical));
   var stage = Path.Combine(Path.GetDirectoryName(node), ".neu-" + Guid.NewGuid().ToString("N"));
   CheckPath(stage);
   Directory.CreateDirectory(stage);
   try {
    string label = "name:" + Path.GetFileName(node);
    WriteAtomic(Path.Combine(stage, "Name.bin"), VaultCrypto.SealRecord(secret, label, VaultCrypto.Utf8.GetBytes(NameOf(logical))));
    WriteAtomic(Path.Combine(stage, "Inhalt.bin"), VaultCrypto.SealRecord(secret, Purpose("file", logical), data, FileLimit(logical)));
    Directory.Move(stage, node);
   } finally { TryRemoveTransient(stage); }
  }
  static void CheckFileNode(string node) {
   foreach (var entry in Directory.EnumerateFileSystemEntries(node)) {
    CheckPath(entry);
    if (!File.Exists(entry) || (Path.GetFileName(entry) != "Name.bin" && Path.GetFileName(entry) != "Inhalt.bin" &&
        !Regex.IsMatch(Path.GetFileName(entry), "^\\.nb-[a-f0-9]{32}\\.tmp$"))) throw FormatError();
   }
  }
  static IEnumerable<VaultEntry> Enumerate(string root, byte[] secret, string logical) {
   var folder = DirectoryNode(root, secret, logical);
   if (logical.Length != 0 && !File.Exists(Location(root, secret, logical, true))) throw new DirectoryNotFoundException();
   CheckPath(folder);
   foreach (var child in Directory.EnumerateFileSystemEntries(folder)) {
    var node = Path.GetFileName(child);
    if (!Node.IsMatch(node)) continue;
    CheckPath(child);
    bool dir = node.StartsWith("d-", StringComparison.Ordinal);
    // Bind the entry label to its opaque physical slot. The computed slot
    // below confirms the parent/path identity after the label authenticates.
    var namePath = dir ? child : Path.Combine(child, "Name.bin");
    byte[] label = VaultCrypto.OpenRecord(secret, "name:" + node, ReadBounded(namePath, 1200));
    try {
     var name = VaultCrypto.Utf8.GetString(label);
     var logicalName = Child(logical, name);
     if (name.Contains("/") || Path.GetFileName(Location(root, secret, logicalName, dir)) != node) throw FormatError();
     if (dir) {
      var contentDir = DirectoryNode(root, secret, logicalName);
      CheckPath(contentDir);
      if (!Directory.Exists(contentDir)) throw FormatError();
      yield return new VaultEntry { Name = name, IsDirectory = true, LastModifiedUtc = File.GetLastWriteTimeUtc(child) };
     } else {
      var file = Path.Combine(child, "Inhalt.bin");
      CheckPath(file);
      var info = new FileInfo(file);
     if (!info.Exists || info.Length < VaultCrypto.RecordOverhead || info.Length > FileLimit(logicalName) + VaultCrypto.RecordOverhead) throw FormatError();
      yield return new VaultEntry { Name = name, Size = info.Length - VaultCrypto.RecordOverhead, LastModifiedUtc = info.LastWriteTimeUtc };
     }
    } finally { VaultCrypto.Clear(label); }
   }
  }

  public void Enable(string password, string recovery, string verification) {
   RequireTransitionAccess();
   if (Enabled) throw new InvalidOperationException("Der Passwortschutz ist schon eingeschaltet.");
   VaultCrypto.VerifyRecovery(recovery, verification);
   var source = OwnedPlainFiles();
   if (!source.Contains(MainName, StringComparer.OrdinalIgnoreCase)) throw new InvalidOperationException("Speichere zuerst einen Notenstand.");
   Migrate(password, recovery, source, true);
  }
  public void ChangePassword(string currentPassword, string currentRecovery, string password) {
   RequireTransitionAccess(); RequireUnlocked(); VerifyAccess(currentPassword, currentRecovery);
   if (Pending) throw FormatError();
   var next = VaultCrypto.ChangePassword(header, key, password);
   var check = VaultCrypto.UnlockHeader(next, password, null);
   try { if (!VaultCrypto.Equal(check, key)) throw FormatError(); }
   finally { VaultCrypto.Clear(check); }
   WriteAtomic(Path.Combine(physicalRoot, HeaderName), next);
   header = next;
  }
  public void Rotate(string currentPassword, string password, string recovery, string verification) {
   RequireTransitionAccess(); RequireUnlocked(); VerifyAccess(currentPassword, null);
   if (Pending) throw FormatError();
   VaultCrypto.VerifyRecovery(recovery, verification);
    if (!string.Equals(currentPassword, password, StringComparison.Ordinal)) VaultCrypto.ValidateNewPassword(password);
   Migrate(password, recovery, Walk(physicalRoot, key, "").ToArray(), false);
  }
  void Migrate(string password, string recovery, string[] logicalFiles, bool fromPlain) {
   if (fromPlain) VaultCrypto.ValidateNewPassword(password);
   string id = Guid.NewGuid().ToString("N");
   string staging = Path.Combine(dataRoot, ".schutz-" + id);
   string next = Path.Combine(dataRoot, "Geschuetzt-" + id);
   CheckPath(staging); CheckPath(next);
   var secret = VaultCrypto.Random(VaultCrypto.SecretBytes);
   var old = physicalRoot;
   bool committed = false;
   try {
    var nextHeader = VaultCrypto.CreateHeader(secret, password, recovery);
    Directory.CreateDirectory(Path.Combine(staging, "Dateien"));
    WriteAtomic(Path.Combine(staging, HeaderName), nextHeader);
    WriteAtomic(Path.Combine(staging, ProofName), VaultCrypto.SealRecord(secret, "proof", VaultCrypto.Utf8.GetBytes(Proof)));
    foreach (var logical in logicalFiles) {
      var source = fromPlain ? ReadBounded(PlainPath(logical), FileLimit(logical)) : Read(logical);
     byte[] reloaded = null;
     try {
      WriteFile(staging, secret, logical, source);
      reloaded = ReadFile(staging, secret, logical);
      if (!VaultCrypto.Equal(VaultCrypto.Hash(source), VaultCrypto.Hash(reloaded))) throw FormatError();
      var stamp = File.GetLastWriteTimeUtc(fromPlain ? PlainPath(logical) : Path.Combine(Location(old, key, logical, false), "Inhalt.bin"));
      File.SetLastWriteTimeUtc(Path.Combine(Location(staging, secret, logical, false), "Inhalt.bin"), stamp);
     } finally { VaultCrypto.Clear(source); VaultCrypto.Clear(reloaded); }
    }
    if (!Walk(staging, secret, "").OrderBy(x => x, StringComparer.Ordinal).SequenceEqual(logicalFiles.OrderBy(x => x, StringComparer.Ordinal))) throw FormatError();
    foreach (var unlock in new[] { false, true }) {
     var reopened = VaultCrypto.UnlockHeader(ReadBounded(Path.Combine(staging, HeaderName), VaultCrypto.HeaderBytes), unlock ? null : password, unlock ? recovery : null);
     try { VerifyProof(staging, reopened); if (!VaultCrypto.Equal(reopened, secret)) throw FormatError(); }
     finally { VaultCrypto.Clear(reopened); }
    }
     if (fromPlain) {
      EnsureBackupFolderOwnsFiles(logicalFiles);
      WriteJournal(staging, secret, EnableJournal, logicalFiles);
     }
    else WriteJournal(staging, secret, RotateJournal, new[] { Path.GetFileName(old) });
    Directory.Move(staging, next);
    boundary?.Invoke(fromPlain ? "enable-staged" : "rotate-staged");
    WriteAtomic(Path.Combine(dataRoot, MarkerName), VaultCrypto.Utf8.GetBytes(PointerHeader + Path.GetFileName(next)));
    committed = true;
    boundary?.Invoke(fromPlain ? "enable-published" : "rotate-published");
    Lock(); physicalRoot = next; key = secret; header = nextHeader; secret = null;
    CompletePending();
   } finally {
    VaultCrypto.Clear(secret);
    if (!committed) { TryRemoveTransient(staging); TryRemoveTransient(next); }
   }
  }
  public void Disable(string password, string recovery) {
   RequireTransitionAccess(); RequireUnlocked(); VerifyAccess(password, recovery);
   if (Pending) throw FormatError();
   var stage = Path.Combine(physicalRoot, PlainStage);
   if (File.Exists(stage) || Directory.Exists(stage)) throw Collision(PlainStage);
   var paths = Walk(physicalRoot, key, "").Where(p => !InBackupFolder(p) || IsBackupIndex(p)).ToArray();
   foreach (var logical in paths) {
    var target = PlainPath(logical);
    if (File.Exists(target)) {
     var source = Read(logical);
     try { if (!HashesEqual(target, source)) throw Collision(logical); }
     finally { VaultCrypto.Clear(source); }
    } else if (Directory.Exists(target) && !IsBlocker(target)) throw Collision(logical);
   }
   WriteJournal(physicalRoot, key, DisableJournal, paths);
   boundary?.Invoke("disable-journal");
   CompletePending();
  }
  public void CompletePending() {
   RequireTransitionAccess(); RequireUnlocked();
   var enable = Path.Combine(physicalRoot, EnableJournal);
   var disable = Path.Combine(physicalRoot, DisableJournal);
   var rotate = Path.Combine(physicalRoot, RotateJournal);
   if (new[] { enable, disable, rotate }.Count(File.Exists) > 1) throw FormatError();
   if (File.Exists(enable)) {
    var paths = ReadJournal(physicalRoot, key, EnableJournal);
    if (pointerMissing) {
     // A loss of power between publishing the verified generation and writing
     // its pointer can be resumed after the wrapped key has been authenticated.
     WriteAtomic(Path.Combine(dataRoot, MarkerName), VaultCrypto.Utf8.GetBytes(PointerHeader + Path.GetFileName(physicalRoot)));
     pointerMissing = false;
    }
    foreach (var logical in paths) {
     var path = PlainPath(logical);
     if (File.Exists(path)) {
      var source = Read(logical);
       try { if (!HashesEqual(path, source, FileLimit(logical))) throw Collision(logical); File.Delete(path); boundary?.Invoke("enable-delete"); }
      finally { VaultCrypto.Clear(source); }
     }
    }
     RemoveEmptySourceFolders(paths);
    var blocker = PlainPath(MainName);
    if (File.Exists(blocker)) throw Collision(MainName);
    if (!Directory.Exists(blocker)) Directory.CreateDirectory(blocker);
    if (!IsBlocker(blocker)) {
     if (Directory.EnumerateFileSystemEntries(blocker).Any()) throw Collision(MainName);
     WriteAtomic(Path.Combine(blocker, "Geschuetzt.txt"), VaultCrypto.Utf8.GetBytes(BlockerText));
    }
    var legacyBackups = PlainPath(BackupFolder);
    if (Directory.Exists(legacyBackups) && !Directory.EnumerateFileSystemEntries(legacyBackups).Any()) Directory.Delete(legacyBackups);
    if (!Directory.Exists(legacyBackups) && !File.Exists(legacyBackups)) WriteAtomic(legacyBackups, VaultCrypto.Utf8.GetBytes(BlockerText));
     if (!IsBackupBlocker(legacyBackups)) {
      var leftover = Directory.Exists(legacyBackups) ? Directory.EnumerateFileSystemEntries(legacyBackups).FirstOrDefault() : null;
      throw BackupConflict(leftover == null ? BackupFolder : Child(BackupFolder, Path.GetFileName(leftover)));
     }
    File.Delete(enable);
   }
   if (File.Exists(rotate)) {
    var prior = ReadJournal(physicalRoot, key, RotateJournal);
    if (prior.Length != 1 || !Generation.IsMatch(prior[0]) || prior[0] == Path.GetFileName(physicalRoot)) throw FormatError();
    var previous = Path.Combine(dataRoot, prior[0]);
    CheckPath(previous);
    if (Directory.Exists(previous)) RetireGeneration(previous);
    File.Delete(rotate);
   }
   if (File.Exists(disable)) {
    var legacyBackups = PlainPath(BackupFolder);
    if (IsBackupBlocker(legacyBackups)) File.Delete(legacyBackups);
    Directory.CreateDirectory(legacyBackups);
    foreach (var logical in ReadJournal(physicalRoot, key, DisableJournal).OrderBy(x => x == MainName ? 1 : 0)) {
     var target = PlainPath(logical);
     var source = Read(logical);
     try {
      if (File.Exists(target)) { if (!HashesEqual(target, source)) throw Collision(logical); continue; }
      if (Directory.Exists(target)) {
       if (!IsBlocker(target) && (logical != MainName || Directory.EnumerateFileSystemEntries(target).Any())) throw Collision(logical);
       var blockerFile = Path.Combine(target, "Geschuetzt.txt");
       if (File.Exists(blockerFile)) File.Delete(blockerFile);
       Directory.Delete(target);
      }
       WriteDisableFile(target, source);
      boundary?.Invoke("disable-write");
     } finally { VaultCrypto.Clear(source); }
    }
    var backups = new HashSet<string>(Walk(physicalRoot, key, "").Where(p => InBackupFolder(p) && !IsBackupIndex(p)), StringComparer.OrdinalIgnoreCase);
    foreach (var logical in backups) RestoreProtectedBackup(logical, backups);
    ArchiveRetiredGenerations();
    CheckOwnedGeneration(physicalRoot);
    string main = PlainPath(MainName);
    var written = ReadBounded(main, MaxPayload);
    try { if (ReadStoredBackupJson(written, MainName) == null) throw FormatError(); }
    finally { VaultCrypto.Clear(written); }
    var digest = FileDigest(main);
    var generation = Path.GetFileName(physicalRoot);
    WriteDisableFile(Path.Combine(dataRoot, MarkerName), VaultCrypto.Utf8.GetBytes(CleanupHeader + generation + "\n" + digest), replace: true);
    plainHash = digest; cleanup = generation;
    Lock(); physicalRoot = null;
    boundary?.Invoke("disable-retired");
    FinishPlainCleanup();
   }
  }
  void WriteDisableFile(string path, byte[] bytes, bool replace = false) {
   CheckPath(path);
   var stage = Path.Combine(physicalRoot, PlainStage);
   CheckPath(stage);
   // The active generation's authenticated disable journal owns this slot
   // until the verified clear-text state is committed.
   File.Delete(stage);
   Directory.CreateDirectory(Path.GetDirectoryName(path));
   using (var stream = new FileStream(stage, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough)) {
    stream.Write(bytes, 0, bytes.Length);
    stream.Flush(true);
   }
   if (!HashesEqual(stage, bytes, MaxEnvelope)) throw FormatError();
   CheckPath(path);
   if (replace) File.Replace(stage, path, null);
   else File.Move(stage, path);
   if (!HashesEqual(path, bytes, MaxEnvelope)) throw FormatError();
  }
  static string FileDigest(string path) {
   CheckPath(path);
   using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
   using (var digest = SHA256.Create()) return BitConverter.ToString(digest.ComputeHash(stream)).Replace("-", "");
  }
  internal void FinishPlainCleanup() {
   if (cleanup == null) {
    if (!Enabled && File.Exists(PlainPath(MainName))) ArchiveRetiredGenerations();
    return;
   }
   if (FileDigest(PlainPath(MainName)) != plainHash) throw Collision(MainName);
   var path = Path.Combine(dataRoot, cleanup);
   if (Directory.Exists(path)) RemoveOwnedGeneration(path);
   boundary?.Invoke("disable-cleaned");
   File.Delete(Path.Combine(dataRoot, MarkerName));
   cleanup = plainHash = null;
  }
  void ArchiveRetiredGenerations() {
   if (!Directory.Exists(dataRoot)) return;
   foreach (var path in Directory.EnumerateDirectories(dataRoot).Where(p => p != physicalRoot).ToArray()) {
    var name = Path.GetFileName(path);
    if (ProtectionStage.IsMatch(name)) {
     if (File.Exists(Path.Combine(path, HeaderName)) && File.Exists(Path.Combine(path, ProofName))) {
      CheckOwnedGeneration(path);
      RemoveOwnedGeneration(path);
     }
     continue;
    }
    if (!Generation.IsMatch(name)) continue;
    var retired = Path.Combine(path, RetiredMarker);
    var archive = PlainPath(BackupFolder + "/" + ArchivePrefix + name.Substring("Geschuetzt-".Length) + ".zip");
    if (File.Exists(retired)) {
     if (VaultCrypto.Utf8.GetString(ReadBounded(retired, 512)) != RetiredText) throw Collision(name + "/" + RetiredMarker);
    } else if (!File.Exists(archive)) continue;
    CheckOwnedGeneration(path);
    SaveHistoryArchive(path, archive);
    RemoveOwnedGeneration(path);
   }
  }
  static IEnumerable<string> ArchiveFiles(string root) => Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
   .Select(path => path.Substring(root.Length + 1).Replace(Path.DirectorySeparatorChar, '/'))
   .Where(IsArchiveEntry).OrderBy(path => path, StringComparer.Ordinal);
  static bool IsArchiveEntry(string path) {
   var parts = path.Split('/');
   if (parts.Length == 1) return path == HeaderName || path == ProofName;
   if (parts[0] != "Dateien" && !OpaqueDirectory.IsMatch(parts[0])) return false;
   if (!Node.IsMatch(parts[1])) return false;
   return parts.Length == 2 && parts[1].StartsWith("d-", StringComparison.Ordinal) ||
    parts.Length == 3 && parts[1].StartsWith("f-", StringComparison.Ordinal) && (parts[2] == "Name.bin" || parts[2] == "Inhalt.bin");
  }
  internal static bool IsHistoryArchiveName(string name) =>
   Regex.IsMatch(Path.GetFileName(name), "^" + ArchivePrefix + "[a-f0-9]{32}\\.zip$");
  static bool IsHistoryArchive(string logical, byte[] bytes) {
   if (!IsHistoryArchiveName(logical)) return false;
   using (var input = new MemoryStream(bytes, false))
   using (var zip = new ZipArchive(input, ZipArchiveMode.Read)) CheckHistoryArchive(zip);
   return true;
  }
  static void CheckHistoryArchive(ZipArchive zip) {
   if (zip.Entries.Count > 300000) throw FormatError();
   var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   foreach (var entry in zip.Entries) {
    if (!IsArchiveEntry(entry.FullName) || !seen.Add(entry.FullName) || entry.Length > MaxEnvelope + VaultCrypto.RecordOverhead) throw FormatError();
    using (var input = entry.Open())
     foreach (var c in entry.FullName == HeaderName ? "NBKEY001" : "NBREC001")
      if (input.ReadByte() != c) throw FormatError();
   }
   if (!seen.Contains(HeaderName) || !seen.Contains(ProofName) || !seen.Any(x => x.StartsWith("Dateien/", StringComparison.Ordinal))) throw FormatError();
  }
  static void SaveHistoryArchive(string root, string target) {
   CheckPath(target);
   var files = ArchiveFiles(root).ToArray();
   if (!File.Exists(target)) {
    if (Directory.Exists(target)) throw Collision(Path.GetFileName(target));
    Directory.CreateDirectory(Path.GetDirectoryName(target));
    string temporary = Path.Combine(root, ArchiveStage);
    string claim = Path.Combine(root, ArchiveClaim);
    CheckPath(temporary);
    try {
     var ownership = VaultCrypto.Utf8.GetBytes("Notenblick Archiv 1\n" + Path.GetFileName(target));
     if (File.Exists(claim)) {
      if (!HashesEqual(claim, ownership, 256)) throw Collision(ArchiveClaim);
      File.Delete(temporary);
     } else {
      if (File.Exists(temporary) || Directory.Exists(temporary)) throw Collision(ArchiveStage);
      WriteAtomic(claim, ownership);
     }
     using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None, 65536, FileOptions.WriteThrough)) {
      using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, true)) {
       foreach (var name in files) {
        using (var input = new FileStream(Path.Combine(root, name), FileMode.Open, FileAccess.Read, FileShare.Read))
        using (var output = zip.CreateEntry(name, CompressionLevel.NoCompression).Open()) input.CopyTo(output);
       }
      }
      stream.Flush(true);
     }
     VerifyHistoryArchive(root, temporary, files);
     File.Move(temporary, target);
    } catch (Exception error) when (error is InvalidDataException || error is IOException || error is UnauthorizedAccessException) {
     throw new IOException("Das geschützte Archiv „" + Path.GetFileName(target) + "“ konnte nicht fertiggestellt werden. Prüfe den Ordner Sicherungen und versuch es erneut.", error);
    }
   }
   VerifyHistoryArchive(root, target, files);
  }
  static void VerifyHistoryArchive(string root, string path, string[] files) {
   using (var stream = File.OpenRead(path))
   using (var zip = new ZipArchive(stream, ZipArchiveMode.Read))
   using (var digest = SHA256.Create()) {
    CheckHistoryArchive(zip);
    foreach (var name in files) {
     var entry = zip.GetEntry(name);
     if (entry == null) throw FormatError();
     using (var input = entry.Open())
      if (BitConverter.ToString(digest.ComputeHash(input)).Replace("-", "") != FileDigest(Path.Combine(root, name)))
       throw Collision(Path.GetFileName(path));
    }
   }
  }
  internal static void ExtractHistoryArchive(string archive, string target) {
   CheckPath(archive);
   CheckPath(target);
   using (var stream = File.OpenRead(archive))
   using (var zip = new ZipArchive(stream, ZipArchiveMode.Read)) {
    CheckHistoryArchive(zip);
    long size = 0;
    foreach (var entry in zip.Entries) {
     size += entry.Length;
     if (size > 16L * 1024 * 1024 * 1024 || entry.Length > stream.Length) throw FormatError();
    }
    foreach (var entry in zip.Entries) {
     var path = Path.Combine(target, entry.FullName);
     CheckPath(path);
     Directory.CreateDirectory(Path.GetDirectoryName(path));
     using (var input = entry.Open())
     using (var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
      var buffer = new byte[65536];
      long remaining = entry.Length;
      while (remaining > 0) {
       var amount = input.Read(buffer, 0, (int)Math.Min(remaining, buffer.Length));
       if (amount == 0) throw FormatError();
       output.Write(buffer, 0, amount);
       remaining -= amount;
      }
      if (input.ReadByte() != -1) throw FormatError();
     }
    }
   }
  }
  void RestoreProtectedBackup(string logical, HashSet<string> existingNames) {
   var source = Read(logical);
   byte[] protectedCopy = null, verified = null;
   try {
    // Existing protected backups can have their own password and key.
    bool independentlyProtected = VaultCrypto.IsProtected(source) || IsHistoryArchive(logical, source);
    string output = logical;
    if (!independentlyProtected) do { output += ".nbx"; } while (existingNames.Contains(output));
    string target = PlainPath(output);
    if (File.Exists(target)) {
     if (independentlyProtected) {
      if (!HashesEqual(target, source, FileLimit(logical))) throw Collision(logical);
     } else {
      try { verified = ImportBackup(ReadBounded(target, MaxEnvelope), null, null); }
      catch (Exception error) when (error is InvalidDataException || error is VaultAccessException) { throw Collision(logical); }
      if (!VaultCrypto.Equal(verified, source)) throw Collision(logical);
     }
     return;
    }
    if (Directory.Exists(target)) throw Collision(logical);
    protectedCopy = independentlyProtected ? source : Backup(source);
    WriteDisableFile(target, protectedCopy);
    File.SetLastWriteTimeUtc(target, File.GetLastWriteTimeUtc(Path.Combine(Location(physicalRoot, key, logical, false), "Inhalt.bin")));
    if (!independentlyProtected) {
     verified = ImportBackup(ReadBounded(target, MaxEnvelope), null, null);
     if (!VaultCrypto.Equal(verified, source)) throw Collision(logical);
    }
    boundary?.Invoke("disable-backup");
   } finally {
    VaultCrypto.Clear(source);
    VaultCrypto.Clear(protectedCopy);
    VaultCrypto.Clear(verified);
   }
  }
  void RemoveEmptySourceFolders(string[] files) {
   var dirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   foreach (var name in files.Where(n => n.StartsWith("Notenlisten/", StringComparison.OrdinalIgnoreCase) || InBackupFolder(n)))
    for (var parent = ParentOf(name); parent.Length != 0; parent = ParentOf(parent)) dirs.Add(parent);
   foreach (var dir in dirs.OrderByDescending(x => x.Length)) {
    var path = PlainPath(dir);
    if (Directory.Exists(path) && !Directory.EnumerateFileSystemEntries(path).Any()) Directory.Delete(path);
   }
  }
  static bool IsBlocker(string path) {
   if (!Directory.Exists(path) || !string.Equals(Path.GetFileName(path), MainName, StringComparison.OrdinalIgnoreCase)) return false;
   var name = Path.Combine(path, "Geschuetzt.txt");
   CheckPath(name);
   return File.Exists(name) && Directory.EnumerateFileSystemEntries(path).Count() == 1 &&
    VaultCrypto.Utf8.GetString(ReadBounded(name, 512)) == BlockerText;
  }
  static bool IsBackupBlocker(string path) {
   if (!File.Exists(path) || !string.Equals(Path.GetFileName(path), BackupFolder, StringComparison.OrdinalIgnoreCase)) return false;
   CheckPath(path);
   return new FileInfo(path).Length < 512 && VaultCrypto.Utf8.GetString(ReadBounded(path, 512)) == BlockerText;
  }
  // The 1.27 reader looks for a legacy installation next to this one and
  // would write an unencrypted migration archive before attempting its main
  // write. A regular file occupies that exact legacy directory after activation.
   void EnsureBackupFolderOwnsFiles(string[] known) {
    var expected = new HashSet<string>(known.Where(InBackupFolder), StringComparer.OrdinalIgnoreCase);
    foreach (var logical in PlainBackupFiles())
     if (!expected.Remove(logical)) throw BackupConflict(logical);
    if (expected.Count != 0) throw BackupConflict(expected.First());
   }
   static IOException BackupConflict(string path) => new IOException("Der Eintrag „" + path.Replace('/', '\\') + "“ passt nicht zur Umstellung. Bewahre ihn außerhalb des Ordners „Daten“ auf und versuche es erneut.");
   internal static bool InBackupFolder(string path) => path.StartsWith(BackupFolder + "/", StringComparison.OrdinalIgnoreCase);
  internal static bool IsBackupIndex(string path) => path.Equals("Sicherungen/Notenlistenverzeichnis.json", StringComparison.OrdinalIgnoreCase) || path.Equals("Sicherungen/Aufbewahrung.json", StringComparison.OrdinalIgnoreCase);
  static bool HashesEqual(string path, byte[] bytes, int maximum = MaxPayload) {
   var existing = ReadBounded(path, maximum);
   try { return VaultCrypto.Equal(VaultCrypto.Hash(existing), VaultCrypto.Hash(bytes)); }
   finally { VaultCrypto.Clear(existing); }
  }
  static void WriteJournal(string root, byte[] secret, string journal, string[] paths) {
   var plain = VaultCrypto.Utf8.GetBytes(new JArray(paths).ToString(Newtonsoft.Json.Formatting.None));
   try {
    if (plain.Length > 32 * 1024 * 1024 - VaultCrypto.RecordOverhead) throw new IOException("Der Bestand enthält zu viele Dateien für die Umstellung.");
    WriteAtomic(Path.Combine(root, journal), VaultCrypto.SealRecord(secret, journal, plain));
   } finally { VaultCrypto.Clear(plain); }
  }
  static string[] ReadJournal(string root, byte[] secret, string journal) {
   var plain = VaultCrypto.OpenRecord(secret, journal, ReadBounded(Path.Combine(root, journal), 32 * 1024 * 1024));
   try { return JArray.Parse(VaultCrypto.Utf8.GetString(plain)).Values<string>().Select(Validate).ToArray(); }
   finally { VaultCrypto.Clear(plain); }
  }
  static IEnumerable<string> Walk(string root, byte[] secret, string parent) {
   foreach (var entry in Enumerate(root, secret, parent)) {
    var logical = Child(parent, entry.Name);
    if (entry.IsDirectory) foreach (var nested in Walk(root, secret, logical)) yield return nested;
    else yield return logical;
   }
  }
  string[] OwnedPlainFiles() {
   var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach (var direct in new[] { MainName, "Ansicht.json" })
    if (File.Exists(PlainPath(direct))) paths.Add(direct);
    foreach (var logical in PlainBackupFiles())
     if (!RecognizedBackup(logical)) throw BackupConflict(logical);
     else if (!paths.Add(logical)) throw Collision(logical);
   var manifest = PlainPath("Sicherungen/Notenlistenverzeichnis.json");
   if (File.Exists(manifest)) {
    var bytes = ReadBounded(manifest, 32 * 1024 * 1024);
    try {
     var data = JObject.Parse(VaultCrypto.Utf8.GetString(bytes).TrimStart('\ufeff'));
     var hashes = data["hashes"] as JObject;
     var files = data["files"] as JArray;
     var retained = data["retained"] as JArray;
     if (hashes != null && files != null) foreach (string name in files.Values<string>().Concat(retained?.Values<string>() ?? Enumerable.Empty<string>())) {
      if (name == null || !name.EndsWith(".txt", StringComparison.OrdinalIgnoreCase) || !Regex.IsMatch((string)hashes[name] ?? "", "^[a-fA-F0-9]{64}$")) continue;
      var logical = "Notenlisten/" + name;
      string file;
      try { file = PlainPath(logical); } catch (InvalidDataException) { continue; }
      if (!File.Exists(file)) continue;
      var content = ReadBounded(file, MaxPayload);
      try {
       var normal = content.Length >= 3 && content[0] == 0xef && content[1] == 0xbb && content[2] == 0xbf ? VaultCrypto.Slice(content, 3, content.Length - 3) : content;
       try { if (string.Equals(Hex(VaultCrypto.Hash(normal)), (string)hashes[name], StringComparison.OrdinalIgnoreCase)) paths.Add(logical); }
       finally { if (!ReferenceEquals(normal, content)) VaultCrypto.Clear(normal); }
      }
      finally { VaultCrypto.Clear(content); }
     }
    } catch (Newtonsoft.Json.JsonException) { /* Unverifiable files stay on disk. */ }
    finally { VaultCrypto.Clear(bytes); }
   }
   return paths.OrderBy(x => x, StringComparer.Ordinal).ToArray();
  }
   IEnumerable<string> PlainBackupFiles(string logical = BackupFolder) {
    var folder = PlainPath(logical);
    if (File.Exists(folder)) throw BackupConflict(logical);
    if (!Directory.Exists(folder)) return Array.Empty<string>();
    return BackupChildren(logical, folder).ToArray();
   }
   IEnumerable<string> BackupChildren(string logical, string folder) {
    bool found = false;
    foreach (var entry in Directory.EnumerateFileSystemEntries(folder)) {
     var child = Child(logical, Path.GetFileName(entry));
     try { PlainPath(child); }
     catch (Exception error) when (error is IOException || error is InvalidDataException) { throw BackupConflict(child); }
     found = true;
     if (Directory.Exists(entry)) foreach (var nested in BackupChildren(child, entry)) yield return nested;
     else yield return child;
    }
    if (!found && logical != BackupFolder) throw BackupConflict(logical);
   }
   bool RecognizedBackup(string logical) {
    if (IsBackupIndex(logical) || GeneratedBackup.IsMatch(NameOf(logical))) return true;
    string path = PlainPath(logical), extension = Path.GetExtension(path).ToLowerInvariant();
    if (!new[] { ".json", ".nbk", ".nbx", ".zip" }.Contains(extension)) return false;
    using (var input = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read)) {
     if (input.Length > MaxEnvelope) return false;
     var prefix = new byte[8];
     if (input.Read(prefix, 0, prefix.Length) == prefix.Length && VaultCrypto.IsProtected(prefix)) return true;
     input.Position = 0;
    if (extension == ".zip") {
      try {
       using (var zip = new ZipArchive(input, ZipArchiveMode.Read, true)) {
        if (IsHistoryArchiveName(logical)) { CheckHistoryArchive(zip); return true; }
        using (var data = BackupZipMain(zip).Open()) return SnapshotData(ReadBackupJson(data)) != null;
       }
      } catch (InvalidDataException) { return false; }
     }
     return SnapshotData(ReadBackupJson(input)) != null;
    }
   }
   internal static ZipArchiveEntry BackupZipMain(ZipArchive zip) {
    if (zip.Entries.Count > 100000) throw new InvalidDataException("Die Sicherung enthält zu viele Dateien.");
    var main = zip.GetEntry("Daten/" + MainName) ?? zip.GetEntry(MainName);
    if (main == null || main.Length > MaxPayload) throw new InvalidDataException("Die Noten in der Sicherung fehlen oder sind zu groß.");
    return main;
   }
  internal static bool IsZip(byte[] bytes) =>
   bytes.Length >= 4 && bytes[0] == 'P' && bytes[1] == 'K' && bytes[2] == 3 && bytes[3] == 4;
  internal static JObject ReadPortableZipSnapshot(byte[] bytes) {
   if (!IsZip(bytes)) return null;
   using (var input = new MemoryStream(bytes, false))
   using (var zip = new ZipArchive(input, ZipArchiveMode.Read)) {
    var main = BackupZipMain(zip);
    JObject payload;
    using (var stream = main.Open()) payload = ReadBackupJson(stream);
    var data = SnapshotData(payload);
    if (data == null) throw FormatError();
    var prefix = main.FullName.StartsWith("Daten/", StringComparison.Ordinal) ? "Daten/" : "";
    var lists = payload["lists"] as JArray ?? data["notfallListen"] as JArray ?? new JArray();
    var names = new HashSet<string>(lists.Select(item => (string)item["path"]), StringComparer.OrdinalIgnoreCase);
    long size = 0;
    foreach (var item in zip.Entries) {
     if (!item.FullName.StartsWith(prefix + "Notenlisten/", StringComparison.Ordinal) ||
         !item.FullName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)) continue;
     var path = Validate(item.FullName.Substring(prefix.Length));
     if (!names.Add(path)) continue;
     size += item.Length;
     if (size > MaxPayload || item.Length > bytes.Length) throw FormatError();
     using (var reader = new StreamReader(item.Open(), VaultCrypto.Utf8))
      lists.Add(new JObject { ["path"] = path, ["text"] = reader.ReadToEnd() });
    }
    var snapshot = (JObject)data.DeepClone();
    snapshot["notfallListen"] = lists.DeepClone();
    return snapshot;
   }
  }
  internal static JObject ReadStoredBackupJson(byte[] bytes, string name) {
   using (var input = new MemoryStream(bytes, false)) {
    if (!name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) return ReadBackupJson(input);
    try {
     using (var zip = new ZipArchive(input, ZipArchiveMode.Read))
     using (var data = BackupZipMain(zip).Open()) return ReadBackupJson(data);
    } catch (InvalidDataException) { return null; }
   }
  }
   static JObject ReadBackupJson(Stream input) {
    try {
     using (var text = new StreamReader(input, VaultCrypto.Utf8, true, 1024, true))
     using (var json = new JsonTextReader(text) { MaxDepth = 128, DateParseHandling = DateParseHandling.None }) {
      if (!json.Read() || json.TokenType != JsonToken.StartObject) return null;
      var data = JObject.Load(json, new JsonLoadSettings { DuplicatePropertyNameHandling = DuplicatePropertyNameHandling.Error });
      return json.Read() ? null : data;
     }
    } catch (Exception error) when (error is JsonException || error is DecoderFallbackException) { return null; }
   }
   internal static JObject SnapshotData(JObject payload) {
    var data = payload;
    if (payload?["data"] != null) {
     if (!IntegerOne(payload["version"]) || !(payload["lists"] is JArray)) return null;
     data = payload["data"] as JObject;
    }
    return data?["format"]?.Type == JTokenType.String && (string)data["format"] == "notenraum" &&
           IntegerOne(data["version"]) &&
           data["commitId"]?.Type == JTokenType.String &&
           SnapshotCollections.All(name => data[name] is JArray) ? data : null;
  }
  static bool IntegerOne(JToken token) => token?.Type == JTokenType.Integer && token.ToString(Formatting.None) == "1";
  public string[] Unprotected() {
   if (!Enabled || Locked || detached) return new string[0];
   return PlainLeftovers(dataRoot, "", 0).Take(100).ToArray();
  }
  IEnumerable<string> PlainLeftovers(string folder, string parent, int depth) {
   if (depth > 16) { yield return parent; yield break; }
   foreach (var item in Directory.EnumerateFileSystemEntries(folder)) {
    var name = Path.GetFileName(item);
    var path = Child(parent, name);
    if (depth == 0 && (name == "InBenutzung.lock" || name == MarkerName || name == "Notfallhilfe.txt" || Generation.IsMatch(name) || name.StartsWith(".schutz-", StringComparison.Ordinal) || IsBlocker(item) || IsBackupBlocker(item))) continue;
    if (Directory.Exists(item) && (File.GetAttributes(item) & FileAttributes.ReparsePoint) == 0) {
     bool found = false;
     foreach (var nested in PlainLeftovers(item, path, depth + 1)) { found = true; yield return nested; }
     if (!found) yield return path;
    } else yield return path;
   }
  }
  string PlainPath(string logical) {
   var path = Path.GetFullPath(Path.Combine(dataRoot, Validate(logical).Replace('/', Path.DirectorySeparatorChar)));
   if (!path.StartsWith(dataRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw FormatError();
   CheckPath(path);
   return path;
  }

  static void RetireGeneration(string old) {
   RemoveOwnedGeneration(old);
  }
  static void RemoveOwnedGeneration(string path) {
   CheckOwnedGeneration(path);
   // Remove the retirement record last so an interrupted archive cleanup is
   // discoverable even after some of the encrypted contents are gone.
   foreach (var entry in Directory.EnumerateFileSystemEntries(path).ToArray()) {
    if (Path.GetFileName(entry) == RetiredMarker) continue;
    if (Directory.Exists(entry)) Directory.Delete(entry, true);
    else File.Delete(entry);
   }
   File.Delete(Path.Combine(path, RetiredMarker));
   Directory.Delete(path);
  }
  static void CheckOwnedGeneration(string old) {
   // This is an older application-created generation. If the exact expected
   // structure has been altered, preserve it for inspection instead of deleting it.
   CheckPath(old);
   foreach (var entry in Directory.EnumerateFileSystemEntries(old)) {
    var name = Path.GetFileName(entry);
    CheckPath(entry);
    if (Directory.Exists(entry)) {
     if (name != "Dateien" && !OpaqueDirectory.IsMatch(name)) throw Collision(Path.GetFileName(old) + "/" + name);
     foreach (var child in Directory.EnumerateFileSystemEntries(entry)) {
      var childName = Path.GetFileName(child);
      CheckPath(child);
      if (!Node.IsMatch(childName) || Directory.Exists(child) != childName.StartsWith("f-", StringComparison.Ordinal))
       throw Collision(Path.GetFileName(old) + "/" + name + "/" + childName);
      if (Directory.Exists(child)) CheckFileNode(child);
     }
    } else if (name != HeaderName && name != ProofName && name != RetiredMarker && name != EnableJournal && name != RotateJournal && name != DisableJournal &&
               name != PlainStage && name != ArchiveStage && name != ArchiveClaim &&
               !Regex.IsMatch(name, "^\\.nb-[a-f0-9]{32}\\.tmp$")) throw Collision(Path.GetFileName(old) + "/" + name);
   }
  }
  static void TryRemoveTransient(string path) {
   if (!Directory.Exists(path)) return;
   try { SafeTree(path); Directory.Delete(path, true); }
   catch (IOException) { /* Committed source remains valid. */ }
   catch (UnauthorizedAccessException) { }
  }
  static void SafeTree(string path) {
   CheckPath(path);
   foreach (var entry in Directory.EnumerateFileSystemEntries(path)) {
    CheckPath(entry);
    if (Directory.Exists(entry)) SafeTree(entry);
   }
  }
  internal static void CheckPath(string path) {
   var full = Path.GetFullPath(path); var current = Path.GetPathRoot(full);
   foreach (var part in full.Substring(current.Length).Split(Path.DirectorySeparatorChar)) {
    if (part.Length == 0) continue;
    current = Path.Combine(current, part);
    try {
     if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new IOException("Verknüpfte Dateien oder Ordner werden nicht verwendet.");
    } catch (FileNotFoundException) {} catch (DirectoryNotFoundException) {}
   }
  }
  internal static byte[] ReadBounded(string path, int maximum) {
   CheckPath(path);
   using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read)) {
    if (stream.Length > maximum) throw new IOException("Die Datei ist zu groß.");
    var data = new byte[(int)stream.Length];
    int offset = 0;
    while (offset < data.Length) {
     int n = stream.Read(data, offset, data.Length - offset);
     if (n == 0) throw FormatError();
     offset += n;
    }
    if (stream.ReadByte() != -1) throw FormatError();
    return data;
   }
  }
  internal static void WriteAtomic(string path, byte[] data) {
   CheckPath(path);
   var parent = Path.GetDirectoryName(path);
   Directory.CreateDirectory(parent);
   var stage = Path.Combine(parent, ".nb-" + Guid.NewGuid().ToString("N") + ".tmp");
   try {
    using (var stream = new FileStream(stage, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, FileOptions.WriteThrough)) { stream.Write(data, 0, data.Length); stream.Flush(true); }
    var check = ReadBounded(stage, MaxEnvelope + VaultCrypto.RecordOverhead);
    try { if (!VaultCrypto.Equal(VaultCrypto.Hash(check), VaultCrypto.Hash(data))) throw FormatError(); }
    finally { VaultCrypto.Clear(check); }
    CheckPath(path);
    if (File.Exists(path)) File.Replace(stage, path, null);
    else File.Move(stage, path);
   } finally { if (File.Exists(stage)) File.Delete(stage); }
  }
 }
}
