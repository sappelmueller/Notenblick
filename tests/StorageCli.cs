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
 static JObject VaultVectors(JObject request) {
  const System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static;
  var key = (byte[])typeof(VaultCrypto).GetMethod("PasswordKey",flags).Invoke(null,new object[]{"pässphrase für Test ? ",new byte[]{0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15}});
  var cipher = (byte[])typeof(VaultCrypto).GetMethod("Cipher",flags).Invoke(null,new object[]{true,new byte[32],new byte[12],new byte[0],new byte[16],0,16,false});
  return new JObject{{"id",request["id"]},{"ok",true},{"result",new JObject{{"argon2id",BitConverter.ToString(key).Replace("-", "").ToLowerInvariant()},{"aes256gcm",BitConverter.ToString(cipher).Replace("-", "").ToLowerInvariant()}}}};
 }
 static JObject LegacyHeader(JObject request) {
  var secret = VaultCrypto.UnlockHeader(Convert.FromBase64String((string)request["header"]),(string)request["password"],null);
  try {
   var header = VaultCrypto.CreateHeader(secret,(string)request["legacyPassword"],(string)request["recovery"]);
   return new JObject{{"id",request["id"]},{"ok",true},{"result",Convert.ToBase64String(header)}};
  } finally { VaultCrypto.Clear(secret); }
 }
 public static void Main(string[] args){using var store=new Storage(args[0],args.Length>1?(Action<string>)(stage=>{if(stage==args[1])Environment.Exit(77);}):null);string line;while((line=Console.ReadLine())!=null){JObject request=null;try{
  request=JObject.Parse(line);
  switch((string)request["op"]){
   case "test-vault-vectors": Emit(VaultVectors(request)); break;
   case "test-vault-legacy-header": Emit(LegacyHeader(request)); break;
   case "download": Emit(Download(request,args[0])); break;
   default: Emit(store.Handle(request)); break;
  }
 }catch(Exception e){Emit(new JObject{{"id",request?["id"]},{"ok",false},{"error",e.Message}});}}}
}
