using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using Newtonsoft.Json.Linq;
namespace Notenblick.Native {
 public static class ExportFiles {
  public const int MaximumBytes=256*1024*1024;
  // Windows components are checked explicitly, including on the Linux test host.
  // A component is never a path: callers must validate the archive hierarchy separately.
  public static string Component(string name,int maximum=240){
   if(String.IsNullOrWhiteSpace(name)||name.Length>maximum||name=="."||name==".."||name.EndsWith(".")||name.EndsWith(" ")||name.IndexOfAny(new[]{'<','>',':','"','|','?','*','/','\\'})>=0)throw new InvalidDataException("Ungültiger Exportdateiname.");
   foreach(char ch in name)if(ch<32||ch==127)throw new InvalidDataException("Ungültiger Exportdateiname.");
   if(System.Text.RegularExpressions.Regex.IsMatch(name,@"^(con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?: *\.|$)",System.Text.RegularExpressions.RegexOptions.IgnoreCase|System.Text.RegularExpressions.RegexOptions.CultureInvariant))throw new InvalidDataException("Ungültiger Exportdateiname.");
   return name;
  }
  public static string FileName(string proposed){
   Component(proposed);if(proposed!=Path.GetFileName(proposed)||proposed.IndexOfAny(Path.GetInvalidFileNameChars())>=0)throw new InvalidDataException("Ungültiger Exportdateiname.");
   var extension=Path.GetExtension(proposed).ToLowerInvariant();
   if(Array.IndexOf(new[]{".json",".txt",".csv",".pdf",".docx",".xlsx",".zip"},extension)<0)throw new InvalidDataException("Dieses Dateiformat wird nicht unterstützt.");return proposed;
  }
  public static string Filter(string name){switch(Path.GetExtension(name).ToLowerInvariant()){
   case ".zip":return "ZIP-Archiv (*.zip)|*.zip";
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
   var limit=Path.GetExtension(name).Equals(".zip",StringComparison.OrdinalIgnoreCase)?64*1024*1024:MaximumBytes;
   var encoded=(string)request["dataBase64"];byte[] bytes;
   if(encoded!=null){if(encoded.Length>(limit/3+1)*4)throw new InvalidDataException("Die Exportdatei ist zu groß.");try{bytes=Convert.FromBase64String(encoded);}catch{throw new InvalidDataException("Die Exportdatei ist beschädigt.");}}
   else {var text=(string)request["text"];if(text==null)throw new InvalidDataException("Es wurden keine Dateiinhalte übergeben.");bytes=new UTF8Encoding(false,true).GetBytes(text);}
   if(bytes.Length==0||bytes.Length>limit)throw new InvalidDataException("Ungültige Exportdateigröße.");
   ValidateContent(bytes,name);return bytes;
  }
  public static void ValidateContent(byte[] bytes,string name){
   var ext=Path.GetExtension(name).ToLowerInvariant();if(ext==".pdf"){
    // The document validators check tags/content independently. Here reject
    // truncated/spoofed payloads before the save dialog as well as in batches.
    bool valid=bytes.Length>=32&&System.Text.RegularExpressions.Regex.IsMatch(Encoding.ASCII.GetString(bytes,0,8),@"^%PDF-[12]\.[0-9]");
    if(valid){var tail=Encoding.ASCII.GetString(bytes,Math.Max(0,bytes.Length-1024),Math.Min(1024,bytes.Length));var match=System.Text.RegularExpressions.Regex.Match(tail,@"startxref\s+(\d+)\s+%%EOF[\t\r\n ]*$");long offset;
     valid=match.Success&&Int64.TryParse(match.Groups[1].Value,out offset)&&offset>=8&&offset<bytes.Length-16;
     if(valid){int at=Int32.Parse(match.Groups[1].Value);var xref=Encoding.ASCII.GetString(bytes,at,Math.Min(256,bytes.Length-at));valid=xref.StartsWith("xref")||System.Text.RegularExpressions.Regex.IsMatch(xref,@"^\d+\s+\d+\s+obj\s*<<[\s\S]*/Type\s*/XRef\b");}
    }
    if(!valid)throw new InvalidDataException("Ungültige PDF-Datei.");
   }
   if(ext==".docx"||ext==".xlsx")OfficePackage.Validate(bytes,ext);if(ext==".zip")OfficePackage.ValidateBatch(bytes);
  }
  public static string ErrorCode(Exception error){return error is DirectoryNotFoundException||error is DriveNotFoundException?"export-location-unavailable":error is UnauthorizedAccessException||error is System.Security.SecurityException?"export-permission":"export-save-failed";}
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
