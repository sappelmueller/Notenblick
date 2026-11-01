using System;
using System.Runtime.InteropServices;
using Notenblick.Native;

// Linux executes only the deterministic selection; no Windows API is simulated.
public static class ArchitectureProbe
{
    public static int Main()
    {
        if (ProcessArchitecture.LoaderFolder(0, 4) != "x86" ||
            ProcessArchitecture.LoaderFolder(9, 8) != "x64" ||
            ProcessArchitecture.LoaderFolder(12, 8) != "arm64") return 1;
        foreach (var item in new[] { new[] { 0, 8 }, new[] { 9, 4 }, new[] { 12, 4 }, new[] { 5, 4 }, new[] { 65535, 8 } })
        {
            try { ProcessArchitecture.LoaderFolder((ushort)item[0], item[1]); return 2; }
            catch (PlatformNotSupportedException) { }
        }
        var structure = typeof(ProcessArchitecture).GetNestedType("SystemInfo", System.Reflection.BindingFlags.NonPublic);
        if (Marshal.SizeOf(structure) != (IntPtr.Size == 8 ? 48 : 36)) return 3;
        Console.WriteLine("PASS: x86/x64/ARM64 selection, unsupported/mismatched layouts rejected; SYSTEM_INFO ABI size.");
        return 0;
    }
}
