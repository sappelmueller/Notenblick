using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Engines;

namespace Notenblick.Native {
 public static class VaultCrypto {
  internal const int SecretBytes = 32;
  internal const int MaxPayload = 256 * 1024 * 1024;
  internal const int HeaderBytes = 192;
  internal const int RecordOverhead = 68;
  internal const int EnvelopeOverhead = 8 + HeaderBytes + RecordOverhead;
  const int NonceBytes = 12;
  const int SaltBytes = 16;
  const int WrapBytes = NonceBytes + SecretBytes + 16;
  const int PasswordWrap = 40;
  const int RecoveryWrap = PasswordWrap + WrapBytes;
  const int HeaderTag = HeaderBytes - SecretBytes;
  const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  static readonly byte[] HeaderMagic = Encoding.ASCII.GetBytes("NBKEY001");
  static readonly byte[] RecordMagic = Encoding.ASCII.GetBytes("NBREC001");
  static readonly byte[] BackupMagic = Encoding.ASCII.GetBytes("NBVAULT1");
  internal static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);

  public static bool IsProtected(byte[] bytes) => Starts(bytes, BackupMagic);
  public static bool HasMagic(string path) {
   using (var stream = File.OpenRead(path)) {
    var prefix = new byte[BackupMagic.Length];
    return stream.Read(prefix, 0, prefix.Length) == prefix.Length && IsProtected(prefix);
   }
  }

  internal static void Clear(byte[] bytes) { if (bytes != null) Array.Clear(bytes, 0, bytes.Length); }
  internal static byte[] Random(int length) {
   var bytes = new byte[length];
   using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
   return bytes;
  }
  internal static byte[] Hash(byte[] bytes) {
   using (var hash = SHA256.Create()) return hash.ComputeHash(bytes);
  }
  internal static byte[] Mac(byte[] key, byte[] bytes) {
   using (var hmac = new HMACSHA256(key)) return hmac.ComputeHash(bytes);
  }
  internal static bool Equal(byte[] a, byte[] b) {
   if (a == null || b == null || a.Length != b.Length) return false;
   int differences = 0;
   for (int i = 0; i < a.Length; ++i) differences |= a[i] ^ b[i];
   return differences == 0;
  }
  static bool Starts(byte[] bytes, byte[] prefix) => bytes != null && bytes.Length >= prefix.Length && Equal(Slice(bytes, 0, prefix.Length), prefix);
  internal static byte[] Slice(byte[] bytes, int offset, int length) {
   var slice = new byte[length];
   Buffer.BlockCopy(bytes, offset, slice, 0, length);
   return slice;
  }
  static byte[] Concat(params byte[][] values) {
   var result = new byte[values.Sum(x => x.Length)];
   int offset = 0;
   foreach (var value in values) { Buffer.BlockCopy(value, 0, result, offset, value.Length); offset += value.Length; }
   return result;
  }

  static string Encode(byte[] bytes) {
   var result = new StringBuilder();
   int buffer = 0, bits = 0;
   foreach (byte value in bytes) {
    buffer = (buffer << 8) | value;
    bits += 8;
    while (bits >= 5) { bits -= 5; result.Append(Alphabet[(buffer >> bits) & 31]); }
   }
   if (bits > 0) result.Append(Alphabet[(buffer << (5 - bits)) & 31]);
   return result.ToString();
  }
  static string KeyText(byte[] key) {
   var checksum = Hash(key);
   try { return Encode(key) + Encode(checksum).Substring(0, 4); }
   finally { Clear(checksum); }
  }
  public static string GenerateRecovery() {
   var key = Random(SecretBytes);
   try {
    string encoded = KeyText(key);
    return string.Join("-", Enumerable.Range(0, encoded.Length / 4).Select(x => encoded.Substring(x * 4, 4)));
   } finally { Clear(key); }
  }
  internal static byte[] ParseRecovery(string input) {
   if (input == null || input.Length > 256) throw BadRecovery();
   var text = new string(input.Where(c => c != '-' && c != ' ' && c != '\r' && c != '\n' && c != '\t').ToArray()).ToUpperInvariant();
   if (text.Length != 56) throw BadRecovery();
   var key = new byte[SecretBytes];
   int buffer = 0, bits = 0, index = 0;
   foreach (char c in text.Take(52)) {
    int digit = Alphabet.IndexOf(c);
    if (digit < 0) { Clear(key); throw BadRecovery(); }
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) { bits -= 8; key[index++] = (byte)(buffer >> bits); }
   }
   if (index != key.Length || text != KeyText(key)) { Clear(key); throw BadRecovery(); }
   return key;
  }
  static InvalidDataException BadRecovery() => new InvalidDataException("Der Notfallschlüssel ist unvollständig oder falsch eingegeben.");
  internal static void VerifyRecovery(string recovery, string verification) {
   byte[] a = null, b = null;
   try {
    a = ParseRecovery(recovery); b = ParseRecovery(verification);
    if (!Equal(a, b)) throw new InvalidDataException("Die gespeicherte Schlüsseldatei passt nicht. Bitte sichere den angezeigten Notfallschlüssel erneut.");
   } finally { Clear(a); Clear(b); }
  }

  internal static void ValidateNewPassword(string password) {
   if (password == null || password.Length < 12 || string.IsNullOrWhiteSpace(password))
    throw new ArgumentException("Wähle ein Passwort mit mindestens 12 Zeichen. Mehrere Wörter sind oft leichter zu merken.");
   if (Utf8.GetByteCount(password) > 4096) throw new ArgumentException("Das Passwort ist zu lang.");
  }
  static byte[] PasswordKey(string password, byte[] salt) {
   if (string.IsNullOrEmpty(password) || password.Length > 4096 || Utf8.GetByteCount(password) > 4096) throw WrongAccess();
   var input = Utf8.GetBytes(password);
   var key = new byte[SecretBytes];
   try {
    // Format 1 fixes Argon2id v1.3 with the RFC 9106 memory-constrained profile.
    // Values are never accepted from untrusted encrypted files.
    var options = new Argon2Parameters.Builder(Argon2Parameters.Argon2id)
     .WithVersion(Argon2Parameters.Version13).WithMemoryAsKB(64 * 1024)
     .WithIterations(3).WithParallelism(4).WithSalt(salt).Build();
    var derive = new Argon2BytesGenerator();
    derive.Init(options);
    derive.GenerateBytes(input, key);
    return key;
   } catch { Clear(key); throw; }
   finally { Clear(input); }
  }
  static InvalidDataException WrongAccess() => new InvalidDataException("Das Passwort oder der Notfallschlüssel passt nicht, oder die Datei ist beschädigt.");

  static byte[] Cipher(bool encrypt, byte[] key, byte[] nonce, byte[] aad, byte[] input, int offset, int length) {
   var cipher = new GcmBlockCipher(new AesEngine());
   cipher.Init(encrypt, new AeadParameters(new KeyParameter(key), 128, nonce, aad));
   var output = new byte[cipher.GetOutputSize(length)];
   try {
    int count = cipher.ProcessBytes(input, offset, length, output, 0);
    count += cipher.DoFinal(output, count);
    if (count != output.Length) throw new InvalidDataException("Die geschützte Datei ist unvollständig.");
    return output;
   } catch (InvalidCipherTextException) { Clear(output); throw WrongAccess(); }
   catch { Clear(output); throw; }
  }
  static byte[] WrapAad(byte[] header, bool recovery) => Concat(Slice(header, 0, 24), new[] { recovery ? (byte)2 : (byte)1 });
  static void PutWrap(byte[] header, byte[] key, byte[] secret, bool recovery) {
   var nonce = Random(NonceBytes);
   var cipher = Cipher(true, key, nonce, WrapAad(header, recovery), secret, 0, secret.Length);
   int at = recovery ? RecoveryWrap : PasswordWrap;
   Buffer.BlockCopy(nonce, 0, header, at, nonce.Length);
   Buffer.BlockCopy(cipher, 0, header, at + nonce.Length, cipher.Length);
  }
  static void SignHeader(byte[] header, byte[] key) {
   var tag = Mac(key, Slice(header, 0, HeaderTag));
   Buffer.BlockCopy(tag, 0, header, HeaderTag, tag.Length);
  }
  internal static byte[] CreateHeader(byte[] key, string password, string recovery) {
   ValidateNewPassword(password);
   var header = new byte[HeaderBytes];
   Buffer.BlockCopy(HeaderMagic, 0, header, 0, HeaderMagic.Length);
   Buffer.BlockCopy(Random(16), 0, header, 8, 16);
   byte[] salt = Random(SaltBytes), passwordKey = null, recoveryKey = null;
   try {
    Buffer.BlockCopy(salt, 0, header, 24, SaltBytes);
    passwordKey = PasswordKey(password, salt); recoveryKey = ParseRecovery(recovery);
    PutWrap(header, passwordKey, key, false);
    PutWrap(header, recoveryKey, key, true);
    SignHeader(header, key);
    return header;
   } finally { Clear(passwordKey); Clear(recoveryKey); }
  }
  internal static byte[] ChangePassword(byte[] header, byte[] key, string password) {
   ValidateNewPassword(password);
   var updated = (byte[])header.Clone();
   var salt = Random(SaltBytes);
   Buffer.BlockCopy(salt, 0, updated, 24, salt.Length);
   var derived = PasswordKey(password, salt);
   try { PutWrap(updated, derived, key, false); SignHeader(updated, key); return updated; }
   finally { Clear(derived); }
  }
  internal static bool VerifiesHeader(byte[] header, byte[] key) => header != null && header.Length == HeaderBytes && Starts(header, HeaderMagic) &&
   Equal(Mac(key, Slice(header, 0, HeaderTag)), Slice(header, HeaderTag, SecretBytes));
  internal static byte[] UnlockHeader(byte[] header, string password, string recovery) {
   if (header == null || header.Length != HeaderBytes || !Starts(header, HeaderMagic)) throw new InvalidDataException("Die geschützte Datei ist beschädigt oder stammt aus einer neueren Version.");
   if (recovery != null && password != null) throw new InvalidDataException("Bitte verwende entweder das Passwort oder den Notfallschlüssel.");
   byte[] wrapKey = null, key = null;
   try {
    wrapKey = recovery != null ? ParseRecovery(recovery) : PasswordKey(password, Slice(header, 24, SaltBytes));
    int at = recovery != null ? RecoveryWrap : PasswordWrap;
    key = Cipher(false, wrapKey, Slice(header, at, NonceBytes), WrapAad(header, recovery != null), header, at + NonceBytes, SecretBytes + 16);
    if (!VerifiesHeader(header, key)) throw WrongAccess();
    return key;
   } catch { Clear(key); throw; }
   finally { Clear(wrapKey); }
  }
  internal static byte[] SealRecord(byte[] key, string purpose, byte[] data) {
   if (data == null || data.Length > MaxPayload) throw new InvalidDataException("Diese Datei ist größer als 256 MB.");
   var salt = Random(SecretBytes);
   var nonce = Random(NonceBytes);
   var prefix = Concat(RecordMagic, salt, nonce);
   var subkey = Mac(key, Concat(Utf8.GetBytes("Notenblick record key 1"), salt));
   try { return Concat(prefix, Cipher(true, subkey, nonce, Concat(prefix, Utf8.GetBytes(purpose)), data, 0, data.Length)); }
   finally { Clear(subkey); }
  }
  internal static byte[] OpenRecord(byte[] key, string purpose, byte[] source, int offset = 0) {
   if (source.Length - offset < RecordOverhead || source.Length - offset > MaxPayload + RecordOverhead ||
       !Equal(Slice(source, offset, RecordMagic.Length), RecordMagic)) throw new InvalidDataException("Die geschützte Datei ist unvollständig oder beschädigt.");
   var salt = Slice(source, offset + RecordMagic.Length, SecretBytes);
   var nonce = Slice(source, offset + RecordMagic.Length + SecretBytes, NonceBytes);
   const int prefixSize = 8 + SecretBytes + NonceBytes;
   var subkey = Mac(key, Concat(Utf8.GetBytes("Notenblick record key 1"), salt));
   try { return Cipher(false, subkey, nonce, Concat(Slice(source, offset, prefixSize), Utf8.GetBytes(purpose)), source, offset + prefixSize, source.Length - offset - prefixSize); }
   finally { Clear(subkey); }
  }
  internal static byte[] SealBackup(byte[] key, byte[] header, byte[] payload) => Concat(BackupMagic, header, SealRecord(key, "Notenblick Sicherung 1", payload));
  internal static byte[] OpenBackup(byte[] source, string password, string recovery, byte[] currentKey = null) {
   if (!IsProtected(source) || source.Length < EnvelopeOverhead || source.Length > MaxPayload + EnvelopeOverhead)
    throw new InvalidDataException("Diese geschützte Sicherung ist unvollständig oder wird nicht unterstützt.");
   var header = Slice(source, BackupMagic.Length, HeaderBytes);
   byte[] temporary = null;
   try {
    var key = currentKey != null && password == null && recovery == null && VerifiesHeader(header, currentKey) ? currentKey :
     (temporary = UnlockHeader(header, password, recovery));
    return OpenRecord(key, "Notenblick Sicherung 1", source, BackupMagic.Length + HeaderBytes);
   } finally { Clear(temporary); }
  }
 }
}
