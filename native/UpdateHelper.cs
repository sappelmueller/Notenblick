using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Drawing;

namespace Notenblick.Native {
 internal static class UpdateHelper {
  [STAThread] public static void Main(string[] args){
   Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
   try{if(args.Length!=5||(args[0]!="--install"&&args[0]!="--recover"))throw new InvalidDataException();var plan=UpdateTransaction.Read(args[1],args[2]);int parent=int.Parse(args[3],System.Globalization.CultureInfo.InvariantCulture);long start=long.Parse(args[4],System.Globalization.CultureInfo.InvariantCulture);if(args[0]=="--install"&&(parent!=plan.ParentId||start!=plan.ParentStart))throw new InvalidDataException();using(var form=new UpdateWindow(plan,args[0]=="--recover",parent,start))Application.Run(form);}
   catch{MessageBox.Show("Die Aktualisierung konnte nicht abgeschlossen werden. Deine Noten sind unverändert.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Information);Environment.ExitCode=1;}
  }
 }
 internal sealed class UpdateWindow:Form {
  readonly UpdatePlan plan;readonly bool recovery;readonly int parent;readonly long started;readonly Label status;readonly Button cancel;readonly CancellationTokenSource stop=new CancellationTokenSource();bool applying,finished;
  public UpdateWindow(UpdatePlan p,bool recovering,int pid,long ticks){plan=p;recovery=recovering;parent=pid;started=ticks;Text="Notenblick aktualisieren";AutoScaleMode=AutoScaleMode.Dpi;Font=new Font("Segoe UI",10);StartPosition=FormStartPosition.CenterScreen;MinimumSize=new Size(320,200);Size=new Size(520,220);MaximizeBox=false;
   var layout=new TableLayoutPanel{Dock=DockStyle.Fill,Padding=new Padding(20),ColumnCount=1,RowCount=3};layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));layout.RowStyles.Add(new RowStyle(SizeType.Percent,100));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,26));layout.RowStyles.Add(new RowStyle(SizeType.Absolute,42));
   status=new Label{Text="Notenblick wird aktualisiert …",AutoSize=true,MaximumSize=new Size(440,0),Dock=DockStyle.Fill,AccessibleRole=AccessibleRole.StaticText};var bar=new ProgressBar{Dock=DockStyle.Fill,Style=ProgressBarStyle.Marquee,AccessibleName="Aktualisierung läuft"};cancel=new Button{Text="Abbrechen",AutoSize=true,Anchor=AnchorStyles.Right};cancel.Click+=(s,e)=>stop.Cancel();layout.Controls.Add(status,0,0);layout.Controls.Add(bar,0,1);layout.Controls.Add(cancel,0,2);Controls.Add(layout);CancelButton=cancel;
   FormClosing+=(s,e)=>{if(!finished){e.Cancel=true;if(!applying)stop.Cancel();}};Shown+=async(s,e)=>await Run();
  }
  void Phase(string value){if(IsDisposed)return;BeginInvoke(new Action(()=>{status.Text=value=="restarting"?"Notenblick wird neu gestartet …":"Notenblick wird aktualisiert …";}));}
  static bool Probe(UpdatePlan p){using(var process=Process.Start(new ProcessStartInfo{FileName=Path.Combine(p.Root,"Notenblick.exe"),Arguments="--verify-update",WorkingDirectory=p.Root,UseShellExecute=false,CreateNoWindow=true})){if(process==null)return false;if(!process.WaitForExit(30000)){try{process.Kill();}catch{}return false;}return process.ExitCode==0;}}
  static void Open(UpdatePlan p){Process.Start(new ProcessStartInfo{FileName=Path.Combine(p.Root,"Notenblick.exe"),WorkingDirectory=p.Root,UseShellExecute=false});}
  async Task Run(){bool open=false,failed=false;try{
    await Task.Run(()=>{var deadline=DateTime.UtcNow.AddSeconds(30);while(UpdateTransaction.ProcessAlive(parent,started)){stop.Token.ThrowIfCancellationRequested();if(DateTime.UtcNow>deadline)throw new IOException("Application still running");Thread.Sleep(100);}});
    stop.Token.ThrowIfCancellationRequested();applying=true;cancel.Enabled=false;
    await Task.Run(()=>{using(UpdateTransaction.Acquire(plan.Root)){
     var current=UpdateTransaction.Current(plan.Root);if(current==null||current.Token!=plan.Token)throw new IOException("Transaction changed");
     if(recovery){if(UpdateTransaction.ParentAlive(plan))throw new IOException("Original application still running");UpdateTransaction.Recover(plan);failed=true;open=true;return;}
     if(UpdateTransaction.Phase(plan)!="authorized")return;
     try{UpdateTransaction.Install(plan,()=>Probe(plan),Phase);UpdateTransaction.Prune(plan.Root,plan.Token);open=true;}
     catch{UpdateTransaction.Recover(plan);failed=true;open=true;}
    }});
   }catch(OperationCanceledException){try{if(!UpdateTransaction.ProcessAlive(parent,started))using(UpdateTransaction.Acquire(plan.Root)){UpdateTransaction.Recover(plan);open=true;}}catch{failed=true;}}
   catch{failed=true;}
   finally{finished=true;if(failed)MessageBox.Show(this,"Die Aktualisierung konnte nicht abgeschlossen werden. Deine Noten sind unverändert."+(open?" Die bisherige Version wird wieder geöffnet.":" Bitte entpacke bei Bedarf die bisherige Version erneut."),"Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Information);if(open)try{Phase("restarting");Open(plan);}catch{MessageBox.Show(this,"Bitte starte Notenblick erneut. Deine Noten sind unverändert.","Notenblick",MessageBoxButtons.OK,MessageBoxIcon.Information);}Close();stop.Dispose();}
  }
 }
}
