using System;
using System.Runtime.InteropServices;

namespace Notenblick.Native
{
    internal static class ProcessArchitecture
    {
        [StructLayout(LayoutKind.Sequential)]
        struct SystemInfo
        {
            public ushort ProcessorArchitecture, Reserved;
            public uint PageSize;
            public IntPtr MinimumAddress, MaximumAddress, ActiveProcessorMask;
            public uint NumberOfProcessors, ProcessorType, AllocationGranularity;
            public ushort ProcessorLevel, ProcessorRevision;
        }

        [DllImport("kernel32.dll", ExactSpelling = true)]
        static extern void GetSystemInfo(out SystemInfo info);

        internal static string Current()
        {
            SystemInfo info;
            // GetSystemInfo describes the calling process's execution environment,
            // including x86/x64 emulation. Never select a loader by host CPU or
            // inherited/editable PROCESSOR_ARCHITECTURE environment variables.
            GetSystemInfo(out info);
            return LoaderFolder(info.ProcessorArchitecture, IntPtr.Size);
        }

        internal static string LoaderFolder(ushort architecture, int pointerSize)
        {
            if (architecture == 0 && pointerSize == 4) return "x86";
            if (architecture == 9 && pointerSize == 8) return "x64";
            if (architecture == 12 && pointerSize == 8) return "arm64";
            throw new PlatformNotSupportedException("Diese Prozessorarchitektur wird nicht unterstützt.");
        }
    }
}
