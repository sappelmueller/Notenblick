using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public static class ExportFiles {
  public const int MaximumBytes=256*1024*1024;
  public static string FileName(string proposed){
   if(String.IsNullOrWhiteSpace(proposed)||proposed!=Path.GetFileName(proposed)||proposed.Length>240||proposed.IndexOfAny(Path.GetInvalidFileNameChars())>=0||proposed.IndexOfAny(new[]{'<','>',':','"','|','?','*'})>=0||proposed.Contains("/")||proposed.Contains("\\"))throw new InvalidDataException("Ungültiger Exportdateiname.");
   var extension=Path.GetExtension(proposed).ToLowerInvariant();
   if(Array.IndexOf(new[]{".json",".txt",".csv",".pdf",".docx",".xlsx"},extension)<0)throw new InvalidDataException("Dieses Dateiformat wird nicht unterstützt.");return proposed;
  }
  public static string Filter(string name){switch(Path.GetExtension(name).ToLowerInvariant()){
   case ".json":return "Notenblick-Sicherung (*.json)|*.json";
   case ".pdf":return "PDF-Dokument (*.pdf)|*.pdf";
   case ".docx":return "Word-Dokument (*.docx)|*.docx";
   case ".xlsx":return "Excel-Arbeitsmappe (*.xlsx)|*.xlsx";
   case ".csv":return "CSV-Datei (*.csv)|*.csv";
   default:return "Textdatei (*.txt)|*.txt";
  }}
  public static void CheckDestination(string destination,string proposed,string dataRoot){
   var path=Path.GetFullPath(destination);FileName(Path.GetFileName(path));
   if(!String.Equals(Path.GetExtension(path),Path.GetExtension(proposed),StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Bitte die passende Dateiendung verwenden.");
   foreach(var reserved in new[]{"notenverwaltung.json","Ansicht.json"})if(String.Equals(path,Path.GetFullPath(Path.Combine(dataRoot,reserved)),StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Die Programmdatei darf nicht durch einen Export ersetzt werden.");
  }
  public static byte[] Decode(JObject request,string name){
   var encoded=(string)request["dataBase64"];byte[] bytes;
   if(encoded!=null){if(encoded.Length>(MaximumBytes/3+1)*4)throw new InvalidDataException("Die Exportdatei ist zu groß.");try{bytes=Convert.FromBase64String(encoded);}catch{throw new InvalidDataException("Die Exportdatei ist beschädigt.");}}
   else {var text=(string)request["text"];if(text==null)throw new InvalidDataException("Es wurden keine Dateiinhalte übergeben.");bytes=new UTF8Encoding(false,true).GetBytes(text);}
   if(bytes.Length==0||bytes.Length>MaximumBytes)throw new InvalidDataException("Ungültige Exportdateigröße.");
   var ext=Path.GetExtension(name).ToLowerInvariant();if(ext==".pdf"&&(bytes.Length<5||Encoding.ASCII.GetString(bytes,0,5)!="%PDF-"))throw new InvalidDataException("Ungültige PDF-Datei.");
   if((ext==".docx"||ext==".xlsx")&&(bytes.Length<4||bytes[0]!=80||bytes[1]!=75||bytes[2]!=3||bytes[3]!=4))throw new InvalidDataException("Ungültige Office-Datei.");return bytes;
  }
  public static void Write(string destination,byte[] bytes){
   var path=Path.GetFullPath(destination);var directory=Path.GetDirectoryName(path);if(!Directory.Exists(directory))throw new DirectoryNotFoundException("Der Zielordner ist nicht verfügbar.");
   var temporary=Path.Combine(directory,".Notenblick-Export-"+Guid.NewGuid().ToString("N")+".tmp");
   try{using(var stream=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None,65536,FileOptions.WriteThrough)){stream.Write(bytes,0,bytes.Length);stream.Flush(true);}
    byte[] expected,actual;using(var sha=SHA256.Create())expected=sha.ComputeHash(bytes);using(var sha=SHA256.Create())using(var stream=File.OpenRead(temporary))actual=sha.ComputeHash(stream);
    if(!String.Equals(Convert.ToBase64String(expected),Convert.ToBase64String(actual),StringComparison.Ordinal))throw new IOException("Die Exportdatei konnte nicht geprüft werden.");
    if(File.Exists(path))File.Replace(temporary,path,null);else File.Move(temporary,path);
   }finally{if(File.Exists(temporary))File.Delete(temporary);}
  }
 }
}
