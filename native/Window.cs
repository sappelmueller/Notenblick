using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public sealed class Window:Form {
  const string Origin="https://notenblick.invalid/";
  readonly SemaphoreSlim fileGate=new SemaphoreSlim(1,1);
  readonly string program;readonly Storage storage;readonly WebView2 view;FileStream ownership;bool mayClose,initializing=true,closingRequest;
  public static void Run(string program){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);using(var form=new Window(program))Application.Run(form);}
  Window(string root){program=root;storage=new Storage(root);storage.VerifyWritable();Text="Notenblick";Icon=System.Drawing.Icon.ExtractAssociatedIcon(Path.Combine(program,"Notenblick.exe"));Width=1280;Height=860;MinimumSize=new System.Drawing.Size(320,240);StartPosition=FormStartPosition.CenterScreen;AutoScaleMode=AutoScaleMode.Dpi;
   var data=storage.Root;Directory.CreateDirectory(data);try{ownership=new FileStream(Path.Combine(data,"InBenutzung.lock"),FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);}catch(IOException){throw new IOException("Dieser Notenbestand ist bereits in einem anderen Notenblick-Fenster geöffnet. Bitte schließe es zuerst.");}
   view=new WebView2{Dock=DockStyle.Fill,AccessibleName="Notenblick"};Controls.Add(view);Shown+=async(s,e)=>await Start();FormClosing+=OnClosing;
   FormClosed+=(s,e)=>{view.Dispose();ownership.Dispose();try{File.Delete(Path.Combine(data,"InBenutzung.lock"));}catch{}};
  }
  async Task Start(){try{var area=Screen.FromControl(this).WorkingArea;MinimumSize=new System.Drawing.Size(Math.Min(320,area.Width),Math.Min(240,area.Height));if(Width>area.Width||Height>area.Height){Size=new System.Drawing.Size(Math.Min(Width,area.Width),Math.Min(Height,area.Height));Location=area.Location;}if(!File.Exists(Path.Combine(program,"Programm","Notenblick.html")))throw new FileNotFoundException("Die Datei Notenblick.html fehlt.");
   string digest;using(var sha=SHA256.Create())digest=BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(Path.GetFullPath(program).ToLowerInvariant()))).Replace("-","").Substring(0,24);
   var profile=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Notenblick","Ansicht",digest);
   var env=await CoreWebView2Environment.CreateAsync(null,profile);await view.EnsureCoreWebView2Async(env);var core=view.CoreWebView2;
   core.SetVirtualHostNameToFolderMapping("notenblick.invalid",Path.Combine(program,"Programm"),CoreWebView2HostResourceAccessKind.DenyCors);
   // App commands are routed by the page, never browser window shortcuts.
   core.Settings.AreBrowserAcceleratorKeysEnabled=false;
   view.KeyDown+=(s,e)=>{
    // Ctrl+Tab is otherwise a WebView host focus-navigation key. Consume it
    // once and post to the same page router; AltGr/system/window keys remain native.
    var modifiers=Control.ModifierKeys;
    if(e.KeyCode==Keys.Tab&&(modifiers&Keys.Control)!=0&&(modifiers&Keys.Alt)==0){
     e.Handled=true;e.SuppressKeyPress=true;
     bool shift=(modifiers&Keys.Shift)!=0;
     BeginInvoke(new Action(async()=>{if(view.CoreWebView2!=null)await view.CoreWebView2.ExecuteScriptAsync("if(window.Notenblick){Notenblick.handleShortcut({key:'Tab',ctrlKey:true,shiftKey:"+(shift?"true":"false")+",preventDefault:function(){}});}");}));
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
  async void Receive(object sender,CoreWebView2WebMessageReceivedEventArgs e){if(!Local(e.Source))return;JObject req;try{using(var reader=new JsonTextReader(new StringReader(e.WebMessageAsJson)){MaxDepth=40})req=JObject.Load(reader);}catch{return;}
   if((string)req["op"]=="close-ready"){if(closingRequest){view.CoreWebView2.PostWebMessageAsJson(new JObject{{"id",req["id"]},{"ok",true},{"result",true}}.ToString(Formatting.None));mayClose=true;BeginInvoke(new Action(Close));}return;}
   JObject response;
   if((string)req["op"]=="open-folder"){response=new JObject{{"id",req["id"]},{"ok",false}};try{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo{FileName=storage.Root,UseShellExecute=true});response["ok"]=true;response["result"]=true;}catch(Exception ex){response["error"]=ex.Message;}}
   // ShowPrintUI has no PrintSettings argument. CSS @page supplies the
   // requested A4 orientation; never replace the preview with silent PrintAsync.
   else if((string)req["op"]=="print-preview"){response=new JObject{{"id",req["id"]},{"ok",true},{"result",false}};try{view.CoreWebView2.ShowPrintUI(CoreWebView2PrintDialogKind.Browser);response["result"]=true;}catch{ /* Older runtimes fall back to window.print in the page. */ }}
   else if((string)req["op"]=="download"){response=new JObject{{"id",req["id"]},{"ok",false}};bool filePrepared=false;try{var name=ExportFiles.FileName((string)req["name"]);ExportProgress(req,"validating");var bytes=await Task.Run(()=>ExportFiles.Decode(req,name));filePrepared=true;ExportProgress(req,"save-dialog");using(var dialog=new SaveFileDialog{FileName=name,Title="Datei speichern",InitialDirectory=storage.Root,OverwritePrompt=true,AddExtension=true,DefaultExt=Path.GetExtension(name).TrimStart('.'),CheckPathExists=true,Filter=ExportFiles.Filter(name)}){if(dialog.ShowDialog(this)==DialogResult.OK){ExportFiles.CheckDestination(dialog.FileName,name,storage.Root);ExportProgress(req,"writing");await Task.Run(()=>ExportFiles.Write(dialog.FileName,bytes));response["ok"]=true;response["result"]=true;}else{response["ok"]=true;response["result"]=false;}}}catch(Exception error){response["code"]=filePrepared?ExportFiles.ErrorCode(error):"export-invalid-file";response["error"]=!filePrepared?"Die erstellte Datei ist ungültig und wurde nicht gespeichert.":(string)response["code"]=="export-location-unavailable"?"Der Speicherort ist nicht verfügbar.":(string)response["code"]=="export-permission"?"An diesem Speicherort darf die Datei nicht gespeichert werden.":"Die Datei konnte nicht gespeichert werden. Deine Noten bleiben unverändert.";}}
   else {await fileGate.WaitAsync();try{response=await Task.Run(()=>storage.Handle(req));}finally{fileGate.Release();}}
   view.CoreWebView2.PostWebMessageAsJson(response.ToString(Formatting.None));
  }
  void ExportProgress(JObject request,string phase){view.CoreWebView2.PostWebMessageAsJson(new JObject{{"id",request["id"]},{"progress",phase}}.ToString(Formatting.None));}
  async void OnClosing(object sender,FormClosingEventArgs e){if(mayClose)return;if(initializing||view.CoreWebView2==null){mayClose=true;return;}e.Cancel=true;closingRequest=true;try{await view.CoreWebView2.ExecuteScriptAsync("if(window.Notenblick&&window.Notenblick.requestClose){window.Notenblick.requestClose();}else{window.chrome.webview.postMessage({op:'close-ready'});}");}catch{closingRequest=false;MessageBox.Show(this,"Die letzten Eingaben konnten noch nicht geprüft werden. Bitte speichere deine Noten vor dem Schließen.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Information);}}
 }
}
