using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.IO.Compression;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public sealed class Migration {
  readonly string program,root;
  public Migration(string p,string r){program=p;root=r;}
  sealed class Source {public string Key,Folder,File,Label;}
  List<Source> Sources(){var list=new List<Source>();var old=Path.Combine(program,"Datensicherung");
   foreach(var pair in new[]{new[]{"old-nested",Path.Combine(old,"Daten","notenverwaltung.json"),old,"Datensicherung"},new[]{"old-flat",Path.Combine(old,"notenverwaltung.json"),old,"Datensicherung (bisherige Ablage)"},new[]{"old-root",Path.Combine(program,"notenverwaltung.json"),program,"Bisheriger Programmordner"}})
    if(File.Exists(pair[1])){Storage.CheckPath(pair[1]);list.Add(new Source{Key=pair[0],File=pair[1],Folder=pair[2],Label=pair[3]});}return list;
  }
  public static string HashFile(string path){using(var s=File.OpenRead(path))using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(s)).Replace("-","");}
  Source Find(string key){var s=Sources().FirstOrDefault(x=>x.Key==key);if(s==null)throw new IOException("Der bisherige Datenbestand ist nicht mehr verfügbar. Bitte starte Notenblick erneut.");return s;}
  public object List(){return Sources().Select(s=>new{key=s.Key,label=s.Label,path=s.File,size=new FileInfo(s.File).Length}).ToArray();}
  public object Read(string key){var s=Find(key);Storage.CheckSize(s.File);return new{sha256=HashFile(s.File),text=File.ReadAllText(s.File,Encoding.UTF8)};}
  static IEnumerable<string> Files(string dir){Storage.CheckPath(dir);foreach(var p in Directory.EnumerateFiles(dir)){Storage.CheckPath(p);if(Path.GetFileName(p)!="InBenutzung.lock"&&!Path.GetFileName(p).StartsWith(".notenblick-"))yield return p;}foreach(var child in Directory.EnumerateDirectories(dir)){Storage.CheckPath(child);foreach(var f in Files(child))yield return f;}}
  static string Relative(string root,string path){return path.Substring(root.TrimEnd(Path.DirectorySeparatorChar).Length+1).Replace(Path.DirectorySeparatorChar,'/');}
  static void CopyVerified(string from,string to){Storage.CheckPath(from);Storage.CheckPath(to);Directory.CreateDirectory(Path.GetDirectoryName(to));
   var temporary=to+".kopie-"+Guid.NewGuid().ToString("N");try{
    using(var input=File.OpenRead(from))using(var output=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None,65536,FileOptions.WriteThrough)){input.CopyTo(output);output.Flush(true);}
    if(HashFile(from)!=HashFile(temporary))throw new IOException("Eine Datei konnte nicht vollständig geprüft werden. Die ursprünglichen Daten bleiben erhalten.");
    File.Move(temporary,to);
   }finally{if(File.Exists(temporary))File.Delete(temporary);}
  }
  static void ZipVerified(string source,string target,IEnumerable<string> files){
   var paths=files.ToList();var hashes=new Dictionary<string,string>();
   using(var stream=new FileStream(target,FileMode.CreateNew,FileAccess.ReadWrite,FileShare.None,4096,FileOptions.WriteThrough)){
    using(var zip=new ZipArchive(stream,ZipArchiveMode.Create,true)){
     foreach(var f in paths){var rel=Relative(source,f);hashes.Add(rel,HashFile(f));var entry=zip.CreateEntry(rel,CompressionLevel.Optimal);using(var input=File.OpenRead(f))using(var output=entry.Open())input.CopyTo(output);}
     var manifest=zip.CreateEntry("_Pruefsummen.json");using(var writer=new StreamWriter(manifest.Open(),new UTF8Encoding(false)))writer.Write(JObject.FromObject(hashes).ToString());
    }stream.Flush(true);
   }
   using(var zipStream=File.OpenRead(target))using(var zip=new ZipArchive(zipStream,ZipArchiveMode.Read))foreach(var item in hashes){var entry=zip.GetEntry(item.Key);if(entry==null)throw new IOException("Die Sicherung ist unvollständig.");using(var input=entry.Open())using(var sha=SHA256.Create()){var actual=BitConverter.ToString(sha.ComputeHash(input)).Replace("-","");if(actual!=item.Value)throw new IOException("Die Sicherung konnte nicht vollständig geprüft werden.");}}
  }
  public object Commit(string key,string expected,string expectedCurrent){
   var source=Find(key);if(HashFile(source.File)!=expected)throw new IOException("Der bisherige Datenbestand wurde inzwischen geändert. Bitte schließe die alte Programmversion und starte erneut.");
   var canonical=Path.Combine(root,"notenverwaltung.json");if(File.Exists(canonical)){if(string.IsNullOrEmpty(expectedCurrent)||HashFile(canonical)!=expectedCurrent)throw new IOException("Im Ordner Daten ist bereits ein anderer Stand vorhanden. Er wurde nicht überschrieben.");}
   // Hold the old edition's own lock throughout backup and copying.
   var lockFolder=source.Key=="old-nested"?Path.Combine(source.Folder,"Daten"):source.Folder;
   var oldLock=Path.Combine(lockFolder,"InBenutzung.lock");
   using(var ownership=new FileStream(oldLock,FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None)){
    var previousFiles=File.Exists(canonical)?Files(root).ToList():new List<string>();
    var stage=Path.Combine(root,".Migration-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(stage);
    var rollback=new Dictionary<string,byte[]>();var touched=new List<string>();bool activated=false;
    try{
     var stamp=DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss")+"_"+Guid.NewGuid().ToString("N");
     var safe=Path.Combine(root,"Sicherungen");Directory.CreateDirectory(safe);
     var oldZip=Path.Combine(stage,"Vor_Migration_"+stamp+".zip");
     var originals=source.Key=="old-root"?new[]{source.File}.AsEnumerable():Files(source.Folder).ToList();
     ZipVerified(source.Folder,oldZip,originals);
     CopyVerified(oldZip,Path.Combine(safe,Path.GetFileName(oldZip)));
     if(File.Exists(canonical)){
      var current=previousFiles;
      var currentZip=Path.Combine(stage,"Vor_Ersetzen_"+stamp+".zip");ZipVerified(root,currentZip,current);CopyVerified(currentZip,Path.Combine(safe,Path.GetFileName(currentZip)));
     }
     var mapped=new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);mapped.Add("notenverwaltung.json",source.File);
     var workspace=new[]{Path.Combine(source.Folder,"Daten","Ansicht.json"),Path.Combine(source.Folder,"Ansicht.json")}.FirstOrDefault(File.Exists);
     if(workspace!=null)mapped.Add("Ansicht.json",workspace);
     var recovery=Path.Combine(source.Folder,"Daten","Wiederherstellung");
     if(Directory.Exists(recovery))foreach(var f in Files(recovery))mapped.Add("Sicherungen/"+Relative(recovery,f),f);
     if(source.Key!="old-root")foreach(var f in Files(source.Folder)){
      var rel=Relative(source.Folder,f);if(rel.StartsWith("Daten/",StringComparison.OrdinalIgnoreCase)||rel=="notenverwaltung.json"||rel=="Ansicht.json")continue;mapped.Add("Notenlisten/"+rel,f);
     }
     // Stage and verify the entire selection before touching any active file.
     var staged=Path.Combine(stage,"Geprueft");
     foreach(var item in mapped){var to=Path.Combine(staged,item.Key.Replace('/',Path.DirectorySeparatorChar));CopyVerified(item.Value,to);var destination=Path.Combine(root,item.Key.Replace('/',Path.DirectorySeparatorChar));Storage.CheckPath(destination);if(File.Exists(destination)&&HashFile(destination)!=HashFile(to)&&item.Key!="notenverwaltung.json"&&item.Key!="Ansicht.json")throw new IOException("In Daten liegt bereits eine abweichende Datei: "+item.Key+". Bitte behalte beide Ordner und prüfe die Bestände vor der Übernahme.");}
     if(HashFile(source.File)!=expected)throw new IOException("Der bisherige Notenstand wurde während der Übernahme geändert. Die Übernahme wurde abgebrochen.");
     // The central JSON is the activation point and is installed last.
     foreach(var item in mapped.OrderBy(x=>x.Key=="notenverwaltung.json"?1:0)){
      var destination=Path.Combine(root,item.Key.Replace('/',Path.DirectorySeparatorChar));var from=Path.Combine(staged,item.Key.Replace('/',Path.DirectorySeparatorChar));
      if(File.Exists(destination)&&HashFile(destination)==HashFile(from))continue;
      if(item.Key=="notenverwaltung.json"||item.Key=="Ansicht.json")rollback[destination]=File.Exists(destination)?File.ReadAllBytes(destination):null;
      touched.Add(destination);Storage.AtomicCopy(from,destination);
     }
     activated=true;return new{backup=Path.GetFileName(oldZip),files=mapped.Count};
    }catch{if(!activated)foreach(var p in touched.AsEnumerable().Reverse()){byte[] bytes;if(rollback.TryGetValue(p,out bytes)){if(bytes==null){if(File.Exists(p))File.Delete(p);}else Storage.AtomicBytes(p,bytes);}else if(File.Exists(p))File.Delete(p);}throw;}
    finally{try{Directory.Delete(stage,true);}catch{}}
   }
  }
 }
}
