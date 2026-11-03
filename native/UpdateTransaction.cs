// Offline transaction engine. Its only installation targets are the EXE and Programm.
// Compiled into the bootstrap, window and external helper; no third-party dependency.
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Diagnostics;

namespace Notenblick.Native {
 public sealed class UpdateFile {
  public string Path, Sha256; public long Size;
  public UpdateFile() {} public UpdateFile(string path,long size,string sha){Path=path;Size=size;Sha256=sha;}
 }
 public sealed class UpdatePlan {
  public string Root,Token,Version; public int ParentId; public long ParentStart;
  public List<UpdateFile> Old=new List<UpdateFile>(),Next=new List<UpdateFile>();
  public string Folder {get{return System.IO.Path.Combine(UpdateTransaction.Workspace(Root),Token);}}
 }
 public static class UpdateTransaction {
  public const long MaximumFile=64L*1024*1024, MaximumTotal=256L*1024*1024;
  public static Version VersionNumber(string text){
   if(text==null||!Regex.IsMatch(text,@"^(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})\.(0|[1-9][0-9]{0,4})$"))throw new InvalidDataException("Version");
   return new Version(text);
  }
  public static string Digest(byte[] bytes){using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
  public static string Hash(string path){NoLink(path);using(var stream=File.OpenRead(path))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();}
  public static void NoLink(string path){if((File.Exists(path)||Directory.Exists(path))&&(File.GetAttributes(path)&FileAttributes.ReparsePoint)!=0)throw new IOException("Linked path");}
  public static string RootPath(string root){
   var full=System.IO.Path.GetFullPath(root).TrimEnd(System.IO.Path.DirectorySeparatorChar,System.IO.Path.AltDirectorySeparatorChar);
   if(full.Length<2||System.IO.Path.GetDirectoryName(full)==null||full.StartsWith(@"\\",StringComparison.Ordinal)||new DirectoryInfo(full).Root.FullName.TrimEnd(System.IO.Path.DirectorySeparatorChar)==full)throw new IOException("Unsupported location");
   for(var d=new DirectoryInfo(full);d!=null;d=d.Parent){if(String.Equals(d.Name,"Daten",StringComparison.OrdinalIgnoreCase))throw new IOException("Data is never an update target");NoLink(d.FullName);}
   return full;
  }
  public static string Workspace(string root){root=RootPath(root);return System.IO.Path.Combine(System.IO.Path.GetDirectoryName(root),".Notenblick-Aktualisierung-"+Digest(Encoding.UTF8.GetBytes(root.ToUpperInvariant())).Substring(0,24));}
  public static void LogicalPath(string name){
   if(name==null||name.Length>512||(name!="Notenblick.exe"&&!name.StartsWith("Programm/",StringComparison.Ordinal)))throw new InvalidDataException("Target");
   foreach(var part in name.Split('/'))if(part.Length==0||part.Length>120||part=="."||part==".."||part!=part.TrimEnd(' ','.')||part!=part.Normalize(NormalizationForm.FormC)||Regex.IsMatch(part,@"[<>:""\\|?*\x00-\x1f\x7f]")||Regex.IsMatch(part,@"^(CON|PRN|AUX|NUL|CONIN\$|CONOUT\$|COM[1-9¹²³]|LPT[1-9¹²³])( *\.|$)",RegexOptions.IgnoreCase|RegexOptions.CultureInvariant)||String.Equals(part,"Daten",StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Path");
  }
  public static void FileList(IList<UpdateFile> files){
   if(files==null||files.Count<2||files.Count>512)throw new InvalidDataException("File list");
   long total=0;var names=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   foreach(var f in files){LogicalPath(f.Path);if(!names.Add(f.Path)||f.Size<0||f.Size>MaximumFile||f.Sha256==null||!Regex.IsMatch(f.Sha256,"^[a-f0-9]{64}$"))throw new InvalidDataException("File record");total=checked(total+f.Size);}
   if(total>MaximumTotal||!names.Contains("Notenblick.exe")||!files.Any(f=>f.Path.StartsWith("Programm/",StringComparison.Ordinal)))throw new InvalidDataException("Incomplete version");
   foreach(var name in names){var p=name;while(p.Contains("/")){p=p.Substring(0,p.LastIndexOf('/'));if(names.Contains(p))throw new InvalidDataException("Aliased path");}}
  }
  static IEnumerable<string> Files(string folder){
   NoLink(folder);foreach(var f in Directory.EnumerateFiles(folder)){NoLink(f);yield return f;}
   foreach(var child in Directory.EnumerateDirectories(folder))foreach(var f in Files(child))yield return f;
  }
  static string Relative(string root,string file){return file.Substring(root.Length+1).Replace(System.IO.Path.DirectorySeparatorChar,'/');}
  static string At(string folder,string relative){LogicalPath(relative);var path=System.IO.Path.GetFullPath(System.IO.Path.Combine(folder,relative.Replace('/',System.IO.Path.DirectorySeparatorChar)));if(!path.StartsWith(folder+System.IO.Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("Outside target");return path;}
  public static List<UpdateFile> Snapshot(string root){
   root=RootPath(root);var paths=new List<string>{System.IO.Path.Combine(root,"Notenblick.exe")};paths.AddRange(Files(System.IO.Path.Combine(root,"Programm")));
   var list=paths.Select(p=>new UpdateFile(Relative(root,p),new FileInfo(p).Length,Hash(p))).OrderBy(f=>f.Path,StringComparer.Ordinal).ToList();FileList(list);return list;
  }
  public static void Verify(string folder,IList<UpdateFile> files,bool installation=false,bool subset=false){
   folder=System.IO.Path.GetFullPath(folder).TrimEnd(System.IO.Path.DirectorySeparatorChar);FileList(files);NoLink(folder);
   var expected=files.ToDictionary(f=>f.Path,StringComparer.OrdinalIgnoreCase);
   var actual=installation?new[]{System.IO.Path.Combine(folder,"Notenblick.exe")}.Concat(Files(System.IO.Path.Combine(folder,"Programm"))):Files(folder);
   var seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   foreach(var path in actual){string name=Relative(folder,path);UpdateFile f;if(!seen.Add(name)||!expected.TryGetValue(name,out f)||new FileInfo(path).Length!=f.Size||Hash(path)!=f.Sha256)throw new InvalidDataException("Unexpected or damaged program file");}
   if(!subset&&seen.Count!=expected.Count)throw new InvalidDataException("Missing program file");
  }
  public static FileStream Acquire(string root){
   var work=Workspace(root);NoLink(work);Directory.CreateDirectory(work);var owner=System.IO.Path.Combine(work,"owner.txt");NoLink(owner);
   if(!File.Exists(owner)){using(var f=new FileStream(owner,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var b=Encoding.UTF8.GetBytes(RootPath(root));f.Write(b,0,b.Length);f.Flush(true);}}
   if(new FileInfo(owner).Length>4096||File.ReadAllText(owner)!=RootPath(root))throw new IOException("Workspace owner");
   var gate=System.IO.Path.Combine(work,"transaction.lock");NoLink(gate);return new FileStream(gate,FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);
  }
  public static UpdatePlan Begin(string root,string version,Func<Tuple<int,long>> identity=null){
   root=RootPath(root);VersionNumber(version);Tuple<int,long> parent;if(identity!=null)parent=identity();else using(var process=Process.GetCurrentProcess())parent=Tuple.Create(process.Id,process.StartTime.ToUniversalTime().Ticks);
   var p=new UpdatePlan{Root=root,Token=Guid.NewGuid().ToString("N"),Version=version,ParentId=parent.Item1,ParentStart=parent.Item2};
   if(Directory.Exists(p.Folder))throw new IOException("Transaction exists");Directory.CreateDirectory(p.Folder);Directory.CreateDirectory(System.IO.Path.Combine(p.Folder,"new"));return p;
  }
  public static void AtomicText(string path,string text){
   NoLink(path);string temp=path+"."+Guid.NewGuid().ToString("N")+".tmp";
   try{using(var f=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None,4096,FileOptions.WriteThrough)){var b=new UTF8Encoding(false,true).GetBytes(text);f.Write(b,0,b.Length);f.Flush(true);}if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);}finally{if(File.Exists(temp))File.Delete(temp);}
  }
  public static string Phase(UpdatePlan p){var path=System.IO.Path.Combine(p.Folder,"phase.txt");NoLink(path);if(!File.Exists(path)||new FileInfo(path).Length>80)throw new InvalidDataException("Journal");var phase=File.ReadAllText(path);if(!new[]{"ready","authorized","backed-up","moving-program","program-installed","installed","committed","rolled-back","cancelled"}.Contains(phase))throw new InvalidDataException("Journal state");return phase;}
  public static void Mark(UpdatePlan p,string phase){AtomicText(System.IO.Path.Combine(p.Folder,"phase.txt"),phase);}
  public static void Save(UpdatePlan p){
   FileList(p.Old);FileList(p.Next);VersionNumber(p.Version);if(RootPath(p.Root)!=p.Root||!Regex.IsMatch(p.Token,"^[a-f0-9]{32}$"))throw new InvalidDataException();
   var sb=new StringBuilder();using(var w=XmlWriter.Create(sb,new XmlWriterSettings{OmitXmlDeclaration=true})){
    w.WriteStartElement("NotenblickUpdate");w.WriteAttributeString("schema","1");w.WriteAttributeString("root",p.Root);w.WriteAttributeString("token",p.Token);w.WriteAttributeString("version",p.Version);w.WriteAttributeString("parent",p.ParentId.ToString(System.Globalization.CultureInfo.InvariantCulture));w.WriteAttributeString("started",p.ParentStart.ToString(System.Globalization.CultureInfo.InvariantCulture));
    foreach(var pair in new[]{Tuple.Create("old",p.Old),Tuple.Create("next",p.Next)}){w.WriteStartElement(pair.Item1);foreach(var f in pair.Item2){w.WriteStartElement("file");w.WriteAttributeString("path",f.Path);w.WriteAttributeString("size",f.Size.ToString(System.Globalization.CultureInfo.InvariantCulture));w.WriteAttributeString("sha256",f.Sha256);w.WriteEndElement();}w.WriteEndElement();}w.WriteEndElement();}
   AtomicText(System.IO.Path.Combine(p.Folder,"plan.xml"),sb.ToString());Mark(p,"ready");AtomicText(System.IO.Path.Combine(Workspace(p.Root),"current.txt"),p.Token);
  }
  public static UpdatePlan Read(string root,string token){
   root=RootPath(root);if(token==null||!Regex.IsMatch(token,"^[a-f0-9]{32}$"))throw new InvalidDataException("Token");
   var folder=System.IO.Path.Combine(Workspace(root),token);NoLink(folder);var path=System.IO.Path.Combine(folder,"plan.xml");NoLink(path);if(new FileInfo(path).Length>1024*1024)throw new InvalidDataException("Plan size");
   var doc=new XmlDocument{XmlResolver=null};using(var r=XmlReader.Create(path,new XmlReaderSettings{DtdProcessing=DtdProcessing.Prohibit,XmlResolver=null,MaxCharactersInDocument=1024*1024}))doc.Load(r);
   var e=doc.DocumentElement;if(e.Name!="NotenblickUpdate"||e.GetAttribute("schema")!="1"||e.GetAttribute("root")!=root||e.GetAttribute("token")!=token||e.ChildNodes.Count!=2)throw new InvalidDataException("Plan identity");
   var p=new UpdatePlan{Root=root,Token=token,Version=e.GetAttribute("version"),ParentId=int.Parse(e.GetAttribute("parent"),System.Globalization.CultureInfo.InvariantCulture),ParentStart=long.Parse(e.GetAttribute("started"),System.Globalization.CultureInfo.InvariantCulture)};VersionNumber(p.Version);
   foreach(var pair in new[]{Tuple.Create("old",p.Old),Tuple.Create("next",p.Next)}){var nodes=e.SelectNodes(pair.Item1);if(nodes.Count!=1)throw new InvalidDataException();foreach(XmlNode node in nodes[0].ChildNodes){var f=node as XmlElement;if(f==null||f.Name!="file"||f.ChildNodes.Count!=0)throw new InvalidDataException();pair.Item2.Add(new UpdateFile(f.GetAttribute("path"),long.Parse(f.GetAttribute("size"),System.Globalization.CultureInfo.InvariantCulture),f.GetAttribute("sha256")));}FileList(pair.Item2);}return p;
  }
  public static UpdatePlan Current(string root){var path=System.IO.Path.Combine(Workspace(root),"current.txt");NoLink(path);if(!File.Exists(path))return null;if(new FileInfo(path).Length!=32)throw new InvalidDataException("Pointer");return Read(root,File.ReadAllText(path));}
  public static bool ParentAlive(UpdatePlan p){return ProcessAlive(p.ParentId,p.ParentStart);}
  public static bool ProcessAlive(int id,long start){try{using(var p=Process.GetProcessById(id))return !p.HasExited&&p.StartTime.ToUniversalTime().Ticks==start;}catch(ArgumentException){return false;}catch(InvalidOperationException){return false;}}
  public static bool Pending(UpdatePlan p){return p!=null&&!new[]{"committed","rolled-back","cancelled"}.Contains(Phase(p));}
  public static void Install(UpdatePlan p,Func<bool> probe,Action<string> status=null,Action<string> boundary=null){
   if(Phase(p)!="authorized")throw new InvalidDataException("Not authorized");Verify(p.Root,p.Old,true);Verify(System.IO.Path.Combine(p.Folder,"new"),p.Next);
   var old=System.IO.Path.Combine(p.Folder,"old");Directory.CreateDirectory(old);var exe=System.IO.Path.Combine(p.Root,"Notenblick.exe");
   File.Copy(exe,System.IO.Path.Combine(old,"Notenblick.exe"),false);Mark(p,"backed-up");boundary?.Invoke("backed-up");
   status?.Invoke("installing");Mark(p,"moving-program");boundary?.Invoke("moving-program");
   Directory.Move(System.IO.Path.Combine(p.Root,"Programm"),System.IO.Path.Combine(old,"Programm"));boundary?.Invoke("old-program-moved");
   Directory.Move(System.IO.Path.Combine(p.Folder,"new","Programm"),System.IO.Path.Combine(p.Root,"Programm"));boundary?.Invoke("new-program-moved");Mark(p,"program-installed");boundary?.Invoke("program-installed");
   File.Replace(System.IO.Path.Combine(p.Folder,"new","Notenblick.exe"),exe,null);boundary?.Invoke("new-exe-replaced");Mark(p,"installed");boundary?.Invoke("installed");
   Verify(p.Root,p.Next,true);if(!probe())throw new IOException("New version rejected");boundary?.Invoke("verified");Mark(p,"committed");status?.Invoke("restarting");
  }
  static void DeleteKnownProgram(string folder,IList<UpdateFile> list){
   NoLink(folder);if(!Directory.Exists(folder))return;var allowed=list.Where(f=>f.Path.StartsWith("Programm/",StringComparison.Ordinal)).ToDictionary(f=>f.Path.Substring(9),StringComparer.OrdinalIgnoreCase);
   var actual=Files(folder).ToArray();foreach(var path in actual)if(!allowed.ContainsKey(Relative(folder,path)))throw new IOException("Foreign file during recovery");
   // Remove only the complete owned tree, never follow a link into another folder.
   foreach(var path in actual)File.Delete(path);foreach(var child in Directory.GetDirectories(folder,"*",SearchOption.AllDirectories).OrderByDescending(x=>x.Length)){NoLink(child);Directory.Delete(child);}Directory.Delete(folder);
  }
  public static void Recover(UpdatePlan p){
   string phase=Phase(p);if(phase=="committed"){Verify(p.Root,p.Next,true);return;}if(phase=="cancelled"||phase=="rolled-back"){Verify(p.Root,p.Old,true);return;}
   string old=System.IO.Path.Combine(p.Folder,"old"),oldProgram=System.IO.Path.Combine(old,"Programm"),program=System.IO.Path.Combine(p.Root,"Programm");NoLink(old);NoLink(oldProgram);NoLink(program);
   if(Directory.Exists(oldProgram)){
    Verify(old,p.Old);
    DeleteKnownProgram(program,p.Next);Directory.Move(oldProgram,program);
   }
   var exe=System.IO.Path.Combine(p.Root,"Notenblick.exe");var spec=p.Old.Single(f=>f.Path=="Notenblick.exe");
   if(!File.Exists(exe)||Hash(exe)!=spec.Sha256){var backup=System.IO.Path.Combine(old,"Notenblick.exe");if(new FileInfo(backup).Length!=spec.Size||Hash(backup)!=spec.Sha256)throw new IOException("Invalid backup executable");var restore=System.IO.Path.Combine(p.Folder,"restore.exe");if(File.Exists(restore))File.Delete(restore);File.Copy(backup,restore,false);if(File.Exists(exe))File.Replace(restore,exe,null);else File.Move(restore,exe);}
   Verify(p.Root,p.Old,true);Mark(p,"rolled-back");
  }
  public static void DiscardStaging(UpdatePlan p){
   var folder=System.IO.Path.Combine(p.Folder,"new");if(!Directory.Exists(folder))return;
   var names=new HashSet<string>(p.Next.Select(f=>f.Path),StringComparer.OrdinalIgnoreCase);var files=Files(folder).ToArray();foreach(var file in files)if(!names.Contains(Relative(folder,file)))throw new IOException("Foreign staging file");
   foreach(var file in files)File.Delete(file);foreach(var dir in Directory.GetDirectories(folder,"*",SearchOption.AllDirectories).OrderByDescending(x=>x.Length))Directory.Delete(dir);Directory.Delete(folder);
  }
  public static void Prune(string root,string keep){
   var work=Workspace(root);foreach(var folder in Directory.EnumerateDirectories(work))try{
    string token=System.IO.Path.GetFileName(folder);if(token==keep||!Regex.IsMatch(token,"^[a-f0-9]{32}$"))continue;var p=Read(root,token);if(Pending(p)||ParentAlive(p))continue;
    var allowed=new Dictionary<string,UpdateFile>(StringComparer.OrdinalIgnoreCase);foreach(var f in p.Old)allowed["old/"+f.Path]=f;foreach(var f in p.Next)allowed["new/"+f.Path]=f;
    var files=Files(folder).ToArray();foreach(var file in files){string name=Relative(folder,file);UpdateFile spec;if(allowed.TryGetValue(name,out spec)){if(new FileInfo(file).Length!=spec.Size||Hash(file)!=spec.Sha256)throw new IOException("Modified backup");}else if(name!="plan.xml"&&name!="phase.txt"&&name!="restore.exe"&&!Regex.IsMatch(name,@"^runner-[a-f0-9]{32}\.exe$"))throw new IOException("Unowned backup file");}
    foreach(var dir in Directory.GetDirectories(folder,"*",SearchOption.AllDirectories))if(String.Equals(System.IO.Path.GetFileName(dir),"Daten",StringComparison.OrdinalIgnoreCase))throw new IOException("Data");
    foreach(var file in files)File.Delete(file);foreach(var dir in Directory.GetDirectories(folder,"*",SearchOption.AllDirectories).OrderByDescending(x=>x.Length))Directory.Delete(dir);Directory.Delete(folder);
   }catch{/* Preserve anything uncertain; cleanup can never put an installation at risk. */}
  }
 }
 public static class UpdateBootstrap {
  static string Quote(string value){if(value.Contains("\"")||value.EndsWith("\\",StringComparison.Ordinal))throw new IOException("Argument");return "\""+value+"\"";}
  public static void Start(string root,string token,bool recover){
   var p=UpdateTransaction.Read(root,token);var runner=System.IO.Path.Combine(p.Folder,"runner-"+Guid.NewGuid().ToString("N")+".exe");
   using(var source=System.Reflection.Assembly.GetEntryAssembly().GetManifestResourceStream("Notenblick.Aktualisierung.exe")){
    if(source==null)throw new IOException("Update helper resource");using(var target=new FileStream(runner,FileMode.CreateNew,FileAccess.Write,FileShare.None)){source.CopyTo(target);target.Flush(true);}
   }
   using(var parent=Process.GetCurrentProcess()){
    var started=Process.Start(new ProcessStartInfo{FileName=runner,Arguments=(recover?"--recover ":"--install ")+Quote(UpdateTransaction.RootPath(root))+" "+token+" "+parent.Id.ToString(System.Globalization.CultureInfo.InvariantCulture)+" "+parent.StartTime.ToUniversalTime().Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture),WorkingDirectory=p.Folder,UseShellExecute=false});if(started==null)throw new IOException("Helper did not start");started.Dispose();
   }
  }
  public static bool RecoverBeforeStart(string root){
   string work;try{work=UpdateTransaction.Workspace(root);}catch(IOException){return false;}
   if(!Directory.Exists(work))return false;
   try{
    UpdatePlan p;using(UpdateTransaction.Acquire(root)){p=UpdateTransaction.Current(root);if(!UpdateTransaction.Pending(p))return false;if(UpdateTransaction.ParentAlive(p))return true;}
    Start(root,p.Token,true);return true;
   }catch(IOException e){if((e.HResult&65535)==32||(e.HResult&65535)==33)return true;throw new IOException("Eine frühere Aktualisierung konnte noch nicht abgeschlossen werden. Deine Noten sind unverändert. Bitte schließe weitere Notenblick-Fenster und starte das Programm erneut.");}
   catch{throw new IOException("Eine frühere Aktualisierung konnte nicht wiederhergestellt werden. Bitte entpacke die bisherige Version erneut. Deine Noten sind unverändert.");}
  }
 }
}
