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
 static UpdateOffer Offer(byte[] bytes){return new UpdateOffer{Version="1.24.0",Files=UpdateTransaction.Snapshot(dist),Size=bytes.Length,Sha256=UpdateTransaction.Digest(bytes),Notes=new[]{"Neue Versionen sind leichter zu finden.","Notenblick startet jetzt maximiert.","Die Tastaturbedienung ist verbessert."},Url="https://github.com/"+UpdateSource.Repository+"/releases/download/v1.24.0/Notenblick_1.24.0.zip"};}
 static string Empty(){var d=Path.Combine(temp,"extract-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(d);return d;}
 public static async Task Main(string[] args){dist=Path.GetFullPath(args[0]);temp=Path.Combine(Path.GetTempPath(),"notenblick-updates-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(temp);try{
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
  var wrong=Offer(bytes);wrong.Version="1.25.0";Reject(()=>UpdateSource.Extract(bytes,wrong,Empty(),CancellationToken.None),"Executable version mismatch");
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
  var now=new DateTime(2026,11,3,12,0,0,DateTimeKind.Utc);int checks=0;Func<string,CancellationToken,Task<UpdateOffer>> lookup=(v,c)=>{checks++;return Task.FromResult(offer);};root=Root();before=Data(root);var prefs=Path.Combine(temp,"preferences");
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup,()=>now)){
   Check(!(bool)client.State()["enabled"],"Automatic checking defaults off");Check(!(bool)(await client.Check(true))["checked"]&&checks==0,"No unsolicited request");client.Preferences(new JObject{{"enabled",true}});await client.Check(true);Check(checks==1,"First opt-in automatic check");await client.Check(true);Check(checks==1,"At most one automatic attempt in 24 hours");await client.Check(false);Check(checks==2,"Manual check independent");now=now.AddHours(25);await client.Check(true);Check(checks==3,"Next automatic day");client.Preferences(new JObject{{"hiddenVersion","1.24.0"}});Check((string)client.State()["hiddenVersion"]=="1.24.0","Hide exact version");
  }
  using(var client=new UpdateClient(root,"1.23.3",prefs,lookup,()=>now)){Check((bool)client.State()["enabled"]&&(string)client.State()["offer"]["version"]=="1.24.0","Updater preferences/cache survive restart outside data");await client.Check(true);Check(checks==3,"Daily limit survives restart");}
  Check(Data(root)==before,"Updater preferences leave data unchanged");
  using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"offline"),(v,c)=>Task.FromException<UpdateOffer>(new System.Net.WebException("Controlled offline")),()=>now))Reject(()=>client.Check(false).GetAwaiter().GetResult(),"Offline check safely fails");
  root=Root();before=Data(root);UpdateSource.Fetch download=(u,m,a,c,p)=>{p?.Invoke(bytes.Length,bytes.Length);return Task.FromResult(bytes);};using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"prepare"),lookup,()=>now,download,()=>Tuple.Create(int.MaxValue,1L))){var token=await client.Prepare("1.24.0",s=>{});Check(client.Take(token).Token==token,"Verified preparation token");client.Cancel();Reject(()=>client.Take(token),"Cancel invalidates preparation");Check(!UpdateTransaction.Pending(UpdateTransaction.Current(root)),"Cancelled transaction cannot install");}Check(Data(root)==before,"Cancelled preparation leaves data unchanged");

  root=Root();Directory.Delete(Path.Combine(root,"Daten"),true);using(UpdateTransaction.Acquire(root)){var p=Plan(root);UpdateTransaction.Install(p,()=>true);Check(!Directory.Exists(Path.Combine(root,"Daten")),"Installation never creates a missing data folder");}
  root=Root();before=Data(root);Reject(()=>new UpdateClient(root,"1.24.0",Path.Combine(root,"Daten","update-options")),"Updater options can never enter data");Check(Data(root)==before,"Rejected preference location leaves data unchanged");
  var pendingOffer=new TaskCompletionSource<UpdateOffer>();int simultaneous=0;using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"coalesced"),(v,c)=>{simultaneous++;return pendingOffer.Task;})){
   var first=client.Check(false);var second=client.Check(false);Check(Object.ReferenceEquals(first,second)&&simultaneous==1,"Concurrent checks share one native request");pendingOffer.SetResult(offer);await first;
  }
  int offlineAttempts=0;using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"daily-offline"),(v,c)=>{offlineAttempts++;return Task.FromException<UpdateOffer>(new IOException("Controlled offline"));},()=>now)){
   client.Preferences(new JObject{{"enabled",true}});Reject(()=>client.Check(true).GetAwaiter().GetResult(),"Automatic offline attempt");Check(!(bool)(await client.Check(true))["checked"]&&offlineAttempts==1,"Failed automatic attempt obeys daily limit");Reject(()=>client.Check(false).GetAwaiter().GetResult(),"Manual retry after automatic failure");Check(offlineAttempts==2,"Manual retry is independent of failed automatic check");
  }
  var downloading=new TaskCompletionSource<bool>();UpdateSource.Fetch waitDownload=async(u,m,a,c,p)=>{downloading.SetResult(true);await Task.Delay(Timeout.Infinite,c);return bytes;};
  using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"cancel-download"),lookup,()=>now,waitDownload,()=>Tuple.Create(int.MaxValue,1L))){var work=client.Prepare("1.24.0",phase=>{});await downloading.Task;client.Cancel();Reject(()=>work.GetAwaiter().GetResult(),"Native cancellation stops active download");Check(Data(root)==before,"Cancelled native download leaves data untouched");}
  using(var client=new UpdateClient(root,"1.23.3",Path.Combine(temp,"tampered-stage"),lookup,()=>now,download,()=>Tuple.Create(int.MaxValue,1L))){var token=await client.Prepare("1.24.0",phase=>{});var plan=client.Take(token);File.AppendAllText(Path.Combine(plan.Folder,"new/Programm/Notenblick.html"),"changed after verification");Reject(()=>client.Take(token),"Staged tampering detected again before handoff");client.Cancel();Check(Data(root)==before,"Tampered staging never changes data");}
  var launched=Assembly.LoadFile(Path.Combine(dist,"Notenblick.exe"));using(var embedded=launched.GetManifestResourceStream("Notenblick.Aktualisierung.exe"))using(var b=new MemoryStream()){embedded.CopyTo(b);Check(UpdateTransaction.Digest(b.ToArray())==UpdateTransaction.Hash(Path.Combine(dist,"Programm/Windows/Notenblick.Aktualisierung.exe")),"Embedded recovery helper is identical to the verified portable helper");}
  if(args.Length>1&&args[1]=="--live")using(var timeout=new CancellationTokenSource(TimeSpan.FromSeconds(45))){Check(await UpdateSource.Discover("1.24.0",timeout.Token)==null,"Live public GitHub API: 1.24.0 is current");Console.WriteLine("Live GitHub discovery: current; actual HTTPS transport, no installation or release mutation.");}
  Console.WriteLine("Updater checks passed: "+count+"; real Linux filesystem, controlled transport/fault boundaries; no Windows GUI/NVDA/Braille or public release mutation.");
 }finally{Directory.Delete(temp,true);}}
}
