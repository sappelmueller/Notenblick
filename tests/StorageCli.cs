using System;using System.IO;using Newtonsoft.Json.Linq;using Notenblick.Native;
public static class StorageCli{
 static void Emit(JObject value){Console.WriteLine(value.ToString(Newtonsoft.Json.Formatting.None));}
 static void Progress(JObject request,string phase){Emit(new JObject{{"id",request["id"]},{"progress",phase}});}
 // Test adapter replaces only the Windows save dialog with a synthetic target.
 // Decode, content checks, destination protection and atomic write are production code.
 static JObject Download(JObject request,string root){var reply=new JObject{{"id",request["id"]},{"ok",false}};bool prepared=false;try{
  var name=ExportFiles.FileName((string)request["name"]);Progress(request,"validating");var bytes=ExportFiles.Decode(request,name);prepared=true;Progress(request,"save-dialog");
  var directory=Path.Combine(root,"TestExports");Directory.CreateDirectory(directory);var path=Path.Combine(directory,name);ExportFiles.CheckDestination(path,name,Path.Combine(root,"Daten"));Progress(request,"writing");ExportFiles.Write(path,bytes);reply["ok"]=true;reply["result"]=true;
 }catch(Exception e){reply["error"]=e.Message;reply["code"]=prepared?ExportFiles.ErrorCode(e):"export-invalid-file";}return reply;}
 public static void Main(string[] args){var store=new Storage(args[0]);string line;while((line=Console.ReadLine())!=null){JObject request=null;try{request=JObject.Parse(line);Emit((string)request["op"]=="download"?Download(request,args[0]):store.Handle(request));}catch(Exception e){Emit(new JObject{{"id",request?["id"]},{"ok",false},{"error",e.Message}});}}}
}
