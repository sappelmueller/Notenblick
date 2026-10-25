using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;

namespace Notenblick.Native
{
    // Only the exact release files in ReleaseLibraries.g.cs can be loaded.
    // No search path, URL or unrecognised request can add another assembly.
    public sealed class ProgramLibraries
    {
        public sealed class LibrarySpec
        {
            public readonly string Name;
            public readonly string Sha256;
            public LibrarySpec(string name, string sha256) { Name = name; Sha256 = sha256; }
        }

        readonly string folder;
        readonly Dictionary<string, Assembly> loaded = new Dictionary<string, Assembly>(StringComparer.OrdinalIgnoreCase);

        public ProgramLibraries(string programFolder)
        {
            folder = Path.GetFullPath(Path.Combine(programFolder, "Programm", "Windows"));
        }

        public sealed class ProgramFileSpec { public readonly string Path,Sha256;public ProgramFileSpec(string path,string sha){Path=path;Sha256=sha;} }
        public void ValidateProgramFiles(){
            var root=Directory.GetParent(folder).FullName;
            var expected=new HashSet<string>(ReleaseFiles.Files.Select(x=>x.Path),StringComparer.OrdinalIgnoreCase);
            foreach(var path in AllFiles(root))if(!expected.Contains(path.Substring(root.Length+1).Replace(System.IO.Path.DirectorySeparatorChar,'/')))throw new InvalidDataException("Im Ordner Programm liegen Dateien einer anderen Ausgabe. Bitte ersetze den vollständigen Ordner Programm durch Version @VERSION@.");
            foreach(var spec in ReleaseFiles.Files){var path=System.IO.Path.Combine(root,spec.Path.Replace('/',System.IO.Path.DirectorySeparatorChar));if(!File.Exists(path))throw new FileNotFoundException("Eine Programmdatei fehlt: "+spec.Path+". Bitte entpacke Version @VERSION@ vollständig.");string actual;using(var stream=File.OpenRead(path))using(var sha=SHA256.Create())actual=BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","");if(!String.Equals(actual,spec.Sha256,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Programmdateien unterschiedlicher Versionen oder beschädigte Dateien wurden erkannt: "+spec.Path+". Bitte ersetze Notenblick.exe und den vollständigen Ordner Programm durch dieselbe Version @VERSION@.");}
        }
        static IEnumerable<string> AllFiles(string root){if((File.GetAttributes(root)&FileAttributes.ReparsePoint)!=0)throw new IOException("Der Programmordner darf keine Verknüpfung sein.");foreach(var file in Directory.EnumerateFiles(root)){if((File.GetAttributes(file)&FileAttributes.ReparsePoint)!=0)throw new IOException("Verknüpfte Programmdateien werden nicht geladen.");yield return file;}foreach(var child in Directory.EnumerateDirectories(root))foreach(var file in AllFiles(child))yield return file;}

        public void LoadAll()
        {
            // Check the complete set first, before executing any dependency.
            foreach (var spec in ReleaseLibraries.Files) Validate(spec);
            foreach (var spec in ReleaseLibraries.Files)
            {
                if (loaded.ContainsKey(spec.Name)) continue;
                // Microsoft's per-assembly API for local DLLs carrying a
                // download-zone marker. Limited to the verified release set.
                var assembly = Assembly.UnsafeLoadFrom(FilePath(spec));
                if (!String.Equals(assembly.GetName().Name, spec.Name, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Eine Programmdatei gehört nicht zu dieser Notenblick-Version. Bitte entpacke Version @VERSION@ erneut.");
                loaded.Add(spec.Name, assembly);
            }
        }

        string FilePath(LibrarySpec spec) { return Path.Combine(folder, spec.Name + ".dll"); }

        void Validate(LibrarySpec spec)
        {
            var file = FilePath(spec);
            if (!File.Exists(file))
                throw new FileNotFoundException("Die Programmdatei „" + spec.Name + ".dll“ fehlt. Bitte entpacke den vollständigen Ordner der Version @VERSION@ erneut.");
            string actual;
            using (var stream = File.OpenRead(file))
            using (var sha = SHA256.Create())
                actual = BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "");
            if (!String.Equals(actual, spec.Sha256, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Die Programmdatei „" + spec.Name + ".dll“ ist beschädigt oder gehört zu einer anderen Version. Bitte entpacke Version @VERSION@ erneut.");
        }

        public Assembly Get(string name)
        {
            Assembly assembly;
            if (!loaded.TryGetValue(name, out assembly)) throw new FileNotFoundException("Eine benötigte Programmdatei wurde nicht geladen.");
            return assembly;
        }

        public Assembly Resolve(object sender, ResolveEventArgs args)
        {
            var request = new AssemblyName(args.Name);
            Assembly assembly;
            if (!loaded.TryGetValue(request.Name, out assembly)) return null;
            return String.Equals(request.FullName, assembly.FullName, StringComparison.OrdinalIgnoreCase) ? assembly : null;
        }
    }
}
