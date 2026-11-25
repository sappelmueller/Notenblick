using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;
using System.Drawing.Printing;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public sealed class Window:Form {
  const string Origin="https://notenblick.invalid/";
  readonly SemaphoreSlim fileGate=new SemaphoreSlim(1,1);
  readonly string program;readonly Storage storage;readonly WebView2 view;FileStream ownership;bool mayClose,initializing=true,closingRequest,updateHandoff,windowsLocked;
  UpdateClient updater;string updateErrorDetails,preparedRecovery,confirmedRecovery;long lockEpoch;bool sessionIsLocked;
  public static void Run(string program){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);using(var form=new Window(program))Application.Run(form);}
  Window(string root){program=Path.GetFullPath(root);Text="Notenblick";Icon=System.Drawing.Icon.ExtractAssociatedIcon(Path.Combine(program,"Notenblick.exe"));AutoScaleMode=AutoScaleMode.Dpi;var area=SystemInformation.WorkingArea;MinimumSize=new System.Drawing.Size(Math.Min(320,area.Width),Math.Min(240,area.Height));Size=new System.Drawing.Size(Math.Min(1280,area.Width),Math.Min(860,area.Height));StartPosition=FormStartPosition.CenterScreen;WindowState=FormWindowState.Maximized;
   var data=Path.Combine(program,"Daten");var lockFile=Path.Combine(data,"InBenutzung.lock");Storage.CheckPath(lockFile);
   try{Directory.CreateDirectory(data);ownership=new FileStream(lockFile,FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);}
   catch(UnauthorizedAccessException){throw new IOException("Der Notenblick-Ordner ist nicht beschreibbar. Bitte verschiebe den vollständigen Ordner an einen Ort, an dem du Dateien speichern darfst.");}
   catch(IOException){throw new IOException("Der Datenordner wird bereits verwendet oder ist gerade nicht verfügbar. Schließe andere Notenblick-Fenster und prüfe den Speicherort.");}
   try{storage=new Storage(program);storage.VerifyWritable();}
   catch{storage?.Dispose();ownership.Dispose();throw;}
   view=new WebView2{Dock=DockStyle.Fill,AccessibleName="Notenblick"};Controls.Add(view);Shown+=async(s,e)=>await Start();FormClosing+=OnClosing;
   SystemEvents.SessionSwitch+=OnSessionSwitch;
   FormClosed+=(s,e)=>{SystemEvents.SessionSwitch-=OnSessionSwitch;updater?.Dispose();view.Dispose();storage.Dispose();ownership.Dispose();};
  }
  async Task Start(){try{if(!File.Exists(Path.Combine(program,"Programm","Notenblick.html")))throw new FileNotFoundException("Die Datei Notenblick.html fehlt.");
   string digest;using(var sha=SHA256.Create())digest=BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(Path.GetFullPath(program).ToLowerInvariant()))).Replace("-","").Substring(0,24);
   var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Notenblick","Ansicht",digest);
   var env=await CoreWebView2Environment.CreateAsync(null,profile);await view.EnsureCoreWebView2Async(env);var core=view.CoreWebView2;
   core.SetVirtualHostNameToFolderMapping("notenblick.invalid",Path.Combine(program,"Programm"),CoreWebView2HostResourceAccessKind.DenyCors);
   // App commands are routed by the page, never browser window shortcuts.
   core.Settings.AreBrowserAcceleratorKeysEnabled=false;
   core.Settings.IsPasswordAutosaveEnabled=false;
   core.Settings.IsGeneralAutofillEnabled=false;
   view.KeyDown+=(s,e)=>{
    // Ctrl+Tab is otherwise a WebView host focus-navigation key. Consume it
    // once and post to the same page router; AltGr/system/window keys remain native.
    var modifiers=Control.ModifierKeys;
    if(e.KeyCode==Keys.Tab&&(modifiers&Keys.Control)!=0&&(modifiers&Keys.Alt)==0){
     e.Handled=true;e.SuppressKeyPress=true;
     bool shift=(modifiers&Keys.Shift)!=0;
     BeginInvoke(new Action(async()=>{if(view.CoreWebView2!=null&&!OutputLocked)await view.CoreWebView2.ExecuteScriptAsync("if(window.Notenblick&&!document.documentElement.hasAttribute('data-vault-locked')){Notenblick.handleShortcut({key:'Tab',ctrlKey:true,shiftKey:"+(shift?"true":"false")+",preventDefault:function(){}});}");}));
    }
   };
   core.Settings.IsStatusBarEnabled=false;core.Settings.IsWebMessageEnabled=true;
   core.AddWebResourceRequestedFilter("*",CoreWebView2WebResourceContext.All);
   core.WebResourceRequested+=(s,e)=>{if(!Local(e.Request.Uri)&&!e.Request.Uri.StartsWith("data:",StringComparison.OrdinalIgnoreCase)&&!e.Request.Uri.StartsWith("blob:"+Origin,StringComparison.OrdinalIgnoreCase))e.Response=env.CreateWebResourceResponse(new MemoryStream(),403,"Offline","");};
   core.NavigationStarting+=(s,e)=>{if(!Local(e.Uri))e.Cancel=true;};core.NewWindowRequested+=(s,e)=>e.Handled=true;
   core.WebMessageReceived+=Receive;
   core.NavigationCompleted+=(s,e)=>{initializing=false;if(!e.IsSuccess)MessageBox.Show(this,"Die Programmoberfläche konnte nicht geöffnet werden. Bitte entpacke den gesamten Programmordner erneut.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Error);else view.Focus();};
   core.Navigate(Origin+"Notenblick.html");
  }catch(Exception e){initializing=false;MessageBox.Show(this,"Notenblick konnte nicht gestartet werden.\n\n"+e.Message+"\n\nUnter Windows 11 wird die Microsoft-WebView2-Laufzeit benötigt. Deine Notendateien wurden nicht verändert.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Error);mayClose=true;Close();}}
  static bool Local(string value){Uri uri;return Uri.TryCreate(value,UriKind.Absolute,out uri)&&uri.Scheme=="https"&&uri.Host=="notenblick.invalid"&&uri.IsDefaultPort&&string.IsNullOrEmpty(uri.UserInfo);}
  bool OutputLocked { get {return storage.VaultLocked||(storage.VaultEnabled&&windowsLocked);} }
  void OnSessionSwitch(object sender,SessionSwitchEventArgs e){
   if(IsDisposed||!IsHandleCreated||e.Reason!=SessionSwitchReason.SessionLock&&e.Reason!=SessionSwitchReason.SessionUnlock)return;
   try{BeginInvoke(new Action(async()=>{
    if(IsDisposed)return;
    sessionIsLocked=e.Reason==SessionSwitchReason.SessionLock;
    if(!sessionIsLocked){if(!storage.VaultEnabled)windowsLocked=false;return;}
    windowsLocked=true;lockEpoch++;preparedRecovery=confirmedRecovery=null;
    if(storage.VaultEnabled)view.CoreWebView2?.PostWebMessageAsJson("{\"event\":\"windows-locked\"}");
    await fileGate.WaitAsync();
    try{
     if(!IsDisposed&&storage.VaultEnabled){
      storage.Dispatch(new JObject{{"op","vault-lock"}});
      view.CoreWebView2?.PostWebMessageAsJson("{\"event\":\"windows-locked\"}");
     }
    }catch(Exception error) when(error is InvalidOperationException||error is IOException){}finally{fileGate.Release();}
   }));}catch(InvalidOperationException){}
  }
  static bool Inside(string path,string root){
   path=Path.GetFullPath(path);root=Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar);
   return String.Equals(path,root,StringComparison.OrdinalIgnoreCase)||path.StartsWith(root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase);
  }
  void RequireExternalDestination(string path){
   Storage.CheckPath(path);
   if(Inside(path,storage.Root))throw new IOException("Wähle für diese Datei einen anderen Ordner als Daten.");
  }
  static string RecoveryFileText(string key){
   return "Notenblick – Notfallschlüssel\r\n\r\nNotfallschlüssel: "+key+"\r\n\r\n"+
    "Bewahre diesen Schlüssel getrennt von deinen Noten auf. Er ermöglicht den Zugang ohne Passwort.\r\n"+
    "Wähle in Notenblick oder im Notfallzugriff „Mit Notfallschlüssel öffnen“.\r\n"+
    "Öffne diese Datei oder gib nur den Schlüssel ein.\r\n";
  }
  async Task<JObject> VaultOffice(JObject request,string op){
   var answer=new JObject{{"id",request["id"]},{"ok",false}};
   long requestEpoch=lockEpoch;
   try{
    object result;
    switch(op){
     case "vault-ready":
      result=ReleaseRescue.IsReady(program);break;
     case "vault-key-clear":
      preparedRecovery=null;confirmedRecovery=null;result=true;break;
     case "vault-request-close":
      if(!OutputLocked)throw new InvalidOperationException("Notenblick ist nicht gesperrt.");
      if((bool?)request["preserve"]==true)throw new InvalidOperationException("Entsperre Notenblick und speichere deine letzten Eingaben, bevor du es schließt.");
      mayClose=true;BeginInvoke(new Action(Close));result=true;break;
     case "vault-key-read":
      result=false;
      if(sessionIsLocked)break;
      using(var dialog=new OpenFileDialog{Title="Schlüsseldatei öffnen",Filter="Textdatei (*.txt)|*.txt",CheckFileExists=true,Multiselect=false,RestoreDirectory=true}){
       if(dialog.ShowDialog(this)!=DialogResult.OK||sessionIsLocked||requestEpoch!=lockEpoch)break;
       Storage.CheckPath(dialog.FileName);
       if(new FileInfo(dialog.FileName).Length>8192)throw new InvalidDataException("Diese Datei ist keine Notenblick-Schlüsseldatei.");
       string key=null;
       using(var reader=new StreamReader(dialog.FileName,new UTF8Encoding(false,true),true)){
        while(!reader.EndOfStream){var line=reader.ReadLine();if(line.StartsWith("Notfallschlüssel: ",StringComparison.Ordinal)){if(key!=null)throw new InvalidDataException("Diese Schlüsseldatei enthält mehrere Schlüssel.");key=line.Substring("Notfallschlüssel: ".Length);}}
       }
       if(String.IsNullOrEmpty(key)||key.Length>200)throw new InvalidDataException("Diese Datei enthält keinen Notenblick-Notfallschlüssel.");
       if(!OutputLocked&&String.Equals(key,preparedRecovery,StringComparison.Ordinal)&&!Inside(dialog.FileName,storage.Root))confirmedRecovery=key;
       result=key;
      }
      break;
     case "vault-download-backup":
      if(OutputLocked)throw new InvalidOperationException("Entsperre Notenblick zuerst.");
      var name=ExportFiles.Component((string)request["name"]);
      if(!name.StartsWith("Notenblick-Sicherung-",StringComparison.Ordinal)||!name.EndsWith(".nbx",StringComparison.Ordinal))throw new InvalidDataException("Der Name der Sicherung ist ungültig.");
      await fileGate.WaitAsync();
      byte[] bytes;
      try{bytes=await Task.Run(()=>Convert.FromBase64String((string)storage.Dispatch(new JObject{{"op","vault-backup"},{"text",request["text"]}})));}
      finally{fileGate.Release();}
      result=false;
      using(var dialog=new SaveFileDialog{Title="Geschützte Sicherung speichern",FileName=name,Filter="Geschützte Notenblick-Sicherung (*.nbx)|*.nbx",DefaultExt="nbx",AddExtension=true,OverwritePrompt=true,CheckPathExists=true,RestoreDirectory=true}){
       if(dialog.ShowDialog(this)!=DialogResult.OK)break;
       if(OutputLocked)throw new InvalidOperationException("Entsperre Notenblick zuerst.");
       RequireExternalDestination(dialog.FileName);
       if(!String.Equals(Path.GetExtension(dialog.FileName),".nbx",StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Speichere die Sicherung mit der Endung .nbx.");
       await Task.Run(()=>ExportFiles.Write(dialog.FileName,bytes));result=true;
      }
      break;
     default:
      var recovery=(string)request["recovery"];
      if(sessionIsLocked||OutputLocked||String.IsNullOrEmpty(preparedRecovery)||!String.Equals(recovery,preparedRecovery,StringComparison.Ordinal))throw new InvalidOperationException("Der Notfallschlüssel ist nicht mehr verfügbar. Richte ihn erneut ein.");
      if(op=="vault-key-copy"){Clipboard.SetText(recovery,TextDataFormat.UnicodeText);result=true;break;}
      if(op=="vault-key-print"){
       result=false;
       using(var document=new PrintDocument{DocumentName="Notenblick – Notfallschlüssel"})
       using(var dialog=new PrintDialog{Document=document,UseEXDialog=true,AllowCurrentPage=false,AllowSelection=false,AllowSomePages=false}){
        document.PrintPage+=(s,e)=>{using(var font=new System.Drawing.Font("Segoe UI",12f)){e.Graphics.DrawString(RecoveryFileText(recovery),font,System.Drawing.Brushes.Black,e.MarginBounds);}};
        if(dialog.ShowDialog(this)==DialogResult.OK&&!OutputLocked&&!sessionIsLocked&&requestEpoch==lockEpoch){document.Print();result=true;}
       }
       break;
      }
      result=false;
      using(var dialog=new SaveFileDialog{Title="Schlüsseldatei speichern",FileName="Notenblick-Notfallschluessel.txt",Filter="Textdatei (*.txt)|*.txt",DefaultExt="txt",AddExtension=true,OverwritePrompt=true,CheckPathExists=true,RestoreDirectory=true,InitialDirectory=Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments)}){
       if(dialog.ShowDialog(this)!=DialogResult.OK)break;
       if(OutputLocked||sessionIsLocked||requestEpoch!=lockEpoch)throw new InvalidOperationException("Entsperre Notenblick zuerst.");
       RequireExternalDestination(dialog.FileName);
       if(!String.Equals(Path.GetExtension(dialog.FileName),".txt",StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Speichere den Schlüssel als Textdatei.");
       if(File.Exists(dialog.FileName))throw new IOException("Diese Datei gibt es bereits. Wähle einen neuen Dateinamen, damit frühere Schlüssel erhalten bleiben.");
       var keyBytes=new UTF8Encoding(false,true).GetBytes(RecoveryFileText(recovery));
       string destination=dialog.FileName,staged=Path.Combine(Path.GetDirectoryName(destination),".Notenblick-Schluessel-"+Guid.NewGuid().ToString("N")+".tmp");
       try{await Task.Run(()=>{try{Storage.AtomicBytes(staged,keyBytes);File.Move(staged,destination);}finally{if(File.Exists(staged))File.Delete(staged);}});}
       finally{Array.Clear(keyBytes,0,keyBytes.Length);}
       result=true;
      }
      break;
    }
    answer["result"]=JToken.FromObject(result);answer["ok"]=true;
   }catch(Exception error){
    answer["error"]=error is InvalidDataException||error is InvalidOperationException||error is IOException?error.Message:"Der Vorgang konnte nicht abgeschlossen werden. Bitte prüfe deine Auswahl und versuche es erneut.";
   }
   return answer;
  }
  async void Receive(object sender,CoreWebView2WebMessageReceivedEventArgs e){if(!Local(e.Source))return;JObject req;try{using(var reader=new JsonTextReader(new StringReader(e.WebMessageAsJson)){MaxDepth=40})req=JObject.Load(reader);}catch{return;}
   if((string)req["op"]=="close-ready"){if(closingRequest){view.CoreWebView2.PostWebMessageAsJson(new JObject{{"id",req["id"]},{"ok",true},{"result",true}}.ToString(Formatting.None));mayClose=true;BeginInvoke(new Action(Close));}return;}
   JObject response;
   if(((string)req["op"]??"").StartsWith("update-",StringComparison.Ordinal)){
    response=new JObject{{"id",req["id"]},{"ok",false}};
    bool checking=(string)req["op"]=="update-check";var checkedAt=DateTime.UtcNow;string updateVersion="nicht verfügbar";
    if(checking)updateErrorDetails=null;
    try{
     if(updateHandoff)throw new IOException();
     // Use the trusted in-memory report, never text or paths supplied by the page.
     // WebMessageReceived runs on the WinForms STA thread required by Clipboard.
     if((string)req["op"]=="update-copy-error"){
      if(string.IsNullOrEmpty(updateErrorDetails))throw new InvalidOperationException("No update error");
      Clipboard.SetText(updateErrorDetails,TextDataFormat.UnicodeText);response["result"]=true;
     }else{
     updateVersion=System.Reflection.Assembly.GetEntryAssembly().GetName().Version.ToString(3);
     if(updater==null)updater=new UpdateClient(program,updateVersion);
     switch((string)req["op"]){
      case "update-state":response["result"]=updater.State();break;
      case "update-preferences":response["result"]=updater.Preferences(req);break;
      case "update-check":if(req["automatic"]!=null&&req["automatic"].Type!=JTokenType.Boolean)throw new InvalidDataException();response["result"]=await updater.Check((bool?)req["automatic"]??false);break;
      case "update-prepare":response["result"]=await updater.Prepare((string)req["version"],phase=>{if(!IsDisposed)BeginInvoke(new Action(()=>{if(!IsDisposed)ExportProgress(req,phase);}));});break;
      case "update-cancel":updater.Cancel();response["result"]=true;break;
      case "update-install":
       await fileGate.WaitAsync();try{var plan=updater.Take((string)req["token"]);UpdateTransaction.Mark(plan,"authorized");UpdateBootstrap.Start(program,plan.Token,false);updateHandoff=true;updater.HandedOff();mayClose=true;response["result"]=true;BeginInvoke(new Action(Close));}finally{fileGate.Release();}break;
      default:throw new InvalidDataException();
     }
     }
     response["ok"]=true;
    }catch(Exception error){
     if(checking){updateErrorDetails=UpdateDiagnostics.Report(error,updateVersion,checkedAt,"Lokale Update-Einstellungen initialisieren");response["updateDiagnostic"]=updateErrorDetails;response["error"]="Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.";}
     else if(error is OperationCanceledException){response["error"]="Die Aktualisierung wurde abgebrochen.";response["name"]="AbortError";}
     else response["error"]=(string)req["op"]=="update-copy-error"?"Die Fehlerdetails konnten nicht kopiert werden.":"Die Aktualisierung konnte nicht abgeschlossen werden. Deine Noten sind unverändert.";
    }
   }
   else if(updateHandoff){response=new JObject{{"id",req["id"]},{"ok",false},{"error","Notenblick wird aktualisiert. Deine Noten sind gespeichert."}};}
   else
   if((string)req["op"]=="vault-ready"||(string)req["op"]=="vault-request-close"||(string)req["op"]=="vault-key-read"||(string)req["op"]=="vault-key-save"||(string)req["op"]=="vault-key-copy"||(string)req["op"]=="vault-key-print"||(string)req["op"]=="vault-key-clear"||(string)req["op"]=="vault-download-backup"){response=await VaultOffice(req,(string)req["op"]);}
   else if(OutputLocked&&((string)req["op"]=="download"||(string)req["op"]=="open-folder"||(string)req["op"]=="print-preview")){response=new JObject{{"id",req["id"]},{"ok",false},{"code","export-vault-locked"},{"error","Entsperre Notenblick zuerst."}};}
   else if((string)req["op"]=="open-folder"){response=new JObject{{"id",req["id"]},{"ok",false}};try{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo{FileName=storage.Root,UseShellExecute=true});response["ok"]=true;response["result"]=true;}catch(Exception ex){response["error"]=ex.Message;}}
   // ShowPrintUI has no PrintSettings argument. CSS @page supplies the
   // requested A4 orientation; never replace the preview with silent PrintAsync.
   else if((string)req["op"]=="print-preview"){response=new JObject{{"id",req["id"]},{"ok",true},{"result",false}};try{view.CoreWebView2.ShowPrintUI(CoreWebView2PrintDialogKind.Browser);response["result"]=true;}catch{ /* Older runtimes fall back to window.print in the page. */ }}
   else if((string)req["op"]=="download"){response=await Download(req);}
   else {long requestEpoch=lockEpoch;await fileGate.WaitAsync();try{
    string op=(string)req["op"];
    if(windowsLocked&&storage.VaultEnabled&&op!="vault-status"&&op!="vault-lock"&&op!="vault-unlock"||
       op=="vault-unlock"&&(sessionIsLocked||requestEpoch!=lockEpoch)){
     response=new JObject{{"id",req["id"]},{"ok",false},{"error","Entsperre Notenblick zuerst."}};
    }else if((op=="vault-enable"||op=="vault-rotate")&&(!ReleaseRescue.IsReady(program)||String.IsNullOrEmpty(confirmedRecovery)||!String.Equals(confirmedRecovery,(string)req["recovery"],StringComparison.Ordinal))){
     response=new JObject{{"id",req["id"]},{"ok",false},{"error","Prüfe zuerst die gespeicherte Schlüsseldatei und den Notfallzugriff."}};
    }else{
     response=await Task.Run(()=>storage.Handle(req));
     if((bool?)response["ok"]==true){
      if(op=="vault-key"){preparedRecovery=(string)response["result"];confirmedRecovery=null;}
      if(op=="vault-enable"||op=="vault-rotate"||op=="vault-lock"){preparedRecovery=null;confirmedRecovery=null;}
      if(op=="vault-unlock"){
       if(sessionIsLocked||requestEpoch!=lockEpoch){
        storage.Dispatch(new JObject{{"op","vault-lock"}});
        response=new JObject{{"id",req["id"]},{"ok",false},{"error","Entsperre Notenblick zuerst."}};
       }else windowsLocked=false;
      }
      if((op=="vault-enable"||op=="vault-rotate")&&windowsLocked&&storage.VaultEnabled)
       view.CoreWebView2?.PostWebMessageAsJson("{\"event\":\"windows-locked\"}");
     }
    }
   }finally{fileGate.Release();}}
   if(!IsDisposed&&view.CoreWebView2!=null)view.CoreWebView2.PostWebMessageAsJson(response.ToString(Formatting.None));
  }
  async Task<JObject> Download(JObject req){
   var response=new JObject{{"id",req["id"]},{"ok",false}};bool filePrepared=false;
   try{
    var name=ExportFiles.FileName((string)req["name"]);
    ExportProgress(req,"validating");var bytes=await Task.Run(()=>ExportFiles.Decode(req,name));
    filePrepared=true;ExportProgress(req,"save-dialog");
    string initial=storage.VaultEnabled?Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments):storage.Root;
    using(var dialog=new SaveFileDialog{FileName=name,Title="Datei speichern",InitialDirectory=initial,OverwritePrompt=true,AddExtension=true,DefaultExt=Path.GetExtension(name).TrimStart('.'),CheckPathExists=true,Filter=ExportFiles.Filter(name)}){
     if(dialog.ShowDialog(this)!=DialogResult.OK){response["ok"]=true;response["result"]=false;return response;}
     if(OutputLocked){response["error"]="Entsperre Notenblick zuerst.";return response;}
     if(storage.VaultEnabled&&Inside(dialog.FileName,storage.Root)){response["error"]="Wähle für diese unverschlüsselte Ausgabe einen anderen Ordner als Daten.";return response;}
     ExportFiles.CheckDestination(dialog.FileName,name,storage.Root);Storage.CheckPath(dialog.FileName);
     ExportProgress(req,"writing");await Task.Run(()=>ExportFiles.Write(dialog.FileName,bytes));response["ok"]=true;response["result"]=true;
    }
   }catch(Exception error){
    response["code"]=filePrepared?ExportFiles.ErrorCode(error):"export-invalid-file";
    response["error"]=!filePrepared?"Die erstellte Datei ist ungültig und wurde nicht gespeichert.":(string)response["code"]=="export-location-unavailable"?"Der Speicherort ist nicht verfügbar.":(string)response["code"]=="export-permission"?"An diesem Speicherort darf die Datei nicht gespeichert werden.":"Die Datei konnte nicht gespeichert werden. Deine Noten bleiben unverändert.";
   }
   return response;
  }
  void ExportProgress(JObject request,string phase){view.CoreWebView2.PostWebMessageAsJson(new JObject{{"id",request["id"]},{"progress",phase}}.ToString(Formatting.None));}
  async void OnClosing(object sender,FormClosingEventArgs e){if(mayClose)return;if(initializing||view.CoreWebView2==null){mayClose=true;return;}e.Cancel=true;closingRequest=true;try{await view.CoreWebView2.ExecuteScriptAsync("if(window.Notenblick&&window.Notenblick.requestClose){window.Notenblick.requestClose();}else{window.chrome.webview.postMessage({op:'close-ready'});}");}catch{closingRequest=false;MessageBox.Show(this,"Die letzten Eingaben konnten noch nicht geprüft werden. Bitte speichere deine Noten vor dem Schließen.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Information);}}
 }
}
