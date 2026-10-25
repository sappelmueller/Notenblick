using System;using System.IO;using Newtonsoft.Json.Linq;using Notenblick.Native;
public static class ExportFilesProbe {
 public static void Main(string[] args){
  int checks=0;var folder=args[0];Directory.CreateDirectory(folder);
  foreach(var ext in new[]{"txt","csv","json","pdf","docx","xlsx"}){
   var bytes=ext=="pdf"?System.Text.Encoding.ASCII.GetBytes("%PDF-synthetic"):ext=="docx"||ext=="xlsx"?new byte[]{80,75,3,4,0,255,128,1}:System.Text.Encoding.UTF8.GetBytes("Synthetisch äöü\n");
   var name=ExportFiles.FileName("Notenblick_Test."+ext);var decoded=ExportFiles.Decode(new JObject{{"dataBase64",Convert.ToBase64String(bytes)}},name);
   var path=Path.Combine(folder,name);ExportFiles.Write(path,decoded);ExportFiles.Write(path,decoded);
   if(Convert.ToBase64String(File.ReadAllBytes(path))!=Convert.ToBase64String(bytes))throw new Exception("Binary roundtrip");
   if(!ExportFiles.Filter(name).Contains("*."+ext))throw new Exception("Filter");checks++;
  }
  foreach(var name in new[]{"../escape.pdf","bad.exe","bad/name.txt","bad\\name.txt","bad:filename.txt"}){bool rejected=false;try{ExportFiles.FileName(name);}catch{rejected=true;}if(!rejected)throw new Exception("Unsafe name accepted");checks++;}
  foreach(var ext in new[]{"pdf","docx","xlsx"}){bool rejected=false;try{ExportFiles.Decode(new JObject{{"dataBase64","YWJj"}},"Notenblick."+ext);}catch{rejected=true;}if(!rejected)throw new Exception("Invalid signature accepted");checks++;}
  // Existing full JSON backups must retain the storage core's 256 MiB limit.
  var large=ExportFiles.Decode(new JObject{{"text",new string('x',65*1024*1024)}},"Notenblick.json");if(large.Length!=65*1024*1024)throw new Exception("Legacy backup limit changed");checks++;
  foreach(var name in new[]{"notenverwaltung.json","Ansicht.json","wrong.pdf"}){bool rejected=false;try{ExportFiles.CheckDestination(Path.Combine(folder,name),"Notenblick.json",folder);}catch{rejected=true;}if(!rejected)throw new Exception("Protected destination accepted");checks++;}
  if(Directory.GetFiles(folder,"*.tmp").Length!=0)throw new Exception("Temporary data left behind");
  Console.WriteLine("Native binary export checks: "+checks);
 }
}
