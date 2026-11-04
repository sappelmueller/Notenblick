using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Reflection;
using System.Net;
using Newtonsoft.Json.Linq;
using Notenblick.Native;

static class UpdateProbe {
 static int count;static string temp,dist;
 static void Check(bool value,string message){if(!value)throw new Exception(message);count++;}
 static void Reject(Action action,string message){bool rejected=false;try{action();}catch{rejected=true;}Check(rejected,message);}
 static byte[] Bytes(string text){return Encoding.UTF8.GetBytes(text);}
 static void Put(string folder,string path,string value){string target=Path.Combine(folder,path.Replace('/',Path.DirectorySeparatorChar));Directory.CreateDirectory(Path.GetDirectoryName(target));File.WriteAllText(target,value);}
 static string Root(){string root=Path.Combine(temp,Guid.NewGuid().ToString("N"),"Notenblick ü mit Leerzeichen");Directory.CreateDirectory(root);Put(root,"Notenblick.exe","old-exe");Put(root,"Programm/old-only.txt","old-only");Put(root,"Programm/view.txt","old-view");Put(root,"Daten/Unterordner/Behalten.txt","Ausschließlich synthetisch: 2,75");Put(root,"Daten/Ansicht.json","{\"synthetisch\":true}");return root;}
 static string Data(string root){return string.Join("\n",Directory.GetFiles(Path.Combine(root,"Daten"),"*",SearchOption.AllDirectories).OrderBy(x=>x).Select(p=>p.Substring(root.Length)+":"+UpdateTransaction.Hash(p)+":"+File.GetLastWriteTimeUtc(p).Ticks+":"+File.GetAttributes(p)));}
 static UpdatePlan Plan(string root){var p=UpdateTransaction.Begin(root,"1.25.0",()=>Tuple.Create(int.MaxValue,1L));p.ParentId=int.MaxValue;p.ParentStart=1;Put(Path.Combine(p.Folder,"new"),"Notenblick.exe","new-exe");Put(Path.Combine(p.Folder,"new"),"Programm/view.txt","new-view");Put(Path.Combine(p.Folder,"new"),"Programm/new-only.txt","new-only");p.Old=UpdateTransaction.Snapshot(root);p.Next=UpdateTransaction.Snapshot(Path.Combine(p.Folder,"new"));UpdateTransaction.Save(p);UpdateTransaction.Mark(p,"authorized");return p;}
 static JObject Manifest(string version,List<UpdateFile> files,long size,string sha){return new JObject{{"schema",1},{"repository",UpdateSource.Repository},{"repositoryId",UpdateSource.RepositoryId},{"approved",true},{"version",version},{"minimumUpdater","1.24.0"},{"dataSchema",1},{"notes",new JArray("Notenblick startet jetzt maximiert.","Tastenkombinationen werden zuverlässiger angesagt.","Neue Versionen lassen sich direkt im Programm installieren.")},{"archive",new JObject{{"name","Notenblick_"+version+".zip"},{"bytes",size},{"sha256",sha}}},{"files",new JArray(files.Select(f=>new JObject{{"path",f.Path},{"bytes",f.Size},{"sha256",f.Sha256}}))}};}
 static JObject Asset(string version,string name,long size){return new JObject{{"id",123},{"name",name},{"state","uploaded"},{"size",size},{"browser_download_url","https://github.com/"+UpdateSource.Repository+"/releases/download/v"+version+"/"+name}};}
 static JObject Release(string version,long size){return new JObject{{"id",456},{"draft",false},{"prerelease",false},{"published_at","2026-11-03T12:00:00Z"},{"tag_name","v"+version},{"assets",new JArray(Asset(version,"Notenblick_"+version+".zip",size),Asset(version,"Notenblick_"+version+"_Aktualisierung.json",1000))}};}
 static byte[] Archive(string root,string extra=null,int attributes=0){using(var bytes=new MemoryStream()){
  using(var zip=new ZipArchive(bytes,ZipArchiveMode.Create,true)){foreach(var f in UpdateTransaction.Snapshot(root)){var entry=zip.CreateEntry("Notenblick/"+f.Path);entry.ExternalAttributes=unchecked((int)0x81a40000);using(var stream=entry.Open()){var b=File.ReadAllBytes(Path.Combine(root,f.Path));stream.Write(b,0,b.Length);}}if(extra!=null){var e=zip.CreateEntry(extra);e.ExternalAttributes=attributes;using(var stream=e.Open()){var b=Bytes("synthetic unexpected entry");stream.Write(b,0,b.Length);}}}return bytes.ToArray();}}
 static UpdateOffer Offer(byte[] bytes){var built=System.Reflection.AssemblyName.GetAssemblyName(Path.Combine(dist,"Notenblick.exe")).Version.ToString(3);return new UpdateOffer{Version=built,Files=UpdateTransaction.Snapshot(dist),Size=bytes.Length,Sha256=UpdateTransaction.Digest(bytes),Notes=new[]{"Neue Versionen sind leichter zu finden.","Notenblick startet jetzt maximiert.","Die Tastaturbedienung ist verbessert."},Url="https://github.com/"+UpdateSource.Repository+"/releases/download/v"+built+"/Notenblick_"+built+".zip"};}
 static string Empty(){var d=Path.Combine(temp,"extract-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(d);return d;}
 static async Task<Exception> Failure(Func<Task> work){try{await work();}catch(Exception error){return error;}throw new Exception("Expected diagnostic failure");}
 static async Task Diagnostics(bool live){
  var when=new DateTime(2026,11,3,12,34,56,DateTimeKind.Utc);
  var privateMessage="Denied 'C:\\Users\\PrivateTeacher\\School Files\\update.json'; /home/PrivateTeacher/secret/file; "+
   "https://user:password@private-proxy.example/check?token=PRIVATE; Bearer sensitive-bearer; token=sensitive-token; "+
   "test.private@example.org; 192.0.2.55; 2001:db8::1234; ghp_sensitiveprivate; github_pat_sensitiveprivate; "+
   "01234567-1234-1234-1234-123456789abc";
  var report=UpdateDiagnostics.Report(UpdateDiagnostics.At("Lokale Speicherung des Prüfergebnisses",new UnauthorizedAccessException(privateMessage,new IOException("Synthetic nested access failure"))),"1.24.0",when,"check");
  foreach(string field in new[]{"Notenblick-Version: 1.24.0","2026-11-03T12:34:56","Lokale Speicherung des Prüfergebnisses","Dateizugriff/lokale Speicherung","System.UnauthorizedAccessException","System.IO.IOException","Synthetic nested access failure","HResult:","CLR-Version:","TLS-Vorgabe:","Technische Zusammenfassung:"})Check(report.Contains(field),"Diagnostic field retained: "+field);
  foreach(string secret in new[]{"PrivateTeacher","School Files","private-proxy","user:password","sensitive-bearer","sensitive-token","test.private","192.0.2.55","2001:db8","ghp_sensitiveprivate","github_pat_sensitiveprivate","01234567-1234"})Check(!report.Contains(secret),"Private diagnostic value removed: "+secret);
  Check(!report.Contains("/workspace/")&&!report.Contains("/home/")&&!report.Contains("C:\\Users"),"No private paths in messages/stacks");
  Check(UpdateDiagnostics.Clean("Denied '/home/Private Teacher/private file.json'").IndexOf("Private",StringComparison.Ordinal)<0,"Quoted paths with spaces removed");
  Check(!UpdateDiagnostics.Clean("Der Remotename konnte nicht aufgelöst werden: 'PRIVATEPROXY42'").Contains("PRIVATEPROXY42"),"Single-label internal DNS host removed");
  var aggregate=UpdateDiagnostics.Report(new AggregateException(new IOException("cause one"),new InvalidOperationException("cause two")),"1.24.0",when,"check");Check(aggregate.Contains("cause one")&&aggregate.Contains("cause two"),"All aggregate branches retained");
  foreach(var pair in new[]{Tuple.Create(WebExceptionStatus.NameResolutionFailure,"DNS"),Tuple.Create(WebExceptionStatus.ProxyNameResolutionFailure,"Proxy/DNS"),Tuple.Create(WebExceptionStatus.TrustFailure,"Zertifikat"),Tuple.Create(WebExceptionStatus.SecureChannelFailure,"TLS"),Tuple.Create(WebExceptionStatus.Timeout,"Zeitüberschreitung/Abbruch")})Check(UpdateDiagnostics.Category(new WebException("Synthetic",pair.Item1))==pair.Item2,"Exact network category "+pair.Item1);
  var repository=Bytes(new JObject{{"id",UpdateSource.RepositoryId},{"full_name",UpdateSource.Repository}}.ToString());
  UpdateSource.Fetch releaseFailure=(u,m,a,c,p)=>u==UpdateSource.Api?Task.FromResult(repository):Task.FromException<byte[]>(new WebException("Synthetic DNS error",WebExceptionStatus.NameResolutionFailure));
  report=UpdateDiagnostics.Report(await Failure(async()=>{await UpdateSource.Discover("1.24.0",CancellationToken.None,releaseFailure);}),"1.24.0",when,"check");Check(report.Contains("Release-Abfrage")&&report.Contains("Synthetic DNS error")&&report.Contains("NameResolutionFailure"),"Exact release query and network root cause retained");
  UpdateSource.Fetch invalidRepository=(u,m,a,c,p)=>Task.FromResult(Bytes("not JSON"));report=UpdateDiagnostics.Report(await Failure(async()=>{await UpdateSource.Discover("1.24.0",CancellationToken.None,invalidRepository);}),"1.24.0",when,"check");Check(report.Contains("Repository-Antwort auswerten")&&report.Contains("JSON-Verarbeitung")&&report.Contains("JsonReaderException"),"JSON step and exception retained");
  UpdateSource.Fetch invalidVersion=(u,m,a,c,p)=>throw new Exception("Should not reach transport");report=UpdateDiagnostics.Report(await Failure(async()=>{await UpdateSource.Discover("invalid",CancellationToken.None,invalidVersion);}),"1.24.0",when,"check");Check(report.Contains("Versionsvergleich")&&report.Contains("InvalidDataException"),"Installed version failure before HTTP");
  foreach(string tag in new[]{"v1.23.2","v1.24.0","v1.23.2-oss.1"}){var r=Release("1.23.2",1);r["tag_name"]=tag;UpdateSource.Fetch old=(u,m,a,c,p)=>Task.FromResult(u==UpdateSource.Api?repository:Bytes(new JArray(r).ToString()));Check(await UpdateSource.Discover("1.24.0",CancellationToken.None,old)==null,"Current is successful, no diagnosis: "+tag);}
  var manifest=Manifest("1.25.0",UpdateTransaction.Snapshot(dist),1,new string('a',64));var release=Release("1.25.0",1);
  UpdateSource.Fetch newer=(u,m,a,c,p)=>Task.FromResult(u==UpdateSource.Api?repository:Bytes((u.Contains("/releases?")?(JToken)new JArray(release):manifest).ToString()));Check((await UpdateSource.Discover("1.24.0",CancellationToken.None,newer)).Version=="1.25.0","Approved newer release remains available");
  manifest["repositoryId"]=1;report=UpdateDiagnostics.Report(await Failure(async()=>{await UpdateSource.Discover("1.24.0",CancellationToken.None,newer);}),"1.24.0",when,"check");Check(report.Contains("Freigabe-Datei auswerten")&&report.Contains("Unapproved/incompatible manifest"),"Previously swallowed descriptor cause retained");
  var root=Root();var data=Data(root);var prefs=Path.Combine(temp,"diagnostic-prefs");Directory.CreateDirectory(Path.Combine(prefs,"einstellungen.json"));
  using(var client=new UpdateClient(root,"1.24.0",prefs,(v,c)=>Task.FromResult<UpdateOffer>(null))){report=UpdateDiagnostics.Report(await Failure(async()=>{await client.Check(false);}),"1.24.0",when,"check");Check(report.Contains("Lokale Speicherung des Prüfergebnisses")&&report.Contains("IOException"),"Successful discovery plus failed local save is precisely diagnosed");}
  Check(Data(root)==data,"Diagnostic failed save leaves synthetic data and metadata unchanged");
  var blocked=Path.Combine(temp,"blocked-preferences");File.WriteAllText(blocked,"synthetic");try{new UpdateClient(root,"1.24.0",blocked);throw new Exception("Expected initialization failure");}catch(UpdateFailure error){report=UpdateDiagnostics.Report(error,"1.24.0",when,"check");Check(report.Contains("Lokale Update-Einstellungen öffnen")&&!report.Contains(blocked),"Constructor failure is diagnosable without exposing location");}
  var cancelled=UpdateDiagnostics.At("Release-Abfrage",new OperationCanceledException("Synthetic cancellation"));Check(cancelled is OperationCanceledException&&UpdateDiagnostics.Report(cancelled,"1.24.0",when,"check").Contains("Release-Abfrage"),"Cancellation type and context retained for existing installer behavior");
  foreach(int code in new[]{403,407,429,500}){
   // Obtain an actual HTTP error response from a synthetic loopback server.
   // Only the test client uses HTTP/loopback; production source checks stay intact.
   var server=new System.Net.Sockets.TcpListener(IPAddress.Loopback,0);server.Start();
   try{
    var address=(IPEndPoint)server.LocalEndpoint;string json=new JObject{{"message","Synthetic GitHub rejection; token=sensitive-token"}}.ToString();byte[] body=Bytes(json);
    var reply=Task.Run(async()=>{using(var peer=await server.AcceptTcpClientAsync())using(var stream=peer.GetStream()){var buffer=new byte[4096];await stream.ReadAsync(buffer,0,buffer.Length);var header=Bytes("HTTP/1.1 "+code+" Synthetic failure\r\nContent-Type: application/json\r\nSet-Cookie: session=sensitive-cookie\r\nContent-Length: "+body.Length+"\r\nConnection: close\r\n\r\n");await stream.WriteAsync(header,0,header.Length);await stream.WriteAsync(body,0,body.Length);}});
    var request=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+address.Port+"/");request.Proxy=null;request.Timeout=5000;
    var error=await Failure(async()=>{using(var response=await request.GetResponseAsync()){} });var transport=await UpdateDiagnostics.Transport((WebException)error,new Uri(UpdateSource.Api),CancellationToken.None);await reply;
    report=UpdateDiagnostics.Report(UpdateDiagnostics.At("Repository-Abfrage",transport),"1.24.0",when,"check");Check(report.Contains("HTTP-Status: "+code)&&report.Contains("Synthetic GitHub rejection")&&report.Contains("System.Net.WebException"),"HTTP status, GitHub body and original exception retained: "+code);Check(!report.Contains("sensitive-token")&&!report.Contains("sensitive-cookie")&&!report.Contains("127.0.0.1"),"HTTP diagnosis excludes credentials/cookies/address: "+code);
   }finally{server.Stop();}
  }
  Check(!UpdateDiagnostics.GitHubResponse(Bytes("<html>private-person-and-cookie</html>")).Contains("private-person"),"Unexpected HTML response is not copied");
  Check(!UpdateSource.Allowed(new Uri("http://127.0.0.1/test"),false)&&!UpdateSource.Allowed(new Uri("https://foreign.example/test"),true),"Source restrictions remain intact");
  Reject(()=>UpdateTransaction.LogicalPath("Daten/private.txt"),"Data folder remains forbidden");
  if(live)using(var timeout=new CancellationTokenSource(TimeSpan.FromSeconds(45))){Check(await UpdateSource.Discover("1.24.0",timeout.Token)==null,"Live GitHub check: current");Console.WriteLine("Live HTTPS check: current; no Windows-cause claim.");}
  Console.WriteLine("Updater diagnostic checks passed: "+count+"; controlled network/filesystem failures, privacy and optional live HTTPS; no Windows clipboard/NVDA execution.");
 }
 public static async Task Main(string[] args){dist=Path.GetFullPath(args[0]);temp=Path.Combine(Path.GetTempPath(),"notenblick-updates-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(temp);try{
  if(args.Contains("--live-only")){using(var timeout=new CancellationTokenSource(TimeSpan.FromSeconds(45)))Check(await UpdateSource.Discover("1.24.0",timeout.Token)==null,"Live GitHub check: current");Console.WriteLine("One live updater HTTPS check passed: current; .NET 8/Linux, no Windows TLS claim.");return;}
  if(args.Contains("--diagnostics")){await Diagnostics(args.Contains("--live"));return;}
  // Reproduce the legacy process-wide TLS selection of the directly compiled
  // Windows launcher. Request construction must repair it before connecting.
  var priorTls=ServicePointManager.SecurityProtocol;var priorCertificates=ServicePointManager.ServerCertificateValidationCallback;
  try{
   foreach(bool asset in new[]{false,true}){
    ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls;
    var request=UpdateSource.Request(new Uri(asset?"https://release-assets.githubusercontent.com/synthetic":UpdateSource.Api),asset);
    Check(ServicePointManager.SecurityProtocol==SecurityProtocolType.SystemDefault,"Windows selects secure TLS despite legacy process defaults");
    Check(request.ServerCertificateValidationCallback==null&&ServicePointManager.ServerCertificateValidationCallback==priorCertificates,"Certificate validation remains enabled");
    Check(!request.AllowAutoRedirect&&request.Method=="GET"&&request.UserAgent=="Notenblick-Updater","Controlled HTTP requests and redirects preserved");
    Check(!request.UseDefaultCredentials&&request.Credentials==null&&request.CookieContainer==null,"No credentials or cookies sent");
    Check(request.Accept==(asset?"application/octet-stream":"application/vnd.github+json")&&request.Timeout==20000&&request.ReadWriteTimeout==20000,"GitHub media types and timeouts preserved");request.Abort();
   }
   Reject(()=>UpdateSource.Request(new Uri("https://evil.example/update"),true),"Foreign request rejected before connection");
  }finally{ServicePointManager.SecurityProtocol=priorTls;}
  foreach(var bad in new[]{"Daten/Ansicht.json","Programm/../Daten/a","Programm/Daten/a","/Notenblick.exe","Programm\\x","Programm/C:/x","Programm/CON.txt","Programm/COM¹.txt","Programm/CONIN$","Programm/PRN .txt","Programm/a.","Programm/a ","Programm/a//b","Programm/a\u0000.txt","Notenblick.exe/other","Programm/a:b"})Reject(()=>UpdateTransaction.LogicalPath(bad),"Unsafe logical path: "+bad);
  foreach(var bad in new[]{"1.24","01.24.0","1.24.0-beta","v1.24.0","1.24.0.1","-1.24.0","1.24.0+test"})Reject(()=>UpdateTransaction.VersionNumber(bad),"Invalid version: "+bad);
  var root=Root();string before=Data(root);using(UpdateTransaction.Acquire(root)){
   var p=Plan(root);UpdateTransaction.Install(p,()=>true);UpdateTransaction.Verify(root,p.Next,true);Check(!File.Exists(Path.Combine(root,"Programm/old-only.txt")),"No mixed old files");Check(UpdateTransaction.Phase(p)=="committed","Committed");Check(Data(root)==before,"Data unchanged on success");UpdateTransaction.Recover(p);Check(Data(root)==before,"Committed recovery does not change data");Check(Directory.Exists(Path.Combine(p.Folder,"old","Programm")),"Old complete program retained outside data");
  }
  foreach(var boundary in new[]{"backed-up","moving-program","old-program-moved","new-program-moved","program-installed","new-exe-replaced","installed","verified"}){
   root=Root();before=Data(root);using(UpdateTransaction.Acquire(root)){var p=Plan(root);Reject(()=>UpdateTransaction.Install(p,()=>true,null,step=>{if(step==boundary)throw new IOException("Simulated power interruption");}),"Boundary interruption "+boundary);var resumed=UpdateTransaction.Read(root,p.Token);UpdateTransaction.Recover(resumed);UpdateTransaction.Verify(root,p.Old,true);Check(Data(root)==before,"Data unchanged after "+boundary);UpdateTransaction.Recover(resumed);Check(!UpdateTransaction.Pending(resumed),"Idempotent recovery "+boundary);}
  }
  root=Root();before=Data(root);using(UpdateTransaction.Acquire(root)){var p=Plan(root);Reject(()=>UpdateTransaction.Install(p,()=>false),"New executable rejects probe");UpdateTransaction.Recover(p);UpdateTransaction.Verify(root,p.Old,true);Check(Data(root)==before,"Failed health probe leaves data unchanged");}
  root=Root();using(UpdateTransaction.Acquire(root)){var p=Plan(root);using(var held=new FileStream(Path.Combine(root,"Notenblick.exe"),FileMode.Open,FileAccess.ReadWrite,FileShare.None))Reject(()=>UpdateTransaction.Install(p,()=>true),"Held executable prevents preparation");UpdateTransaction.Recover(p);UpdateTransaction.Verify(root,p.Old,true);Reject(()=>UpdateTransaction.Acquire(root),"Exclusive transaction lock");var text=File.ReadAllText(Path.Combine(p.Folder,"plan.xml"));File.WriteAllText(Path.Combine(p.Folder,"plan.xml"),text.Replace(p.Root,Path.Combine(p.Root,"Daten")));Reject(()=>UpdateTransaction.Read(root,p.Token),"Retargeted journal rejected");}
  Reject(()=>UpdateTransaction.RootPath(Path.Combine(root,"Daten")),"Data can never become the installation root");
  var bytes=Archive(dist);var offer=Offer(bytes);UpdateSource.Extract(bytes,offer,Empty(),CancellationToken.None);count++;
  using(var cancelled=new CancellationTokenSource()){cancelled.Cancel();Reject(()=>UpdateSource.Extract(bytes,offer,Empty(),cancelled.Token),"Cancelled extraction");}
  var damaged=(byte[])bytes.Clone();damaged[damaged.Length/2]^=1;Reject(()=>UpdateSource.Extract(damaged,offer,Empty(),CancellationToken.None),"Damaged payload hash");
  foreach(var extra in new[]{"Notenblick/Daten/Noten.txt","Notenblick/Programm/../Daten/Noten.txt","Other.exe","Notenblick/Programm/unexpected.txt","Notenblick/Programm/view-link"}){var b=Archive(dist,extra,extra.EndsWith("link")?unchecked((int)0xa1ff0000):0);var o=Offer(b);Reject(()=>UpdateSource.Extract(b,o,Empty(),CancellationToken.None),"Foreign/traversal/link payload: "+extra);}
  var orphan=bytes.Concat(Bytes("foreign trailing payload")).ToArray();Reject(()=>UpdateSource.Extract(orphan,Offer(orphan),Empty(),CancellationToken.None),"Trailing archive payload");
  var wrong=Offer(bytes);wrong.Version="99.0.0";Reject(()=>UpdateSource.Extract(bytes,wrong,Empty(),CancellationToken.None),"Executable version mismatch");
  var files=UpdateTransaction.Snapshot(dist);var manifest=Manifest("1.25.0",files,bytes.Length,UpdateTransaction.Digest(bytes));var release=Release("1.25.0",bytes.Length);Check(UpdateSource.Descriptor(release,manifest,"1.24.0").Version=="1.25.0","Valid approved higher release");
  foreach(var field in new[]{"approved","repositoryId","version","dataSchema","minimumUpdater","notes"}){var m=(JObject)manifest.DeepClone();switch(field){case "approved":m[field]=false;break;case "repositoryId":m[field]=1;break;case "version":m[field]="1.26.0";break;case "dataSchema":m[field]=2;break;case "minimumUpdater":m[field]="1.26.0";break;case "notes":m[field]=new JArray("Commit 1234567 WebView2", "SHA-256 Teststatistik", "Neue DLL und EXE");break;}Reject(()=>UpdateSource.Descriptor(release,m,"1.24.0"),"Rejected manifest: "+field);}
  foreach(var field in new[]{"draft","prerelease"}){var r=(JObject)release.DeepClone();r[field]=true;Reject(()=>UpdateSource.Descriptor(r,manifest,"1.24.0"),"Ignore "+field);}
  Reject(()=>UpdateSource.Descriptor(release,manifest,"1.25.0"),"Same version is not an update");Reject(()=>UpdateSource.Descriptor(release,manifest,"1.26.0"),"No downgrade");
  foreach(var url in new[]{"http://github.com/sappelmueller/Notenblick/releases/download/v1.25.0/a.zip","https://evil.example/a.zip","https://release-assets.githubusercontent.com.evil.example/a","https://github.com/other/project/releases/download/v1.25.0/a.zip","https://user:password@github.com/sappelmueller/Notenblick/releases/download/v1.25.0/a.zip","https://release-assets.githubusercontent.com:444/a","https://raw.githubusercontent.com/a"})Check(!UpdateSource.Allowed(new Uri(url),true),"Disallowed source/redirect: "+url);
  foreach(var url in new[]{"https://release-assets.githubusercontent.com/a","https://objects.githubusercontent.com/a","https://github.com/sappelmueller/Notenblick/releases/download/v1.25.0/a.zip"})Check(UpdateSource.Allowed(new Uri(url),true),"Approved GitHub asset host");
  Reject(()=>UpdateSource.Json(Bytes("{\"approved\":true,\"approved\":false}")),"Duplicate JSON fields");
  int requests=0;var published=(JObject)manifest.DeepClone();UpdateSource.Fetch catalogue=(url,max,asset,cancel,progress)=>{requests++;if(url==UpdateSource.Api)return Task.FromResult(Bytes(new JObject{{"id",UpdateSource.RepositoryId},{"full_name",UpdateSource.Repository}}.ToString()));if(url.Contains("/releases?"))return Task.FromResult(Bytes(new JArray(release).ToString()));return Task.FromResult(Bytes(published.ToString()));};
  Check((await UpdateSource.Discover("1.24.0",CancellationToken.None,catalogue)).Version=="1.25.0"&&requests==3,"Controlled official release catalogue");published["approved"]=false;Check(await UpdateSource.Discover("1.24.0",CancellationToken.None,catalogue)==null,"Unapproved stable release ignored");
  var repository=Bytes(new JObject{{"id",UpdateSource.RepositoryId},{"full_name",UpdateSource.Repository}}.ToString());
  foreach(string tag in new[]{"v1.23.2","v1.24.0","v1.23.2-oss.1"}){
   int calls=0;var old=Release("1.23.2",1);old["tag_name"]=tag;
   UpdateSource.Fetch older=(url,max,asset,cancel,progress)=>{calls++;Check(!asset,"Older/equal releases do not download assets");return Task.FromResult(url==UpdateSource.Api?repository:Bytes(new JArray(old).ToString()));};
   Check(await UpdateSource.Discover("1.24.0",CancellationToken.None,older)==null&&calls==2,"Current with published "+tag);
  }
  Check(UpdateTransaction.VersionNumber("1.10.0")>UpdateTransaction.VersionNumber("1.9.0"),"Numeric version comparison");
  foreach(string invalid in new[]{"not JSON","{}","null","[null]"}){
   UpdateSource.Fetch broken=(url,max,asset,cancel,progress)=>Task.FromResult(url==UpdateSource.Api?repository:Bytes(invalid));
   // [null] is valid JSON but not a valid GitHub release catalogue.
   Reject(()=>UpdateSource.Discover("1.24.0",CancellationToken.None,broken).GetAwaiter().GetResult(),"Malformed catalogue fails: "+invalid);
  }
  foreach(string field in new[]{"draft","prerelease"}){var ignored=Release("1.25.0",1);ignored[field]=true;UpdateSource.Fetch hidden=(u,m,a,c,p)=>Task.FromResult(u==UpdateSource.Api?repository:Bytes(new JArray(ignored).ToString()));Check(await UpdateSource.Discover("1.24.0",CancellationToken.None,hidden)==null,"Discovery ignores "+field);}
  foreach(var status in new[]{WebExceptionStatus.NameResolutionFailure,WebExceptionStatus.ConnectFailure,WebExceptionStatus.Timeout,WebExceptionStatus.ProtocolError}){UpdateSource.Fetch failed=(u,m,a,c,p)=>Task.FromException<byte[]>(new WebException("Controlled transport failure",status));Reject(()=>UpdateSource.Discover("1.24.0",CancellationToken.None,failed).GetAwaiter().GetResult(),"Transport failure never means current: "+status);}
  UpdateSource.Fetch wrongRepository=(u,m,a,c,p)=>Task.FromResult(Bytes("{\"id\":1,\"full_name\":\"foreign/project\"}"));Reject(()=>UpdateSource.Discover("1.24.0",CancellationToken.None,wrongRepository).GetAwaiter().GetResult(),"Wrong repository identity fails");
  published["approved"]=true;published["repositoryId"]=1;Reject(()=>UpdateSource.Discover("1.24.0",CancellationToken.None,catalogue).GetAwaiter().GetResult(),"Invalid published descriptor never means current");
  using(var cancelled=new CancellationTokenSource()){cancelled.Cancel();Reject(()=>UpdateSource.Read(UpdateSource.Api,128*1024,false,cancelled.Token).GetAwaiter().GetResult(),"Cancelled real HTTP request fails safely");}
  int checks=0;Func<string,CancellationToken,Task<UpdateOffer>> lookup=(v,c)=>{checks++;return Task.FromResult(offer);};root=Root();before=Data(root);var prefs=Path.Combine(temp,"preferences");
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup)){
   Check(!(bool)client.State()["enabled"],"Automatic checking defaults off");Check(!(bool)(await client.Check(true))["checked"]&&checks==0,"No unsolicited request");client.Preferences(new JObject{{"enabled",true}});await client.Check(true);Check(checks==1,"First opt-in automatic check");await client.Check(true);Check(checks==1,"At most one automatic attempt per process");await client.Check(false);Check(checks==2,"Manual check independent");await client.Check(true);Check(checks==2,"No extra automatic attempt in the same process");client.Preferences(new JObject{{"hiddenVersion","1.24.0"}});Check((string)client.State()["hiddenVersion"]=="1.24.0","Hide exact version");
  }
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup)){Check((bool)client.State()["enabled"]&&(string)client.State()["offer"]["version"]==offer.Version,"Updater preferences/cache survive restart outside data");await client.Check(true);Check(checks==3,"Immediate restart checks again without a time limit");}
  // A legacy timestamp, even one in the future, cannot suppress a new start.
  var prefsFile=Path.Combine(prefs,"einstellungen.json");var legacy=JObject.Parse(File.ReadAllText(prefsFile));legacy["lastAutomaticUtc"]=DateTime.UtcNow.AddYears(1).ToString("o");File.WriteAllText(prefsFile,legacy.ToString());
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup)){await client.Check(true);Check(checks==4,"Legacy/future automatic timestamp is ignored");client.Preferences(new JObject{{"enabled",false}});await client.Check(true);Check(checks==4,"Disabling prevents automatic requests");await client.Check(false);Check(checks==5,"Manual check works with automatic checks disabled");}
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup)){await client.Check(true);Check(checks==5,"Disabled preference survives process restart without network");}
  Check(Data(root)==before,"Updater preferences leave data unchanged");
  using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"offline"),(v,c)=>Task.FromException<UpdateOffer>(new System.Net.WebException("Controlled offline"))))Reject(()=>client.Check(false).GetAwaiter().GetResult(),"Offline check safely fails");
  root=Root();before=Data(root);UpdateSource.Fetch download=(u,m,a,c,p)=>{p?.Invoke(bytes.Length,bytes.Length);return Task.FromResult(bytes);};using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"prepare"),lookup,download,()=>Tuple.Create(int.MaxValue,1L))){var token=await client.Prepare(offer.Version,s=>{});Check(client.Take(token).Token==token,"Verified preparation token");client.Cancel();Reject(()=>client.Take(token),"Cancel invalidates preparation");Check(!UpdateTransaction.Pending(UpdateTransaction.Current(root)),"Cancelled transaction cannot install");}Check(Data(root)==before,"Cancelled preparation leaves data unchanged");

  root=Root();Directory.Delete(Path.Combine(root,"Daten"),true);using(UpdateTransaction.Acquire(root)){var p=Plan(root);UpdateTransaction.Install(p,()=>true);Check(!Directory.Exists(Path.Combine(root,"Daten")),"Installation never creates a missing data folder");}
  root=Root();before=Data(root);Reject(()=>new UpdateClient(root,"1.24.0",Path.Combine(root,"Daten","update-options")),"Updater options can never enter data");Check(Data(root)==before,"Rejected preference location leaves data unchanged");
  var pendingOffer=new TaskCompletionSource<UpdateOffer>();int simultaneous=0;using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"coalesced"),(v,c)=>{simultaneous++;return pendingOffer.Task;})){
   var first=client.Check(false);var second=client.Check(false);Check(Object.ReferenceEquals(first,second)&&simultaneous==1,"Concurrent checks share one native request");pendingOffer.SetResult(offer);await first;
  }
  int offlineAttempts=0;using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"startup-offline"),(v,c)=>{offlineAttempts++;return Task.FromException<UpdateOffer>(new IOException("Controlled offline"));})){
   client.Preferences(new JObject{{"enabled",true}});Reject(()=>client.Check(true).GetAwaiter().GetResult(),"Automatic offline attempt");Check(!(bool)(await client.Check(true))["checked"]&&offlineAttempts==1,"Failed automatic attempt runs only once in this process");Reject(()=>client.Check(false).GetAwaiter().GetResult(),"Manual retry after automatic failure");Check(offlineAttempts==2,"Manual retry is independent of failed automatic check");
  }
  var offlinePrefs=Path.Combine(temp,"offline-restart");int restartAttempts=0;
  Func<string,CancellationToken,Task<UpdateOffer>> restartLookup=(v,c)=>{restartAttempts++;return restartAttempts==1?Task.FromException<UpdateOffer>(new IOException("Controlled offline")):Task.FromResult(offer);};
  using(var client=new UpdateClient(root,"1.23.3",offlinePrefs,restartLookup)){client.Preferences(new JObject{{"enabled",true}});Reject(()=>client.Check(true).GetAwaiter().GetResult(),"First process is offline");}
  using(var client=new UpdateClient(root,"1.23.3",offlinePrefs,restartLookup)){await client.Check(true);Check(restartAttempts==2&&(string)client.State()["offer"]["version"]==offer.Version,"Next process retries immediately after offline start");}
  using(var client=new UpdateClient(root,"1.23.3",offlinePrefs,(v,c)=>Task.FromException<UpdateOffer>(new IOException("Controlled offline again")))){Reject(()=>client.Check(true).GetAwaiter().GetResult(),"Cached offer with offline start");Check((string)client.State()["offer"]["version"]==offer.Version,"Failed discovery preserves cached offer");}
  foreach(bool automaticFirst in new[]{false,true}){
   var pending=new TaskCompletionSource<UpdateOffer>();int lookups=0;using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"overlap-"+automaticFirst),(v,c)=>{lookups++;return pending.Task;})){
    client.Preferences(new JObject{{"enabled",true}});var first=client.Check(automaticFirst);var second=client.Check(!automaticFirst);Check(Object.ReferenceEquals(first,second)&&lookups==1,"Manual/automatic overlap shares one pending request: "+automaticFirst);pending.SetResult(offer);await first;await client.Check(true);Check(lookups==1,"Delayed automatic trigger does not repeat completed startup check: "+automaticFirst);await client.Check(false);Check(lookups==2,"Later manual checks stay available: "+automaticFirst);
   }
  }
  var downloading=new TaskCompletionSource<bool>();UpdateSource.Fetch waitDownload=async(u,m,a,c,p)=>{downloading.SetResult(true);await Task.Delay(Timeout.Infinite,c);return bytes;};
  using(var client=new UpdateClient(root,"1.24.0",Path.Combine(temp,"cancel-download"),lookup,waitDownload,()=>Tuple.Create(int.MaxValue,1L))){var work=client.Prepare(offer.Version,phase=>{});if(await Task.WhenAny(downloading.Task,work,Task.Delay(5000))!=downloading.Task){client.Cancel();if(work.IsCompleted)await work;throw new Exception("Download did not start");}client.Cancel();Reject(()=>work.GetAwaiter().GetResult(),"Native cancellation stops active download");Check(Data(root)==before,"Cancelled native download leaves data untouched");}
  using(var client=new UpdateClient(root,"1.24.0",Path.Combine(temp,"tampered-stage"),lookup,download,()=>Tuple.Create(int.MaxValue,1L))){var token=await client.Prepare(offer.Version,phase=>{});var plan=client.Take(token);File.AppendAllText(Path.Combine(plan.Folder,"new/Programm/Notenblick.html"),"changed after verification");Reject(()=>client.Take(token),"Staged tampering detected again before handoff");client.Cancel();Check(Data(root)==before,"Tampered staging never changes data");}
  var launched=Assembly.LoadFile(Path.Combine(dist,"Notenblick.exe"));using(var embedded=launched.GetManifestResourceStream("Notenblick.Aktualisierung.exe"))using(var b=new MemoryStream()){embedded.CopyTo(b);Check(UpdateTransaction.Digest(b.ToArray())==UpdateTransaction.Hash(Path.Combine(dist,"Programm/Windows/Notenblick.Aktualisierung.exe")),"Embedded recovery helper is identical to the verified portable helper");}
  if(args.Length>1&&args[1]=="--live")using(var timeout=new CancellationTokenSource(TimeSpan.FromSeconds(45))){Check(await UpdateSource.Discover("1.24.0",timeout.Token)==null,"Live public GitHub API: 1.24.0 is current");Console.WriteLine("Live GitHub discovery: current; actual HTTPS transport, no installation or release mutation.");}
  Console.WriteLine("Updater checks passed: "+count+"; real Linux filesystem, controlled transport/fault boundaries; no Windows GUI/NVDA/Braille or public release mutation.");
 }finally{Directory.Delete(temp,true);}}
}
