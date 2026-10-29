using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Collections.Generic;
using System.Xml;
namespace Notenblick.Native {
 public static class OfficePackage {
  static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
  static readonly uint[] CrcTable=MakeCrc();
  static uint[] MakeCrc(){var table=new uint[256];for(uint n=0;n<256;n++){var value=n;for(int bit=0;bit<8;bit++)value=(value&1)!=0?0xedb88320^(value>>1):value>>1;table[n]=value;}return table;}
  static ushort U16(byte[] bytes,int offset){if(offset<0||offset>bytes.Length-2)throw new InvalidDataException();return (ushort)(bytes[offset]|bytes[offset+1]<<8);}
  static uint U32(byte[] bytes,int offset){return (uint)(U16(bytes,offset)|(uint)U16(bytes,offset+2)<<16);}
  static void Require(bool value){if(!value)throw new InvalidDataException();}
  static Dictionary<string,uint> DirectoryCrc(byte[] bytes){
   int end=-1;for(int i=bytes.Length-22;i>=Math.Max(0,bytes.Length-65557);i--)if(U32(bytes,i)==0x06054b50&&i+22+U16(bytes,i+20)==bytes.Length){end=i;break;}
   Require(end>=0&&U16(bytes,end+4)==0&&U16(bytes,end+6)==0);
   int count=U16(bytes,end+10);Require(count>0&&count<=4096&&U16(bytes,end+8)==count);
   uint start=U32(bytes,end+16),size=U32(bytes,end+12);Require((ulong)start+size==(ulong)end);
   var result=new Dictionary<string,uint>(StringComparer.OrdinalIgnoreCase);var ranges=new List<Tuple<long,long>>();int at=(int)start;
   for(int i=0;i<count;i++){
    Require(U32(bytes,at)==0x02014b50);int names=U16(bytes,at+28),extra=U16(bytes,at+30),comment=U16(bytes,at+32);Require((long)at+46+names+extra+comment<=end);
    string name=Utf8.GetString(bytes,at+46,names);Require(name.Length>0&&!name.StartsWith("/")&&!name.Contains("\\")&&!name.Contains(":")&&!result.ContainsKey(name));foreach(var part in name.Split('/'))Require(part!="."&&part!="..");
    uint crc=U32(bytes,at+16),local=U32(bytes,at+42),packed=U32(bytes,at+20),unpacked=U32(bytes,at+24);int flags=U16(bytes,at+8),method=U16(bytes,at+10);Require((flags&~0x080e)==0&&(method==0||method==8)&&(method!=0||(flags&6)==0)&&U16(bytes,at+34)==0&&(ulong)local+30<=start&&U32(bytes,(int)local)==0x04034b50);
    int localAt=(int)local;long payload=(long)local+30+U16(bytes,localAt+26)+U16(bytes,localAt+28),limit=payload+packed;Require(payload<=start&&limit<=start&&U16(bytes,localAt+8)==method&&U16(bytes,localAt+6)==flags&&Utf8.GetString(bytes,localAt+30,U16(bytes,localAt+26))==name);
    if(method==0)Require(packed==unpacked);
    if((flags&8)==0)Require(U32(bytes,localAt+14)==crc&&U32(bytes,localAt+18)==packed&&U32(bytes,localAt+22)==unpacked);
    else{int descriptor=(int)limit;if(U32(bytes,descriptor)==0x08074b50)descriptor+=4;Require((long)descriptor+12<=start&&U32(bytes,descriptor)==crc&&U32(bytes,descriptor+4)==packed&&U32(bytes,descriptor+8)==unpacked);limit=descriptor+12;}
    // Reject links/devices, aliased local headers, overlapping data and orphan payloads.
    int unixType=(int)(U32(bytes,at+38)>>16)&0xf000;Require(unixType==0||unixType==0x8000||unixType==0x4000);ranges.Add(Tuple.Create((long)local,limit));
    result.Add(name,crc);at+=46+names+extra+comment;
   }
   Require(at==end);ranges.Sort((a,b)=>a.Item1.CompareTo(b.Item1));long next=0;foreach(var range in ranges){Require(range.Item1==next&&range.Item2>range.Item1);next=range.Item2;}Require(next==start);return result;
  }
  public static void Validate(byte[] bytes,string extension){
   try{
    var expected=DirectoryCrc(bytes);var documents=new Dictionary<string,XmlDocument>(StringComparer.Ordinal);long total=0;
    using(var stream=new MemoryStream(bytes,false))using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
     Require(zip.Entries.Count==expected.Count);
     foreach(var entry in zip.Entries){
      total+=entry.Length;Require(total<=ExportFiles.MaximumBytes&&entry.Length<=ExportFiles.MaximumBytes&&expected.ContainsKey(entry.FullName));
      using(var source=entry.Open())using(var data=new MemoryStream()){
       var buffer=new byte[32768];int read;uint crc=0xffffffff;long length=0;
       while((read=source.Read(buffer,0,buffer.Length))>0){length+=read;Require(length<=entry.Length);for(int i=0;i<read;i++)crc=CrcTable[(crc^buffer[i])&255]^(crc>>8);data.Write(buffer,0,read);}
       Require(length==entry.Length&&(crc^0xffffffff)==expected[entry.FullName]);
       if(entry.FullName.EndsWith(".xml",StringComparison.OrdinalIgnoreCase)||entry.FullName.EndsWith(".rels",StringComparison.OrdinalIgnoreCase)){
        data.Position=0;var settings=new XmlReaderSettings{DtdProcessing=DtdProcessing.Prohibit,XmlResolver=null,MaxCharactersInDocument=ExportFiles.MaximumBytes};
        var doc=new XmlDocument{XmlResolver=null};using(var xml=XmlReader.Create(data,settings))doc.Load(xml);documents.Add(entry.FullName,doc);
       }
      }
     }
    }
    string main=extension==".docx"?"word/document.xml":"xl/workbook.xml",rootName=extension==".docx"?"document":"workbook",mainType=extension==".docx"?"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
    Require(documents.ContainsKey("[Content_Types].xml")&&documents.ContainsKey("_rels/.rels")&&documents.ContainsKey(main)&&documents[main].DocumentElement.LocalName==rootName);
    bool mainContent=false,mainRelation=false;
    foreach(XmlNode node in documents["[Content_Types].xml"].DocumentElement.ChildNodes)if(node is XmlElement){var e=(XmlElement)node;Require(!e.GetAttribute("ContentType").ToLowerInvariant().Contains("macro"));if(e.LocalName=="Override"){Require(expected.ContainsKey(e.GetAttribute("PartName").TrimStart('/')));if(e.GetAttribute("PartName")=="/"+main&&e.GetAttribute("ContentType")==mainType)mainContent=true;}}
    foreach(var pair in documents)if(pair.Key.EndsWith(".rels",StringComparison.Ordinal)){
     Require(pair.Value.DocumentElement.LocalName=="Relationships");var ids=new HashSet<string>();string source=pair.Key=="_rels/.rels"?"":pair.Key.Replace("/_rels/","/").Substring(0,pair.Key.Replace("/_rels/","/").Length-5);
     foreach(XmlNode node in pair.Value.DocumentElement.ChildNodes)if(node is XmlElement){var e=(XmlElement)node;string target=e.GetAttribute("Target"),id=e.GetAttribute("Id");Require(e.LocalName=="Relationship"&&id.Length>0&&ids.Add(id)&&!String.Equals(e.GetAttribute("TargetMode"),"External",StringComparison.OrdinalIgnoreCase)&&target.Length>0&&!target.Contains(":")&&!target.Contains("\\")&&!target.Contains("#")&&!target.Contains("?"));
      var resolved=new Uri(new Uri("https://notenblick.invalid/"+source),target);Require(resolved.Host=="notenblick.invalid"&&expected.ContainsKey(Uri.UnescapeDataString(resolved.AbsolutePath).TrimStart('/')));
      if(pair.Key=="_rels/.rels"&&e.GetAttribute("Type")=="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"&&Uri.UnescapeDataString(resolved.AbsolutePath)=="/"+main)mainRelation=true;
     }
    }
    Require(mainContent&&mainRelation);
   }catch{throw new InvalidDataException("Ungültige Office-Datei.");}
  }
  public static void ValidateBatch(byte[] bytes){
   try{
    Require(bytes.Length<=64*1024*1024);var expected=DirectoryCrc(bytes);long total=0;string format=null;
    // Compare canonical paths without changing the actual ZIP entry names.
    var files=new HashSet<string>(StringComparer.OrdinalIgnoreCase);var directories=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach(var path in expected.Keys){
     Require(path.Length<=2048);var parts=path.Split('/');Require(parts.Length<=32);string parent="";
     for(int i=0;i<parts.Length;i++){ExportFiles.Component(parts[i],120);var key=parts[i].Normalize(NormalizationForm.FormC);parent+=(i==0?"":"/")+key;
      if(i<parts.Length-1){Require(!files.Contains(parent));directories.Add(parent);}else Require(!directories.Contains(parent)&&files.Add(parent));
     }
    }
    using(var stream=new MemoryStream(bytes,false))using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
     Require(zip.Entries.Count==expected.Count);
     foreach(var entry in zip.Entries){
      var path=entry.FullName;var name=ExportFiles.FileName(path.Substring(path.LastIndexOf('/')+1));var ext=Path.GetExtension(name).ToLowerInvariant();
      Require(Array.IndexOf(new[]{".pdf",".docx",".xlsx",".txt",".csv"},ext)>=0);if(format==null)format=ext;Require(format==ext);
      total+=entry.Length;Require(entry.Length>0&&total<=64*1024*1024&&expected.ContainsKey(path));
      using(var source=entry.Open())using(var data=new MemoryStream()){
       var buffer=new byte[32768];int read;uint crc=0xffffffff;long length=0;
       while((read=source.Read(buffer,0,buffer.Length))>0){length+=read;Require(length<=entry.Length);for(int i=0;i<read;i++)crc=CrcTable[(crc^buffer[i])&255]^(crc>>8);data.Write(buffer,0,read);}
       Require(length==entry.Length&&(crc^0xffffffff)==expected[path]);
       // Validate one document at a time, before any save dialog or disk write.
       var content=data.ToArray();if(ext==".txt"||ext==".csv")Utf8.GetString(content);else ExportFiles.ValidateContent(content,name);
      }
     }
    }
   }catch{throw new InvalidDataException("Ungültiges ZIP-Archiv.");}
  }
 }
}
