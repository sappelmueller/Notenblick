using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using Newtonsoft.Json.Linq;
using Notenblick.Native;

static class Update1280Probe
{
    static void Check(bool valid, string message)
    {
        if (!valid) throw new InvalidOperationException(message);
    }

    static int Main(string[] args)
    {
        var update = File.ReadAllBytes(args[0]);
        var manifest = JObject.Parse(File.ReadAllText(args[1]));
        var expectedRescue = File.ReadAllBytes(args[2]);
        var release = new JObject {
            ["id"] = 1, ["tag_name"] = "v1.28.0", ["draft"] = false,
            ["prerelease"] = false, ["published_at"] = "2026-11-25T00:00:00Z",
            ["assets"] = new JArray(new JObject {
                ["id"] = 2, ["name"] = "Notenblick_1.28.0.zip", ["state"] = "uploaded", ["size"] = update.LongLength,
                ["browser_download_url"] = "https://github.com/sappelmueller/Notenblick/releases/download/v1.28.0/Notenblick_1.28.0.zip"
            })
        };
        var root = args[3];
        Directory.CreateDirectory(root);
        Check(!(bool)manifest["approved"], "Test package is not approved");
        // Exercise the published path in memory, without changing the test descriptor.
        manifest["approved"] = true;
        var offer = UpdateSource.Descriptor(release, manifest, "1.27.0");
        UpdateSource.Extract(update, offer, root, CancellationToken.None);
        Check(Directory.GetFileSystemEntries(root).Select(Path.GetFileName).OrderBy(x => x).SequenceEqual(new[] { "Notenblick.exe", "Programm" }), "Existing updater can extract the real compatibility archive");

        var data = Path.Combine(root, "Daten");
        Directory.CreateDirectory(data);
        var marker = Path.Combine(data, "Synthetischer-Pruefstand.txt");
        File.WriteAllText(marker, "synth");
        Directory.Move(Path.Combine(root, "Programm"), Path.Combine(root, "Programm-fehlt"));
        var releaseExe = Assembly.LoadFrom(Path.Combine(root, "Notenblick.exe"));
        var helper = releaseExe.GetType("Notenblick.Native.ReleaseRescue", true);
        var provision = helper.GetMethod("Provision", BindingFlags.NonPublic | BindingFlags.Static);
        Func<bool> install = () => (bool)provision.Invoke(null, new object[] { root });
        var rescue = Path.Combine(root, "Notenblick-Notfallzugriff.exe");
        Check(install(), "Provision without Programm");
        Check(File.ReadAllBytes(rescue).SequenceEqual(expectedRescue), "Separate and embedded rescue match");
        Check(AssemblyName.GetAssemblyName(rescue).Version.ToString(3) == "1.28.0", "Rescue version matches");
        Check(install(), "Repeat provision is idempotent");
        File.WriteAllText(rescue, "foreign synthetic file");
        Check(!install() && File.ReadAllText(rescue) == "foreign synthetic file", "Foreign file unchanged");
        File.Delete(rescue);
        Directory.CreateDirectory(rescue);
        Check(!install() && Directory.Exists(rescue), "Directory at destination unchanged");
        Directory.Delete(rescue);
        Check(install(), "Provision after destination becomes available");
        Check(File.ReadAllText(marker) == "synth" && Directory.GetFileSystemEntries(data).Length == 1, "Daten untouched");
        Check(!Directory.EnumerateFiles(root, "*.tmp").Any(), "No abandoned staged rescue files");
        Console.WriteLine("Unchanged 1.27 updater parsed and extracted the actual 1.28 update archive. Independent EXE byte identity, provisioning and Daten protection verified under .NET 8/Linux.");
        return 0;
    }
}
