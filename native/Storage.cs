using System;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public sealed class Storage : IDisposable {
  public const long MaxBytes=256L*1024*1024;
  public readonly string Root;readonly string program;readonly Migration migration;readonly VaultStore vault;
  public bool VaultEnabled => vault.Enabled;
  public bool VaultLocked => vault.Locked;
  public void Dispose() => vault.Dispose();
  public Storage(string programDirectory) : this(programDirectory,null) {}
  internal Storage(string programDirectory,Action<string> transitionBoundary){program=Path.GetFullPath(programDirectory);Root=Path.Combine(program,"Daten");try{Directory.CreateDirectory(Root);}catch(UnauthorizedAccessException){throw new IOException("Der Notenblick-Ordner ist nicht beschreibbar. Bitte verschiebe den vollständigen Ordner an einen Ort, an dem du Dateien speichern darfst.");}CheckPath(Root);migration=new Migration(program,Root);vault=new VaultStore(Root,transitionBoundary);}
  public static void CheckPath(string path){var full=Path.GetFullPath(path);var current=Path.GetPathRoot(full);foreach(var part in full.Substring(current.Length).Split(Path.DirectorySeparatorChar)){if(part.Length==0)continue;current=Path.Combine(current,part);if(File.Exists(current)||Directory.Exists(current))if((File.GetAttributes(current)&FileAttributes.ReparsePoint)!=0)throw new IOException("Verknüpfte Ordner werden für die Datenablage nicht verwendet.");}}
  public static void CheckSize(string p){if(new FileInfo(p).Length>MaxBytes)throw new IOException("Diese Datei ist größer als 256 MB. Bitte bewahre sie unverändert auf.");}
  public void VerifyWritable(){var p=Path.Combine(Root,".notenblick-Schreibpruefung-"+Guid.NewGuid().ToString("N"));try{using(var f=new FileStream(p,FileMode.CreateNew,FileAccess.Write,FileShare.None)){f.WriteByte(1);f.Flush(true);}}catch(Exception e){throw new IOException("Der Ordner Daten ist nicht beschreibbar. Bitte verschiebe den vollständigen Notenblick-Ordner an einen Ort, an dem du Dateien speichern darfst. "+e.Message);}finally{if(File.Exists(p))File.Delete(p);}}
  string Resolve(string value,bool rootAllowed=false){
   if(value==null||value.Length>2000)throw new ArgumentException("Ungültiger Dateiname.");if(value.Length==0){if(rootAllowed)return Root;throw new ArgumentException("Bitte einen Dateinamen angeben.");}
   if(value.Contains("\\")||value.StartsWith("/")||value.IndexOfAny(new[]{':','\0','\r','\n'})>=0)throw new ArgumentException("Ungültiger Dateipfad.");
   var parts=value.Split('/');if(parts.Any(x=>x.Length==0||x=="."||x==".."||x.TrimEnd(' ','.')!=x||x.IndexOfAny(Path.GetInvalidFileNameChars())>=0))throw new ArgumentException("Ungültiger Dateipfad.");
   var full=Path.GetFullPath(Path.Combine(Root,Path.Combine(parts)));if(!full.StartsWith(Root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new ArgumentException("Die Datei liegt außerhalb des Datenordners.");CheckPath(full);return full;
  }
  public static void AtomicBytes(string path,byte[] bytes){
   if(bytes==null||bytes.LongLength>MaxBytes)throw new ArgumentException("Die Datei ist größer als 256 MB.");CheckPath(path);var parent=Path.GetDirectoryName(path);Directory.CreateDirectory(parent);var temp=Path.Combine(parent,".notenblick-"+Guid.NewGuid().ToString("N")+".tmp");
   try{using(var stream=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None,65536,FileOptions.WriteThrough)){stream.Write(bytes,0,bytes.Length);stream.Flush(true);}string expected;using(var digest=System.Security.Cryptography.SHA256.Create())expected=Convert.ToBase64String(digest.ComputeHash(bytes));using(var sha=System.Security.Cryptography.SHA256.Create())using(var file=File.OpenRead(temp))if(Convert.ToBase64String(sha.ComputeHash(file))!=expected)throw new IOException("Die geschriebene Datei konnte nicht geprüft werden.");if(new[]{"notenverwaltung.json","Ansicht.json"}.Contains(Path.GetFileName(path))){using(var reader=new JsonTextReader(new StreamReader(temp,Encoding.UTF8)){MaxDepth=128}){if(!reader.Read()||reader.TokenType!=JsonToken.StartObject)throw new InvalidDataException("Die Datendatei ist nicht vollständig gültig.");bool complete=false;while(reader.Read()){if(reader.Depth==0&&reader.TokenType==JsonToken.EndObject){complete=true;if(reader.Read())throw new InvalidDataException("Die Datendatei enthält zusätzliche Inhalte.");break;}}if(!complete)throw new InvalidDataException("Die Datendatei ist unvollständig.");}}if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);}
   finally{if(File.Exists(temp))File.Delete(temp);}
  }
  public static void AtomicWrite(string path,string text){if(text==null)throw new ArgumentException("Die Datei ist leer.");AtomicBytes(path,new UTF8Encoding(false).GetBytes(text));}
  public static void AtomicCopy(string from,string to){AtomicBytes(to,File.ReadAllBytes(from));if(Migration.HashFile(from)!=Migration.HashFile(to))throw new IOException("Die übernommene Datei konnte nicht geprüft werden.");}
  object VaultStatus() => new { enabled=vault.Enabled, locked=vault.Locked, pending=vault.Pending, unprotected=vault.Unprotected() };
  object FinishVaultAction(Action action) {
   try { action(); return VaultStatus(); }
   catch { if (vault.Pending) vault.Lock(); throw; }
  }
  object VaultAction(string op,JObject request) {
   string password=(string)request["password"], recovery=(string)request["recovery"], verification=(string)request["verification"];
   switch(op) {
    case "vault-status": return VaultStatus();
    case "vault-key": return VaultCrypto.GenerateRecovery();
    case "vault-enable": return FinishVaultAction(()=>vault.Enable(password,recovery,verification));
    case "vault-unlock": return FinishVaultAction(()=>{ vault.Unlock(password,recovery); if(vault.Pending) vault.CompletePending(); });
    case "vault-lock": vault.Lock(); return VaultStatus();
    case "vault-verify": vault.VerifyAccess(null,recovery); return true;
    case "vault-check-password": vault.VerifyAccess(password,null); return true;
    case "vault-change": vault.ChangePassword((string)request["currentPassword"],recovery,password); return VaultStatus();
    case "vault-rotate": return FinishVaultAction(()=>vault.Rotate((string)request["currentPassword"],password,recovery,verification));
    case "vault-disable": return FinishVaultAction(()=>vault.Disable(password,recovery));
    case "vault-backup": {
     string text=(string)request["text"]; if(text==null || text.Length>VaultStore.MaxPayload) throw new IOException("Die Sicherung ist zu groß oder leer.");
     byte[] plain=VaultCrypto.Utf8.GetBytes(text);
     try { return Convert.ToBase64String(vault.Backup(plain)); }
     finally { VaultCrypto.Clear(plain); }
    }
    case "vault-open-backup": {
     string encoded=(string)request["dataBase64"];
     if(encoded==null || encoded.Length>4L*((VaultStore.MaxEnvelope+2L)/3)) throw new IOException("Die Sicherung ist zu groß oder leer.");
     byte[] plain=vault.ImportBackup(Convert.FromBase64String(encoded),password,recovery);
     try { return VaultCrypto.Utf8.GetString(plain); }
     finally { VaultCrypto.Clear(plain); }
    }
    default: throw new ArgumentException("Diese Funktion wird nicht unterstützt.");
   }
  }
  object ProtectedAction(string op,string relative,JObject request){
   if(vault.Locked) throw new InvalidOperationException("Bitte entsperre zuerst deine Noten.");
   if(vault.Pending) throw new InvalidOperationException("Die Änderung des Passwortschutzes ist noch nicht abgeschlossen. Bitte öffne den Bestand erneut.");
   const string primary="notenverwaltung.json";
   switch(op){
    case "migration-sources": return new object[0];
    case "migration-read": case "migration-commit": throw new InvalidOperationException("Bitte stelle ältere Noten über eine Sicherung wieder her.");
    case "current-hash": {
     var bytes=vault.Read(primary);
     try { return BitConverter.ToString(VaultCrypto.Hash(bytes)).Replace("-", ""); }
     finally { VaultCrypto.Clear(bytes); }
    }
    case "directory": vault.DirectoryAt(relative,(bool?)request["create"]==true); return true;
    case "file":
     if(vault.Exists(relative,true)) throw new IOException("Der Dateiname bezeichnet einen Ordner.");
     if(!vault.Exists(relative)&&(bool?)request["create"]!=true){
      if(string.Equals(relative,primary,StringComparison.OrdinalIgnoreCase)) throw new IOException("Die geschützte Notendatei ist nicht vorhanden. Bitte öffne eine Sicherung.");
      throw new FileNotFoundException();
     }
     return true;
    case "read": {
     var bytes = vault.Read(relative);
     try { return VaultCrypto.Utf8.GetString(bytes).TrimStart('\ufeff'); }
     finally { VaultCrypto.Clear(bytes); }
    }
    case "write": {
     string value=(string)request["text"]; if(value==null)throw new ArgumentException("Die Datei ist leer.");
     if(string.Equals(relative,primary,StringComparison.OrdinalIgnoreCase)||string.Equals(relative,"Ansicht.json",StringComparison.OrdinalIgnoreCase)) JObject.Parse(value);
     var bytes=VaultCrypto.Utf8.GetBytes(value);
     try { vault.Write(relative,bytes); return true; }
     finally { VaultCrypto.Clear(bytes); }
    }
    case "remove": vault.Remove(relative); return true;
    case "entries": return vault.Entries(relative).Select(entry=>new{name=entry.Name,kind=entry.IsDirectory?"directory":"file",size=entry.Size,lastModified=new DateTimeOffset(entry.LastModifiedUtc).ToUnixTimeMilliseconds()}).ToArray();
    default: throw new ArgumentException("Diese Dateifunktion wird nicht unterstützt.");
   }
  }
  public object Dispatch(JObject request){string op=(string)request["op"],relative=(string)request["path"]??"";string path;
   if(op!=null&&op.StartsWith("vault-",StringComparison.Ordinal)) return VaultAction(op,request);
   if(vault.Enabled&&op!="storage-info") return ProtectedAction(op,relative,request);
   switch(op){
    case "storage-info":return Root;
    case "migration-sources":return migration.List();
    case "migration-read":return migration.Read((string)request["key"]);
    case "migration-commit":return migration.Commit((string)request["key"],(string)request["sha256"],(string)request["currentSha256"]);
    case "current-hash":path=Path.Combine(Root,"notenverwaltung.json");return File.Exists(path)?Migration.HashFile(path):null;
    case "directory":path=Resolve(relative,true);if((bool?)request["create"]==true)Directory.CreateDirectory(path);if(!Directory.Exists(path))throw new DirectoryNotFoundException();return true;
    case "file":path=Resolve(relative);if(!File.Exists(path)&&(bool?)request["create"]!=true)throw new FileNotFoundException();if(Directory.Exists(path))throw new IOException("Der Dateiname bezeichnet einen Ordner.");return true;
    case "read":path=Resolve(relative);if(!File.Exists(path))throw new FileNotFoundException();CheckSize(path);return File.ReadAllText(path,Encoding.UTF8);
    case "write":path=Resolve(relative);AtomicWrite(path,(string)request["text"]);return true;
    case "remove":path=Resolve(relative);if(Directory.Exists(path))Directory.Delete(path,false);else if(File.Exists(path))File.Delete(path);else throw new FileNotFoundException();return true;
    case "entries":path=Resolve(relative,true);if(!Directory.Exists(path))throw new DirectoryNotFoundException();return Directory.EnumerateFileSystemEntries(path).Where(x=>(File.GetAttributes(x)&FileAttributes.ReparsePoint)==0).Select(x=>new{name=Path.GetFileName(x),kind=Directory.Exists(x)?"directory":"file",size=Directory.Exists(x)?0:new FileInfo(x).Length,lastModified=new DateTimeOffset(File.GetLastWriteTimeUtc(x)).ToUnixTimeMilliseconds()}).ToArray();
    default:throw new ArgumentException("Diese Dateifunktion wird nicht unterstützt.");
   }
  }
  public JObject Handle(JObject request){var response=new JObject{{"id",request["id"]},{"ok",false}};try{var result=Dispatch(request);response["result"]=result==null?JValue.CreateNull():JToken.FromObject(result);response["ok"]=true;}catch(Exception e){response["name"]=e is FileNotFoundException||e is DirectoryNotFoundException?"NotFoundError":e is UnauthorizedAccessException?"NotAllowedError":"Error";response["error"]=e is FileNotFoundException||e is DirectoryNotFoundException?"Die Datei wurde nicht gefunden.":e.Message;}return response;}
 }
}
