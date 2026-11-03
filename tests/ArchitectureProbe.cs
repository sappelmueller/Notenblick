using System;
using System.Runtime.InteropServices;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Reflection;
using System.Reflection.Emit;
using System.Reflection.Metadata;
using System.Reflection.Metadata.Ecma335;
using System.Reflection.PortableExecutable;
using Notenblick.Native;

// Linux executes only the deterministic selection; no Windows API is simulated.
public static class ArchitectureProbe
{
    static List<(OpCode Op, int Token)> Instructions(byte[] bytes)
    {
        var codes = typeof(OpCodes).GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(f => f.FieldType == typeof(OpCode)).Select(f => (OpCode)f.GetValue(null))
            .ToDictionary(op => unchecked((ushort)op.Value));
        var result = new List<(OpCode, int)>();
        for (int at = 0; at < bytes.Length;)
        {
            ushort value = bytes[at++];
            if (value == 0xfe) value = (ushort)(0xfe00 | bytes[at++]);
            var op = codes[value]; int size;
            switch (op.OperandType)
            {
                case OperandType.InlineNone: size = 0; break;
                case OperandType.ShortInlineBrTarget: case OperandType.ShortInlineI: case OperandType.ShortInlineVar: size = 1; break;
                case OperandType.InlineVar: size = 2; break;
                case OperandType.InlineI8: case OperandType.InlineR: size = 8; break;
                case OperandType.InlineSwitch: size = 4 + 4 * BitConverter.ToInt32(bytes, at); break;
                default: size = 4; break;
            }
            result.Add((op, size == 4 ? BitConverter.ToInt32(bytes, at) : 0)); at += size;
        }
        return result;
    }

    static void WindowStartup(string path)
    {
        using var stream = File.OpenRead(path);
        using var pe = new PEReader(stream); var metadata = pe.GetMetadataReader();
        int maximized = 0;
        foreach (var typeHandle in metadata.TypeDefinitions)
        foreach (var methodHandle in metadata.GetTypeDefinition(typeHandle).GetMethods())
        {
            var method = metadata.GetMethodDefinition(methodHandle);
            if (method.RelativeVirtualAddress == 0) continue;
            var il = Instructions(pe.GetMethodBody(method.RelativeVirtualAddress).GetILBytes());
            int stateAt = -1, shownAt = -1;
            for (int i = 0; i < il.Count; i++)
            {
                if (il[i].Op != OpCodes.Call && il[i].Op != OpCodes.Callvirt) continue;
                var handle = MetadataTokens.EntityHandle(il[i].Token);
                var name = handle.Kind == HandleKind.MemberReference ? metadata.GetString(metadata.GetMemberReference((MemberReferenceHandle)handle).Name)
                    : handle.Kind == HandleKind.MethodDefinition ? metadata.GetString(metadata.GetMethodDefinition((MethodDefinitionHandle)handle).Name) : "";
                if (name == "set_WindowState")
                {
                    if (metadata.GetString(method.Name) != ".ctor" || i == 0 || il[i - 1].Op != OpCodes.Ldc_I4_2)
                        throw new Exception("Window state must be Maximized in the constructor.");
                    stateAt = i; maximized++;
                }
                if (name == "add_Shown") shownAt = i;
                if ((name == "set_Size" || name == "set_Location") && metadata.GetString(method.Name) != ".ctor")
                    throw new Exception("Unexpected delayed window resizing.");
                if (name == "set_MaximizeBox" || name == "set_FormBorderStyle")
                    throw new Exception("Window restore/resize controls must retain their standard behavior.");
            }
            if (stateAt >= 0 && (shownAt < 0 || stateAt >= shownAt)) throw new Exception("Maximized state must precede Shown.");
        }
        if (maximized != 1) throw new Exception("Expected exactly one startup maximization.");
        Console.WriteLine("PASS: compiled Windows DLL maximizes before Shown; no delayed size/location writes; normal restore/resize controls.");
    }

    public static int Main(string[] args)
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
        WindowStartup(args[0]);
        return 0;
    }
}
