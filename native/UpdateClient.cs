using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.IO.Compression;
using System.Reflection;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Notenblick.Native {
 public sealed class UpdateOffer {
  public string Version,Url,Sha256;public long Size,ReleaseId;public string[] Notes;public List<UpdateFile> Files;
  public JObject Public(){return new JObject{{"version",Version},{"notes",new JArray(Notes)}};}
 }
 // Diagnostic context stays in memory. Never serialize exception.Data, headers,
 // raw response bodies, file contents, proxy addresses or file-bearing stacks.
 public sealed class UpdateFailure:Exception {
  public readonly string Step,Endpoint,Response;public readonly int? HttpStatus;
  public UpdateFailure(string step,Exception cause,string endpoint=null,int? status=null,string response=null):base(step,cause){Step=step;Endpoint=endpoint;HttpStatus=status;Response=response;}
 }
 public static class UpdateDiagnostics {
  public static Exception At(string step,Exception error){var cancelled=error as OperationCanceledException;var context=new UpdateFailure(step,error);return cancelled==null?(Exception)context:new OperationCanceledException(step,context,cancelled.CancellationToken);}
  public static string Clean(string value){
   if(string.IsNullOrEmpty(value))return "";
   string text=value;
   text=Regex.Replace(text,@"\b(?:Bearer|Basic)\s+[^\s,;]+","[Zugangsdaten entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"\b(?:Authorization|Proxy-Authorization|Set-Cookie|Cookie|password|passwd|token|access_token|refresh_token|secret|api[_-]?key)\s*[:=]\s*(?:""[^""]*""|'[^']*'|[^\r\n,;]+)","[Zugangsdaten entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"\b(?:gh[pousr]_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+)\b","[Token entfernt]");
   text=Regex.Replace(text,@"\b(?:https?|file|ftp)://[^\s'""<>]+","[URL entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"(['""])/[^\r\n]*?\1","[Pfad entfernt]");
   text=Regex.Replace(text,@"(?:[a-z]:[\\/]|\\\\)[^\r\n'""<>]*","[Pfad entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"(?<![\w:])/(?:[^\s/'""<>]+/)+[^\s'""<>]*","[Pfad entfernt]");
   text=Regex.Replace(text,@"\b[A-Za-z0-9_.-]+\\[^\r\n'""<>]+","[Pfad/Konto entfernt]");
   text=Regex.Replace(text,@"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}","[E-Mail entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"\b(?:\d{1,3}\.){3}\d{1,3}\b|(?<![\w:])(?:[a-f0-9]{0,4}:){2,}[a-f0-9:]+(?:%\w+)?","[Netzwerkadresse entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b","[Kennung entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b",m=>new[]{"api.github.com","github.com","docs.github.com","release-assets.githubusercontent.com","objects.githubusercontent.com"}.Contains(m.Value.ToLowerInvariant())?m.Value:"[Name entfernt]",RegexOptions.IgnoreCase);
   text=Regex.Replace(text,@"((?:Remotename|remote name|proxy|host)[^'""\r\n]*['""])[^'""\r\n]+(['""])","$1[Host entfernt]$2",RegexOptions.IgnoreCase);
   foreach(string personal in new[]{Environment.UserName,Environment.MachineName})if(!string.IsNullOrWhiteSpace(personal)&&personal.Length>2)text=Regex.Replace(text,@"\b"+Regex.Escape(personal)+@"\b","[Name entfernt]",RegexOptions.IgnoreCase);
   return Regex.Replace(text,@"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]","");
  }
  public static string GitHubResponse(byte[] bytes,bool truncated=false){
   try{
    var json=UpdateSource.Json(bytes) as JObject;if(json==null)return "Kein GitHub-Fehlerobjekt; Antwortinhalt nicht übernommen.";
    var lines=new List<string>();if(json["message"]?.Type==JTokenType.String)lines.Add("message: "+Clean((string)json["message"]));
    var errors=json["errors"] as JArray;if(errors!=null)foreach(var item in errors.OfType<JObject>())foreach(string name in new[]{"resource","field","code","message"})if(item[name]?.Type==JTokenType.String)lines.Add(name+": "+Clean((string)item[name]));
    return lines.Count==0?"GitHub-Fehlerobjekt ohne übernehmbare Fehlermeldung.":string.Join("\n",lines)+(truncated?"\nAntwort auf 16 KiB begrenzt.":"");
   }catch{return "Fehlerantwort ist kein gültiges GitHub-JSON; Rohinhalt aus Datenschutzgründen nicht übernommen.";}
  }
  public static string Endpoint(Uri uri){return uri.Host=="api.github.com"?(uri.AbsolutePath.EndsWith("/releases",StringComparison.Ordinal)?"GitHub-API: Releases":"GitHub-API: Repository"):"GitHub: Update-Datei";}
  public static async Task<UpdateFailure> Transport(WebException error,Uri uri,CancellationToken cancel){
   int? status=null;string body=null;var http=error.Response as HttpWebResponse;
   if(http!=null){status=(int)http.StatusCode;using(http)try{
    using(var source=http.GetResponseStream())using(var bytes=new MemoryStream())using(var timeout=CancellationTokenSource.CreateLinkedTokenSource(cancel)){
     timeout.CancelAfter(TimeSpan.FromSeconds(2));using(timeout.Token.Register(http.Close)){
      var buffer=new byte[2048];int n;while(bytes.Length<16384&&(n=await source.ReadAsync(buffer,0,(int)Math.Min(buffer.Length,16384-bytes.Length),timeout.Token).ConfigureAwait(false))>0)bytes.Write(buffer,0,n);
      body=GitHubResponse(bytes.ToArray(),bytes.Length==16384);
     }
    }
   }catch(Exception readError){body="Fehlerantwort konnte nicht gelesen werden: "+readError.GetType().FullName+"; "+Clean(readError.Message);}}
   return new UpdateFailure(cancel.IsCancellationRequested?"Verbindung: Zeitgrenze/Abbruch":"HTTPS-Verbindung",error,Endpoint(uri),status,body);
  }
  static IEnumerable<Exception> Causes(Exception error){
   var pending=new Stack<Exception>();var seen=new HashSet<Exception>();pending.Push(error);
   while(pending.Count>0){var item=pending.Pop();if(item==null||!seen.Add(item))continue;yield return item;var aggregate=item as AggregateException;if(aggregate!=null){for(int i=aggregate.InnerExceptions.Count-1;i>=0;i--)pending.Push(aggregate.InnerExceptions[i]);}else if(item.InnerException!=null)pending.Push(item.InnerException);}
  }
  public static string Category(Exception error){
   var all=Causes(error).ToArray();var web=all.OfType<WebException>().FirstOrDefault();
   if(all.OfType<UpdateFailure>().Any(f=>f.HttpStatus==407))return "Proxy/HTTP";
   if(all.Any(e=>e is System.Security.Authentication.AuthenticationException))return "TLS/Zertifikat";
   if(web!=null)switch(web.Status){case WebExceptionStatus.NameResolutionFailure:return "DNS";case WebExceptionStatus.ProxyNameResolutionFailure:return "Proxy/DNS";case WebExceptionStatus.TrustFailure:return "Zertifikat";case WebExceptionStatus.SecureChannelFailure:return "TLS";case WebExceptionStatus.Timeout:case WebExceptionStatus.RequestCanceled:return "Zeitüberschreitung/Abbruch";case WebExceptionStatus.ProtocolError:return "HTTP";default:return "Netzwerk ("+web.Status+")";}
   if(all.OfType<UpdateFailure>().Any(f=>f.HttpStatus.HasValue))return "HTTP/Weiterleitung";
   if(all.Any(e=>e is System.Security.Authentication.AuthenticationException))return "TLS/Zertifikat";
   if(all.Any(e=>e is System.Net.Sockets.SocketException))return "Netzwerk/DNS";
   if(all.Any(e=>e is OperationCanceledException))return "Zeitüberschreitung/Abbruch";
   if(all.Any(e=>e is JsonException||e is DecoderFallbackException))return "JSON-Verarbeitung";
   if(all.Any(e=>e is InvalidDataException))return "Antwort-/Sicherheitsprüfung";
   if(all.Any(e=>e is UnauthorizedAccessException||e is IOException||e is System.Security.SecurityException))return "Dateizugriff/lokale Speicherung";
   if(all.Any(e=>e is ArgumentException||e is FormatException||e is OverflowException))return "Wert-/Versionsauswertung";
   return "Programmfehler";
  }
  public static string Report(Exception error,string version,DateTime started,string step){
   try{
    var all=Causes(error).ToArray();var steps=all.OfType<UpdateFailure>().Select(f=>f.Step).Where(s=>s!="Aktualisierungsprüfung").Distinct().ToArray();string actualStep=steps.Length>0?string.Join(" / ",steps):step,category=Category(error);
    var b=new StringBuilder();b.AppendLine("Notenblick – Fehlerdiagnose der Aktualisierungsprüfung");b.AppendLine("Notenblick-Version: "+Clean(version));b.AppendLine("Zeitpunkt der Prüfung (UTC): "+started.ToUniversalTime().ToString("o"));b.AppendLine("Fehlgeschlagener Schritt: "+actualStep);b.AppendLine("Fehlerkategorie: "+category);
    b.AppendLine("Technische Zusammenfassung: "+actualStep+" fehlgeschlagen; "+category+"; "+all.Last().GetType().FullName+".");
    b.AppendLine("CLR-Version: "+Environment.Version+"; Prozess: "+(IntPtr.Size*8)+" Bit");
    var target=Assembly.GetEntryAssembly()?.GetCustomAttribute<System.Runtime.Versioning.TargetFrameworkAttribute>();b.AppendLine("Deklariertes .NET-Ziel: "+(target?.FrameworkName??"nicht deklariert"));b.AppendLine("TLS-Vorgabe: "+ServicePointManager.SecurityProtocol+" (kein Nachweis des ausgehandelten Protokolls)");
    foreach(string option in new[]{"Switch.System.Net.DontEnableSchUseStrongCrypto","Switch.System.Net.DontEnableSystemDefaultTlsVersions"}){bool value;b.AppendLine(option+": "+(AppContext.TryGetSwitch(option,out value)?value.ToString():"nicht explizit gesetzt"));}
    b.AppendLine("Proxy: Windows-/Systemstandard; keine Adresse oder Zugangsdaten erfasst.");
    int index=0;foreach(var cause in all){b.AppendLine();b.AppendLine("Ursache "+(++index)+": "+cause.GetType().FullName);b.AppendLine("Meldung: "+Clean(cause.Message));b.AppendLine("HResult: 0x"+cause.HResult.ToString("X8"));var context=cause as UpdateFailure;if(context!=null){b.AppendLine("Schritt: "+context.Step);if(context.Endpoint!=null)b.AppendLine("Quelle: "+context.Endpoint);if(context.HttpStatus.HasValue)b.AppendLine("HTTP-Status: "+context.HttpStatus.Value);if(context.Response!=null)b.AppendLine("GitHub-Fehlerantwort: "+context.Response);}
     var web=cause as WebException;if(web!=null)b.AppendLine("WebExceptionStatus: "+web.Status);var socket=cause as System.Net.Sockets.SocketException;if(socket!=null)b.AppendLine("SocketError: "+socket.SocketErrorCode+"; NativeErrorCode: "+socket.NativeErrorCode);
     var frames=new System.Diagnostics.StackTrace(cause,false).GetFrames();if(frames!=null)foreach(var frame in frames){var method=frame.GetMethod();if(method!=null)b.AppendLine("  bei "+method.DeclaringType?.FullName+"."+method.Name);}
    }
    b.AppendLine();b.AppendLine("Nur lokale technische Diagnose. Persönliche Angaben wurden entfernt; keine Kopfzeilen, Dateiinhalte oder Gerätekennungen erfasst.");return b.ToString();
   }catch{return "Notenblick – Fehlerdiagnose\nSchritt: "+Clean(step)+"\nAusnahmetyp: "+error.GetType().FullName+"\nDie ausführliche Diagnose konnte nicht erstellt werden. Keine Daten wurden verändert.";}
  }
 }
 // No browser URLs or headers are accepted through the bridge. No credentials,
 // identifiers, installed version, data or statistics are sent to GitHub.
 public static class UpdateSource {
  public delegate Task<byte[]> Fetch(string url,long maximum,bool asset,CancellationToken cancel,Action<long,long> progress);
  public const string Repository="sappelmueller/Notenblick",Api="https://api.github.com/repos/"+Repository;
  public const long RepositoryId=1432518047;
  public static bool Allowed(Uri uri,bool asset){
   if(uri==null||uri.Scheme!="https"||!uri.IsDefaultPort||uri.UserInfo!=""||uri.Fragment!="")return false;
   if(uri.Host=="api.github.com")return uri.AbsolutePath.StartsWith("/repos/"+Repository+"/",StringComparison.Ordinal)||uri.AbsolutePath=="/repos/"+Repository;
   if(!asset)return false;
   if(uri.Host=="github.com")return uri.AbsolutePath.StartsWith("/"+Repository+"/releases/download/v",StringComparison.Ordinal);
   return uri.Host=="release-assets.githubusercontent.com"||uri.Host=="objects.githubusercontent.com";
  }
  internal static HttpWebRequest Request(Uri uri,bool asset){
    if(!Allowed(uri,asset))throw new InvalidDataException("Update source");
    // Launcher declares .NET Framework 4.8 and enables its modern TLS compatibility
    // before System.Net initializes. SystemDefault is therefore accepted by
    // SslState and leaves protocol negotiation to Windows, also after redirects.
    ServicePointManager.SecurityProtocol=SecurityProtocolType.SystemDefault;
    var req=(HttpWebRequest)WebRequest.Create(uri);req.AllowAutoRedirect=false;req.Method="GET";req.UserAgent="Notenblick-Updater";req.Accept=asset?"application/octet-stream":"application/vnd.github+json";req.UseDefaultCredentials=false;req.Credentials=null;req.CookieContainer=null;req.Timeout=20000;req.ReadWriteTimeout=20000;
    return req;
  }
  public static async Task<byte[]> Read(string url,long maximum,bool asset,CancellationToken cancel,Action<long,long> progress=null){
   var uri=new Uri(url);for(int hop=0;hop<5;hop++){
    var req=Request(uri,asset);
    using(cancel.Register(req.Abort)){
     try{using(var response=(HttpWebResponse)await req.GetResponseAsync().ConfigureAwait(false)){
      int code=(int)response.StatusCode;if(code==301||code==302||code==303||code==307||code==308){if(!asset)throw new UpdateFailure("API-Weiterleitung prüfen",new InvalidDataException("API redirect"),UpdateDiagnostics.Endpoint(uri),code);uri=new Uri(uri,response.Headers["Location"]);continue;}
      if(code!=200||response.ContentLength>maximum)throw new UpdateFailure("HTTP-Antwort prüfen",new InvalidDataException("Download size/status"),UpdateDiagnostics.Endpoint(uri),code);
      using(var source=response.GetResponseStream())using(var bytes=new MemoryStream()){
       var buffer=new byte[32768];int n;long length=0;while((n=await source.ReadAsync(buffer,0,buffer.Length,cancel).ConfigureAwait(false))>0){length+=n;if(length>maximum)throw new InvalidDataException("Download limit");bytes.Write(buffer,0,n);progress?.Invoke(length,response.ContentLength);}
       if(response.ContentLength>=0&&length!=response.ContentLength)throw new InvalidDataException("Incomplete download");return bytes.ToArray();
      }
     }}catch(WebException error){var failure=await UpdateDiagnostics.Transport(error,uri,cancel).ConfigureAwait(false);if(cancel.IsCancellationRequested)throw new OperationCanceledException("Update request cancelled or timed out",failure,cancel);throw failure;}
    }
   }throw new InvalidDataException("Redirect limit");
  }
  public static JToken Json(byte[] bytes){
   using(var text=new StringReader(new UTF8Encoding(false,true).GetString(bytes)))using(var reader=new JsonTextReader(text){MaxDepth=24,DateParseHandling=DateParseHandling.None}){
    var value=JToken.Load(reader,new JsonLoadSettings{DuplicatePropertyNameHandling=DuplicatePropertyNameHandling.Error});if(reader.Read())throw new InvalidDataException("Trailing JSON");return value;
   }
  }
  public static bool NotesValid(JToken notes){return notes is JArray&&notes.Count()>=3&&notes.Count()<=5&&notes.All(n=>n.Type==JTokenType.String&&((string)n).Length>=5&&((string)n).Length<=240&&!Regex.IsMatch((string)n,@"[<>\x00-\x1f]|https?://|\b(commit|sha[- ]?256|AnyCPU|WebView2)\b|[a-f0-9]{40,}|\.(exe|dll|json)\b",RegexOptions.IgnoreCase));}
  static JObject Asset(JObject release,string name){var assets=release["assets"] as JArray;if(assets==null)return null;var found=assets.OfType<JObject>().Where(a=>(string)a["name"]==name&&(string)a["state"]=="uploaded").ToArray();return found.Length==1?found[0]:null;}
  static string AssetUrl(JObject asset,string version,string name){
   var value=(string)asset["browser_download_url"];var expected="https://github.com/"+Repository+"/releases/download/v"+version+"/"+name;
   if(value!=expected||asset["id"]?.Type!=JTokenType.Integer||(long)asset["id"]<=0)throw new InvalidDataException("Asset origin");return value;
  }
  public static UpdateOffer Descriptor(JObject release,JObject manifest,string installed){
   string version=(string)release["tag_name"];if(version==null||!version.StartsWith("v",StringComparison.Ordinal))throw new InvalidDataException();version=version.Substring(1);
   if(release["draft"]?.Type!=JTokenType.Boolean||(bool)release["draft"]||release["prerelease"]?.Type!=JTokenType.Boolean||(bool)release["prerelease"]||release["id"]?.Type!=JTokenType.Integer||release["published_at"]?.Type!=JTokenType.String||UpdateTransaction.VersionNumber(version)<=UpdateTransaction.VersionNumber(installed))throw new InvalidDataException("Release");
   if(manifest["schema"]?.Type!=JTokenType.Integer||(int)manifest["schema"]!=1||manifest["repositoryId"]?.Type!=JTokenType.Integer||(long)manifest["repositoryId"]!=RepositoryId||(string)manifest["repository"]!=Repository||manifest["approved"]?.Type!=JTokenType.Boolean||!(bool)manifest["approved"]||(string)manifest["version"]!=version||manifest["dataSchema"]?.Type!=JTokenType.Integer||(int)manifest["dataSchema"]!=1||UpdateTransaction.VersionNumber((string)manifest["minimumUpdater"])>UpdateTransaction.VersionNumber(installed)||!NotesValid(manifest["notes"]))throw new InvalidDataException("Unapproved/incompatible manifest");
   string name="Notenblick_"+version+".zip";var archive=manifest["archive"] as JObject;var asset=Asset(release,name);if(archive==null||asset==null||(string)archive["name"]!=name||archive["bytes"]?.Type!=JTokenType.Integer||asset["size"]?.Type!=JTokenType.Integer)throw new InvalidDataException("Archive");
   long size=(long)archive["bytes"];string hash=(string)archive["sha256"];if(size<1||size>64*1024*1024||size!=(long)asset["size"]||hash==null||!Regex.IsMatch(hash,"^[a-f0-9]{64}$"))throw new InvalidDataException("Archive record");
   if(asset["digest"]?.Type==JTokenType.String&&(string)asset["digest"]!="sha256:"+hash)throw new InvalidDataException("GitHub digest");
   var list=manifest["files"] as JArray;if(list==null||list.Count>512)throw new InvalidDataException("Files");var files=new List<UpdateFile>();
   foreach(var item in list){if(item["path"]?.Type!=JTokenType.String||item["bytes"]?.Type!=JTokenType.Integer||item["sha256"]?.Type!=JTokenType.String)throw new InvalidDataException("File record");files.Add(new UpdateFile((string)item["path"],(long)item["bytes"],(string)item["sha256"]));}UpdateTransaction.FileList(files);
   var names=new HashSet<string>(files.Select(f=>f.Path),StringComparer.Ordinal);foreach(var required in new[]{"Notenblick.exe","Programm/Notenblick.html","Programm/Windows/Notenblick.Fenster.dll","Programm/Windows/Notenblick.Speicherung.dll","Programm/Windows/Newtonsoft.Json.dll","Programm/Windows/Microsoft.Web.WebView2.Core.dll","Programm/Windows/Microsoft.Web.WebView2.WinForms.dll","Programm/Windows/Notenblick.Aktualisierung.exe","Programm/Windows/x86/WebView2Loader.dll","Programm/Windows/x64/WebView2Loader.dll","Programm/Windows/arm64/WebView2Loader.dll"})if(!names.Contains(required))throw new InvalidDataException("Incomplete portable release");
   return new UpdateOffer{Version=version,Notes=manifest["notes"].Values<string>().ToArray(),Files=files,Size=size,Sha256=hash,Url=AssetUrl(asset,version,name),ReleaseId=(long)release["id"]};
  }
  public static async Task<UpdateOffer> Discover(string installed,CancellationToken cancel,Fetch transport=null){
   string step="Versionsvergleich";try{
   var fetch=transport??Read;
   UpdateTransaction.VersionNumber(installed);
   step="Repository-Abfrage";var repoBytes=await fetch(Api,128*1024,false,cancel,null).ConfigureAwait(false);
   step="Repository-Antwort auswerten";var repo=Json(repoBytes);if(repo["id"]?.Type!=JTokenType.Integer||(long)repo["id"]!=RepositoryId||(string)repo["full_name"]!=Repository)throw new InvalidDataException("Repository identity");
   step="Release-Abfrage";var listBytes=await fetch(Api+"/releases?per_page=100",2*1024*1024,false,cancel,null).ConfigureAwait(false);
   step="Release-Antwort auswerten";var list=Json(listBytes) as JArray;if(list==null||list.Any(r=>!(r is JObject)))throw new InvalidDataException("Release catalogue");
   step="Versionsvergleich";
   var candidates=new List<Tuple<Version,JObject>>();foreach(var release in list.OfType<JObject>())try{var tag=(string)release["tag_name"];if(release["draft"]?.Type==JTokenType.Boolean&&!(bool)release["draft"]&&release["prerelease"]?.Type==JTokenType.Boolean&&!(bool)release["prerelease"]&&tag!=null&&tag.StartsWith("v",StringComparison.Ordinal)){var v=UpdateTransaction.VersionNumber(tag.Substring(1));if(v>UpdateTransaction.VersionNumber(installed))candidates.Add(Tuple.Create(v,release));}}catch(InvalidDataException){}
   Exception invalid=null;foreach(var pair in candidates.OrderByDescending(p=>p.Item1).Take(10)){
    string version=pair.Item1.ToString(3),name="Notenblick_"+version+"_Aktualisierung.json";var asset=Asset(pair.Item2,name);if(asset==null)continue;
    try{
     step="Freigabe-Datei abfragen";var bytes=await fetch(AssetUrl(asset,version,name),1024*1024,true,cancel,null).ConfigureAwait(false);
     step="Freigabe-Datei auswerten";if(asset["digest"]?.Type==JTokenType.String&&(string)asset["digest"]!="sha256:"+UpdateTransaction.Digest(bytes))throw new InvalidDataException("Descriptor digest");
     var manifest=Json(bytes) as JObject;if(manifest==null)throw new InvalidDataException();if(manifest["approved"]?.Type==JTokenType.Boolean&&!(bool)manifest["approved"])continue;
     return Descriptor(pair.Item2,manifest,installed);
    }catch(InvalidDataException error){invalid=error;}
   }if(invalid!=null){step="Freigabe-Datei auswerten";throw new InvalidDataException("Invalid published update",invalid);}return null;
   }catch(Exception error){throw UpdateDiagnostics.At(step,error);}
  }
  public static void Extract(byte[] bytes,UpdateOffer offer,string folder,CancellationToken cancel){
   if(bytes.LongLength!=offer.Size||UpdateTransaction.Digest(bytes)!=offer.Sha256)throw new InvalidDataException("Archive hash");UpdateTransaction.FileList(offer.Files);
   var crc=OfficePackage.DirectoryCrc(bytes);var expected=offer.Files.ToDictionary(f=>"Notenblick/"+f.Path,StringComparer.OrdinalIgnoreCase);var seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
   using(var zip=new ZipArchive(new MemoryStream(bytes,false),ZipArchiveMode.Read)){
    if(zip.Entries.Count!=expected.Count||crc.Count!=expected.Count)throw new InvalidDataException("File count");
    foreach(var entry in zip.Entries){cancel.ThrowIfCancellationRequested();UpdateFile f;if(!expected.TryGetValue(entry.FullName,out f)||entry.FullName!="Notenblick/"+f.Path||!seen.Add(entry.FullName)||entry.Length!=f.Size||(entry.ExternalAttributes&0x400)!=0)throw new InvalidDataException("Foreign path/size");
     var target=Path.Combine(folder,f.Path.Replace('/',Path.DirectorySeparatorChar));Directory.CreateDirectory(Path.GetDirectoryName(target));
     using(var source=entry.Open())using(var data=new MemoryStream()){
      var buffer=new byte[32768];int n;long length=0;uint actual=0xffffffff;while((n=source.Read(buffer,0,buffer.Length))>0){cancel.ThrowIfCancellationRequested();length+=n;if(length>f.Size)throw new InvalidDataException("Inflated size");actual=OfficePackage.UpdateCrc(actual,buffer,n);data.Write(buffer,0,n);}
      var content=data.ToArray();if(length!=f.Size||(actual^0xffffffff)!=crc[entry.FullName]||UpdateTransaction.Digest(content)!=f.Sha256)throw new InvalidDataException("File checksum");
      using(var output=new FileStream(target,FileMode.CreateNew,FileAccess.Write,FileShare.None)){output.Write(content,0,content.Length);output.Flush(true);}
     }
    }
   }UpdateTransaction.Verify(folder,offer.Files);
   var assembly=AssemblyName.GetAssemblyName(Path.Combine(folder,"Notenblick.exe"));if(assembly.Version.ToString(3)!=offer.Version)throw new InvalidDataException("Executable version");
   foreach(var name in new[]{"Notenblick.exe","Programm/Windows/Notenblick.Aktualisierung.exe","Programm/Windows/Notenblick.Fenster.dll","Programm/Windows/Notenblick.Speicherung.dll","Programm/Windows/Newtonsoft.Json.dll","Programm/Windows/Microsoft.Web.WebView2.Core.dll","Programm/Windows/Microsoft.Web.WebView2.WinForms.dll"})CheckPE(Path.Combine(folder,name),0x14c,true);
   foreach(var pair in new[]{Tuple.Create("x86",0x14c),Tuple.Create("x64",0x8664),Tuple.Create("arm64",0xaa64)})CheckPE(Path.Combine(folder,"Programm/Windows",pair.Item1,"WebView2Loader.dll"),pair.Item2,false);
  }
  public static void CheckPE(string path,int machine,bool anyCpu){
   var b=File.ReadAllBytes(path);if(b.Length<64||BitConverter.ToUInt16(b,0)!=0x5a4d)throw new InvalidDataException("PE");int pe=BitConverter.ToInt32(b,60);if(pe<64||pe>b.Length-24||BitConverter.ToUInt32(b,pe)!=0x4550||BitConverter.ToUInt16(b,pe+4)!=machine)throw new InvalidDataException("PE machine");
   if(!anyCpu)return;int opt=pe+24,sections=BitConverter.ToUInt16(b,pe+6),size=BitConverter.ToUInt16(b,pe+20);if(sections<1||sections>96||size<224||opt+size+(long)sections*40>b.Length||BitConverter.ToUInt16(b,opt)!=0x10b)throw new InvalidDataException("PE header");
   uint rva=BitConverter.ToUInt32(b,opt+96+14*8);for(int i=0;i<sections;i++){int s=opt+size+i*40;uint vs=BitConverter.ToUInt32(b,s+8),va=BitConverter.ToUInt32(b,s+12),rs=BitConverter.ToUInt32(b,s+16),raw=BitConverter.ToUInt32(b,s+20);if(rva>=va&&(ulong)rva<(ulong)va+Math.Max(vs,rs)){long at=(long)raw+rva-va;if(at<0||at>b.Length-20)throw new InvalidDataException("CLR");uint flags=BitConverter.ToUInt32(b,(int)at+16);if((flags&1)==0||(flags&(2|0x20000))!=0)throw new InvalidDataException("AnyCPU flags");return;}}throw new InvalidDataException("Missing CLR");
  }
 }
 public sealed class UpdateClient:IDisposable {
  readonly string root,version,prefsPath;readonly Func<string,CancellationToken,Task<UpdateOffer>> discover;readonly UpdateSource.Fetch fetch;readonly Func<Tuple<int,long>> identity;readonly object gate=new object();JObject prefs;Task<JObject> check;bool automaticAttempted;CancellationTokenSource download;FileStream preparedLock;UpdatePlan prepared;
  public UpdateClient(string root,string version,string preferences=null,Func<string,CancellationToken,Task<UpdateOffer>> discovery=null,UpdateSource.Fetch transport=null,Func<Tuple<int,long>> processIdentity=null){
   try{this.root=UpdateTransaction.RootPath(root);this.version=version;UpdateTransaction.VersionNumber(version);}catch(Exception error){throw UpdateDiagnostics.At("Installationsordner/Version prüfen",error);}
   discover=discovery??((v,c)=>UpdateSource.Discover(v,c));fetch=transport??UpdateSource.Read;identity=processIdentity;
   var dir=preferences??Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Notenblick","Aktualisierungen",UpdateTransaction.Digest(Encoding.UTF8.GetBytes(this.root.ToUpperInvariant())).Substring(0,24));
   try{dir=UpdateTransaction.RootPath(dir);if(dir.StartsWith(this.root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("Preference location");Directory.CreateDirectory(dir);prefsPath=Path.Combine(dir,"einstellungen.json");UpdateTransaction.NoLink(prefsPath);}catch(Exception error){throw UpdateDiagnostics.At("Lokale Update-Einstellungen öffnen",error);}
   try{prefs=File.Exists(prefsPath)&&new FileInfo(prefsPath).Length<=32768?UpdateSource.Json(File.ReadAllBytes(prefsPath)) as JObject:null;}catch{prefs=null;}if(prefs==null)prefs=new JObject();
  }
  void Save(){try{UpdateTransaction.RootPath(Path.GetDirectoryName(prefsPath));UpdateTransaction.AtomicText(prefsPath,prefs.ToString(Formatting.None));}catch(Exception error){throw UpdateDiagnostics.At("Lokale Speicherung der Update-Einstellungen",error);}}
  JObject PublicOffer(){try{var offer=prefs["offer"] as JObject;if(offer==null||UpdateTransaction.VersionNumber((string)offer["version"])<=UpdateTransaction.VersionNumber(version)||!UpdateSource.NotesValid(offer["notes"]))return null;return new JObject{{"version",offer["version"].DeepClone()},{"notes",offer["notes"].DeepClone()}};}catch{return null;}}
  public JObject State(){lock(gate)return new JObject{{"enabled",prefs["enabled"]?.Type==JTokenType.Boolean&&(bool)prefs["enabled"]},{"hiddenVersion",prefs["hiddenVersion"]?.Type==JTokenType.String?(string)prefs["hiddenVersion"]:""},{"offer",PublicOffer()}};}
  public JObject Preferences(JObject request){lock(gate){if(request["enabled"]!=null){if(request["enabled"].Type!=JTokenType.Boolean)throw new InvalidDataException();prefs["enabled"]=(bool)request["enabled"];}if(request["hiddenVersion"]!=null){string hidden=(string)request["hiddenVersion"];if(hidden!="")UpdateTransaction.VersionNumber(hidden);prefs["hiddenVersion"]=hidden;}Save();return State();}}
  public Task<JObject> Check(bool automatic){lock(gate){
   bool enabled=(bool)State()["enabled"];
   if(automatic&&!enabled){var skipped=State();skipped["checked"]=false;return Task.FromResult(skipped);}
   // A manual startup check also fulfils the optional startup check. Pending
   // manual/automatic requests share one task; later manual retries stay free.
   if(check!=null&&!check.IsCompleted){if(automatic||enabled)automaticAttempted=true;return check;}
   if(automatic&&automaticAttempted){var skipped=State();skipped["checked"]=false;return Task.FromResult(skipped);}
   if(automatic||enabled)automaticAttempted=true;
   return check=CheckNow();
  }}
  async Task<JObject> CheckNow(){string step="Aktualisierungsprüfung";try{using(var timeout=new CancellationTokenSource(TimeSpan.FromSeconds(45))){var offer=await discover(version,timeout.Token).ConfigureAwait(false);step="Lokale Speicherung des Prüfergebnisses";lock(gate){prefs["offer"]=offer?.Public();Save();var result=State();result["checked"]=true;return result;}}}catch(Exception error){throw UpdateDiagnostics.At(step,error);}}
  public async Task<string> Prepare(string requested,Action<string> progress){
   lock(gate){if(download!=null||prepared!=null)throw new IOException("Update already running");download=new CancellationTokenSource(TimeSpan.FromMinutes(10));}
   UpdatePlan plan=null;FileStream ownership=null;try{
    var cancel=download.Token;progress("checking");var offer=await discover(version,cancel).ConfigureAwait(false);if(offer==null||offer.Version!=requested)throw new InvalidDataException("Offer changed");
    ownership=UpdateTransaction.Acquire(root);var prior=UpdateTransaction.Current(root);if(UpdateTransaction.Pending(prior))throw new IOException("Pending update");
    plan=UpdateTransaction.Begin(root,offer.Version,identity);plan.Next=offer.Files;plan.Old=UpdateTransaction.Snapshot(root);
    progress("downloading:0");int previous=-1;var bytes=await fetch(offer.Url,offer.Size,true,cancel,(done,total)=>{int percent=(int)Math.Min(100,done*100/offer.Size);if(percent/10!=previous){previous=percent/10;progress("downloading:"+percent);}}).ConfigureAwait(false);
    progress("checking");await Task.Run(()=>UpdateSource.Extract(bytes,offer,Path.Combine(plan.Folder,"new"),cancel),cancel).ConfigureAwait(false);cancel.ThrowIfCancellationRequested();UpdateTransaction.Save(plan);
    lock(gate){prepared=plan;preparedLock=ownership;ownership=null;}return plan.Token;
   }catch{if(plan!=null)TryDiscard(plan);throw;}
   finally{ownership?.Dispose();lock(gate){download?.Dispose();download=null;}}
  }
  static void TryDiscard(UpdatePlan plan){try{if(File.Exists(Path.Combine(plan.Folder,"plan.xml")))UpdateTransaction.Mark(plan,"cancelled");UpdateTransaction.DiscardStaging(plan);if(!Directory.EnumerateFileSystemEntries(plan.Folder).Any())Directory.Delete(plan.Folder);}catch{}}
  public void Cancel(){lock(gate){download?.Cancel();if(prepared!=null){TryDiscard(prepared);prepared=null;preparedLock?.Dispose();preparedLock=null;}}}
  public UpdatePlan Take(string token){lock(gate){if(prepared==null||prepared.Token!=token||UpdateTransaction.Phase(prepared)!="ready")throw new InvalidDataException("Prepared update");UpdateTransaction.Verify(Path.Combine(prepared.Folder,"new"),prepared.Next);return prepared;}}
  public void HandedOff(){lock(gate){prepared=null;preparedLock?.Dispose();preparedLock=null;}}
  public void Dispose(){Cancel();}
 }
}
