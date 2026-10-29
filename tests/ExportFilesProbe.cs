using System;using System.IO;using System.IO.Compression;using System.Text;using Newtonsoft.Json.Linq;using Notenblick.Native;
public static class ExportFilesProbe {
 static byte[] ChangePart(byte[] original,string name,string value){using(var output=new MemoryStream()){using(var zip=new ZipArchive(output,ZipArchiveMode.Create,true))using(var input=new ZipArchive(new MemoryStream(original),ZipArchiveMode.Read)){foreach(var e in input.Entries){var entry=zip.CreateEntry(e.FullName);using(var target=entry.Open()){if(e.FullName==name){var data=Encoding.UTF8.GetBytes(value);target.Write(data,0,data.Length);}else using(var source=e.Open())source.CopyTo(target);}}}return output.ToArray();}}
 static void Reject(byte[] bytes,string extension){bool rejected=false;try{ExportFiles.Decode(new JObject{{"dataBase64",Convert.ToBase64String(bytes)}},"Notenblick."+extension);}catch(InvalidDataException){rejected=true;}if(!rejected)throw new Exception("Damaged Office package accepted");}
 public static void Main(string[] args){
  if(args.Length>=2&&args[0]=="--reject-archives"){foreach(var path in Directory.GetFiles(args[1],"*.zip"))Reject(File.ReadAllBytes(path),"zip");Console.WriteLine("Rejected unsafe archives: "+Directory.GetFiles(args[1],"*.zip").Length);return;}
  if(args.Length>=3&&args[0]=="--archives"){
   Directory.CreateDirectory(args[1]);for(int i=2;i<args.Length;i++){var original=File.ReadAllBytes(args[i]);var name=ExportFiles.FileName(Path.GetFileName(args[i]));var bytes=ExportFiles.Decode(new JObject{{"dataBase64",Convert.ToBase64String(original)}},name);var destination=Path.Combine(args[1],name);ExportFiles.CheckDestination(destination,name,Path.Combine(args[1],"Daten"));ExportFiles.Write(destination,bytes);ExportFiles.Write(destination,bytes);if(Convert.ToBase64String(File.ReadAllBytes(destination))!=Convert.ToBase64String(original))throw new Exception("Archive storage roundtrip changed bytes");}Console.WriteLine("Actual production archive validation and storage: "+(args.Length-2));return;
  }
  int checks=0;var folder=args[0];Directory.CreateDirectory(folder);
  foreach(var ext in new[]{"txt","csv","json","pdf","docx","xlsx","zip"}){
   var bytes=ext=="pdf"||ext=="docx"||ext=="xlsx"||ext=="zip"?File.ReadAllBytes(Path.Combine(args[1],"synthetic-export."+ext)):System.Text.Encoding.UTF8.GetBytes("Synthetisch äöü\n");
   var name=ExportFiles.FileName("Notenblick_Test."+ext);var decoded=ExportFiles.Decode(new JObject{{"dataBase64",Convert.ToBase64String(bytes)}},name);
   var path=Path.Combine(folder,name);ExportFiles.Write(path,decoded);ExportFiles.Write(path,decoded);
   if(Convert.ToBase64String(File.ReadAllBytes(path))!=Convert.ToBase64String(bytes))throw new Exception("Binary roundtrip");
   if(!ExportFiles.Filter(name).Contains("*."+ext))throw new Exception("Filter");checks++;
  }
  if(ExportFiles.Filter("Notenblick.zip")!="ZIP-Archiv (*.zip)|*.zip")throw new Exception("ZIP filter label");
  foreach(var name in new[]{"../escape.pdf","bad.exe","bad/name.txt","bad\\name.txt","bad:filename.txt"}){bool rejected=false;try{ExportFiles.FileName(name);}catch{rejected=true;}if(!rejected)throw new Exception("Unsafe name accepted");checks++;}
  foreach(var ext in new[]{"pdf","docx","xlsx"}){bool rejected=false;try{ExportFiles.Decode(new JObject{{"dataBase64","YWJj"}},"Notenblick."+ext);}catch{rejected=true;}if(!rejected)throw new Exception("Invalid signature accepted");checks++;}
  var office=File.ReadAllBytes(Path.Combine(args[1],"synthetic-export.docx"));var corrupt=(byte[])office.Clone();corrupt[55]^=1;Reject(corrupt,"docx");checks++;
  Reject(new byte[]{80,75,3,4,0,255,128,1},"docx");checks++;
  Reject(ChangePart(office,"word/document.xml","<broken>"),"docx");checks++;
  Reject(ChangePart(office,"_rels/.rels","<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"remote\" Type=\"external\" Target=\"https://example.invalid/test\" TargetMode=\"External\"/></Relationships>"),"docx");checks++;
  Reject(File.ReadAllBytes(Path.Combine(args[1],"synthetic-export.xlsx")),"docx");checks++;
  var trailing=new byte[office.Length+1];Array.Copy(office,trailing,office.Length);Reject(trailing,"docx");checks++;
  foreach(var e in new Exception[]{new DirectoryNotFoundException(),new DriveNotFoundException()}){if(ExportFiles.ErrorCode(e)!="export-location-unavailable")throw new Exception("Wrong location code");checks++;}
  if(ExportFiles.ErrorCode(new UnauthorizedAccessException())!="export-permission")throw new Exception("Wrong permission code");checks++;
  var batch=File.ReadAllBytes(Path.Combine(args[1],"synthetic-export.zip"));var brokenBatch=(byte[])batch.Clone();brokenBatch[55]^=1;Reject(brokenBatch,"zip");checks++;
  foreach(var name in new[]{"../escape.txt","CON.txt","subdir/../report.txt","report.json"}){
   using(var data=new MemoryStream()){using(var zip=new ZipArchive(data,ZipArchiveMode.Create,true)){var entry=zip.CreateEntry(name);using(var source=entry.Open()){var bytes=Encoding.UTF8.GetBytes("synthetic");source.Write(bytes,0,bytes.Length);}}Reject(data.ToArray(),"zip");checks++;}
  }
  using(var data=new MemoryStream()){using(var zip=new ZipArchive(data,ZipArchiveMode.Create,true)){foreach(var name in new[]{"2026-27/5ä/Deutsch/Notenübersicht.txt","2025-26/9c/Geschichte/Schülernoten/Özlem (2).txt"}){var entry=zip.CreateEntry(name);using(var source=entry.Open()){var bytes=Encoding.UTF8.GetBytes("Synthetisch äöü");source.Write(bytes,0,bytes.Length);}}}ExportFiles.ValidateContent(data.ToArray(),"Notenblick.zip");checks++;}
  // Existing full JSON backups must retain the storage core's 256 MiB limit.
  var large=ExportFiles.Decode(new JObject{{"text",new string('x',65*1024*1024)}},"Notenblick.json");if(large.Length!=65*1024*1024)throw new Exception("Legacy backup limit changed");checks++;
  foreach(var name in new[]{"notenverwaltung.json","Ansicht.json","wrong.pdf"}){bool rejected=false;try{ExportFiles.CheckDestination(Path.Combine(folder,name),"Notenblick.json",folder);}catch{rejected=true;}if(!rejected)throw new Exception("Protected destination accepted");checks++;}
  if(Directory.GetFiles(folder,"*.tmp").Length!=0)throw new Exception("Temporary data left behind");
  Console.WriteLine("Native binary export checks: "+checks);
 }
}
