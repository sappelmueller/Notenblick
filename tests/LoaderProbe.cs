using System;
using System.IO;
using System.Reflection;
using Notenblick.Native;

// Developer-only probe: executes the same loader compiled into Notenblick.exe.
// It needs no window, WebView2 runtime, user data or network connection.
public static class LoaderProbe
{
    public static int Main(string[] args)
    {
        var loader = new ProgramLibraries(args[1]);
        AppDomain.CurrentDomain.AssemblyResolve += loader.Resolve;
        try
        {
            loader.ValidateProgramFiles();
            loader.LoadAll();
            if (args[0] != "valid") throw new Exception("Invalid files were accepted.");
            foreach (var spec in ReleaseLibraries.Files)
            {
                var assembly = loader.Get(spec.Name);
                var expected = Path.GetFullPath(Path.Combine(args[1], "Programm", "Windows", spec.Name + ".dll"));
                if (assembly.Location != expected) throw new Exception("Unexpected assembly location.");
                if (loader.Resolve(null, new ResolveEventArgs(assembly.FullName)) != assembly)
                    throw new Exception("Assembly identity was not resolved.");
            }
            if (loader.Resolve(null, new ResolveEventArgs("Unbekannt, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null")) != null)
                throw new Exception("Unknown assembly request accepted.");
            if (loader.Resolve(null, new ResolveEventArgs("Newtonsoft.Json, Version=99.0.0.0, Culture=neutral, PublicKeyToken=null")) != null)
                throw new Exception("Different assembly identity accepted.");
            loader.LoadAll(); // Re-entry must preserve each loaded instance.
            // Execute a real dependent DLL, including its JSON dependency.
            var temporary = Path.Combine(Path.GetTempPath(), "notenblick-loader-write-" + Guid.NewGuid().ToString("N"));
            try
            {
                var storageType = loader.Get("Notenblick.Speicherung").GetType("Notenblick.Native.Storage", true);
                var storage = Activator.CreateInstance(storageType, new object[] { temporary });
                var jsonType = loader.Get("Newtonsoft.Json").GetType("Newtonsoft.Json.Linq.JObject", true);
                var parse = jsonType.GetMethod("Parse", new Type[] { typeof(string) });
                var write = parse.Invoke(null, new object[] { "{\"op\":\"write\",\"path\":\"probe.txt\",\"text\":\"Grüße 2,60\"}" });
                var read = parse.Invoke(null, new object[] { "{\"op\":\"read\",\"path\":\"probe.txt\"}" });
                var dispatch = storageType.GetMethod("Dispatch");
                dispatch.Invoke(storage, new object[] { write });
                if ((string)dispatch.Invoke(storage, new object[] { read }) != "Grüße 2,60")
                    throw new Exception("Loaded storage/JSON libraries did not round-trip the file.");
            }
            finally { if (Directory.Exists(temporary)) Directory.Delete(temporary, true); }
            Console.WriteLine("PASS: five real assemblies, original locations, exact identities, unknown requests rejected, repeated load.");
            return 0;
        }
        catch (Exception error)
        {
            if ((args[0] == "missing" && error is FileNotFoundException) ||
                (args[0] == "corrupt" && error is InvalidDataException) || (args[0] == "linked" && error is IOException))
            {
                try { loader.Get("Newtonsoft.Json"); }
                catch (FileNotFoundException) { Console.WriteLine("PASS: rejected before loading any assembly."); return 0; }
            }
            Console.Error.WriteLine(error);
            return 1;
        }
    }
}
