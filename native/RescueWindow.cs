using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Notenblick.Native {
    internal sealed class RescueWindow : Form {
        private readonly StatusLabel status = new StatusLabel();
        private readonly Font errorFont;
        private readonly Label location = NewLabel();
        private readonly ComboBox restorePoint = Choice("Gespeicherter Stand");
        private readonly ComboBox year = Choice("Schuljahr");
        private readonly ComboBox schoolClass = Choice("Klasse");
        private readonly ComboBox course = Choice("Fach");
        private readonly ComboBox list = Choice("Notenliste");
        private readonly TextBox secret = new TextBox { UseSystemPasswordChar = true, Dock = DockStyle.Fill, MaxLength = 0 };
        private readonly CheckBox showSecret = new CheckBox { Text = "Passwort an&zeigen", AutoSize = true };
        private readonly TextBox preview = new TextBox {
            AccessibleName = "Inhalt der Notenliste", Multiline = true, ReadOnly = true,
            ScrollBars = ScrollBars.Both, WordWrap = false, Dock = DockStyle.Fill, Height = 185,
            BackColor = SystemColors.Window
        };
        private readonly Button open = NewButton("Ö&ffnen");
        private readonly Button changeCredential = NewButton("Mit Notfallschlüssel öffnen");
        private readonly Button pickKey = NewButton("Schlüsseldatei auswählen");
        private readonly Button rawCopy = NewButton("Geschützte Sicherung kopieren");
        private readonly Button saveList = NewButton("Notenlisten als TXT speichern");
        private readonly Button saveAll = NewButton("Entschlüsselte Datenkopie erstellen");
        private readonly Button chooseDirectory = NewButton("&Datenordner auswählen");
        private readonly Button chooseFile = NewButton("&Sicherung auswählen");
        private readonly Button lockAccess = NewButton("Zugriff sperren");
        private readonly TableLayoutPanel credentialPanel = Column();
        private readonly TableLayoutPanel listPanel = Column();
        private readonly TableLayoutPanel pointPanel = Column();
        private readonly Label secretLabel = NewLabel();
        private RescueSource source;
        private RescueSnapshot snapshot;
        private bool recoveryMode, busy, filling, lockRequested;

        private sealed class StatusLabel : Label {
            internal StatusLabel() {
                AutoSize = true;
                Margin = new Padding(1, 3, 1, 6);
                UseMnemonic = false;
                LiveSetting = System.Windows.Forms.Automation.AutomationLiveSetting.Polite;
            }
            internal void Announce() { AccessibilityObject.RaiseLiveRegionChanged(); }
        }

        private sealed class Option {
            internal readonly string Label, Value;
            internal Option(string label, string value) { Label = label; Value = value; }
            public override string ToString() { return Label; }
        }

        internal RescueWindow() {
            Text = "Notfallzugriff für Notenblick";
            Font = SystemFonts.MessageBoxFont;
            errorFont = new Font(Font, FontStyle.Bold);
            AutoScaleMode = AutoScaleMode.Dpi;
            KeyPreview = true;
            KeyDown += (s, e) => {
                if (e.KeyCode != Keys.F1) return;
                e.Handled = e.SuppressKeyPress = true;
                MessageBox.Show(this, "Wähle deinen Datenordner oder eine Sicherung. Geschützte Noten öffnest du mit deinem Passwort oder Notfallschlüssel. Anschließend kannst du Notenlisten lesen und eine Kopie speichern. Deine Originale bleiben erhalten.", "Hilfe zum Notfallzugriff", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(800, 690);
            MinimumSize = new Size(390, 390);
            try { using (var identified = Icon.ExtractAssociatedIcon(Application.ExecutablePath)) if (identified != null) Icon = (Icon)identified.Clone(); } catch (ArgumentException) {}

            var surface = new Panel { Dock = DockStyle.Fill, AutoScroll = true, BackColor = SystemColors.Control };
            var shell = Column();
            shell.Dock = DockStyle.Top;
            shell.Padding = new Padding(18, 14, 18, 14);
            surface.Controls.Add(shell);
            Controls.Add(surface);
            var heading = NewLabel("Notfallzugriff für Notenblick");
            heading.Font = new Font(Font.FontFamily, Font.Size + 6, FontStyle.Bold);
            shell.Controls.Add(heading);
            shell.Controls.Add(NewLabel("Öffne vorhandene Noten oder sichere eine Kopie. Die Originale bleiben erhalten."));
            shell.Controls.Add(Buttons(chooseDirectory, chooseFile));
            shell.Controls.Add(location);
            var secretRow = Column();
            secretRow.Controls.Add(secretLabel);
            secretRow.Controls.Add(secret);
            credentialPanel.Controls.Add(secretRow);
            credentialPanel.Controls.Add(showSecret);
            credentialPanel.Controls.Add(Buttons(open, changeCredential, pickKey));
            shell.Controls.Add(credentialPanel);
            pointPanel.Controls.Add(WithLabel("Gespeicherter &Stand", restorePoint));
            shell.Controls.Add(pointPanel);
            shell.Controls.Add(status);
            shell.Controls.Add(listPanel);
            listPanel.Controls.Add(WithLabel("Schul&jahr", year));
            listPanel.Controls.Add(WithLabel("&Klasse", schoolClass));
            listPanel.Controls.Add(WithLabel("&Fach", course));
            listPanel.Controls.Add(WithLabel("&Notenliste", list));
            listPanel.Controls.Add(preview);
            shell.Controls.Add(Buttons(rawCopy, saveList, saveAll, lockAccess, NewButton("S&chließen", (s, e) => Close())));
            EventHandler adjust = (s, e) => {
                int usable = Math.Max(210, surface.ClientSize.Width - SystemInformation.VerticalScrollBarWidth - 2 * shell.Padding.Left - 10);
                location.MaximumSize = new Size(usable, 0);
                status.MaximumSize = new Size(usable, 0);
                foreach (var row in shell.Controls.OfType<FlowLayoutPanel>().Concat(credentialPanel.Controls.OfType<FlowLayoutPanel>())) row.MaximumSize = new Size(usable, 0);
                foreach (var label in shell.Controls.OfType<Label>()) label.MaximumSize = new Size(usable, 0);
            };
            ClientSizeChanged += adjust;
            adjust(this, EventArgs.Empty);

            chooseDirectory.Click += async (s, e) => { using (var dialog = new FolderBrowserDialog { Description = "Notenblick-Datenordner auswählen", ShowNewFolderButton = false }) if (dialog.ShowDialog(this) == DialogResult.OK) await SelectSource(dialog.SelectedPath, chooseDirectory); };
            chooseFile.Click += async (s, e) => { using (var dialog = new OpenFileDialog { Title = "Notenblick-Sicherung auswählen", Filter = "Notenblick-Sicherungen|*.nbx;*.nbk;*.json;*.zip|Alle Dateien|*.*", CheckFileExists = true, Multiselect = false }) if (dialog.ShowDialog(this) == DialogResult.OK) await SelectSource(dialog.FileName, chooseFile); };
            open.Click += async (s, e) => await OpenSelected(true);
            changeCredential.Click += (s, e) => { recoveryMode = !recoveryMode; secret.Clear(); showSecret.Checked = false; ConfigureCredential(); secret.Focus(); };
            pickKey.Click += async (s, e) => {
                using (var dialog = new OpenFileDialog { Title = "Gesicherten Notfallschlüssel auswählen", Filter = "Textdateien|*.txt;*.key|Alle Dateien|*.*", CheckFileExists = true, Multiselect = false }) {
                    if (dialog.ShowDialog(this) != DialogResult.OK) { pickKey.Focus(); return; }
                    try {
                        RescuePaths.NoLinks(dialog.FileName);
                        using (var reader = new StreamReader(new FileStream(dialog.FileName, FileMode.Open, FileAccess.Read, FileShare.Read))) {
                            if (reader.BaseStream.Length > 65536) throw new IOException();
                            var content = reader.ReadToEnd();
                            secret.Text = ReadKeyText(content);
                        }
                        await OpenSelected(true);
                    } catch { SetStatus("Die Schlüsseldatei konnte nicht gelesen werden. Wähle die gesicherte Textdatei oder füge den Schlüssel ein.", true); secret.Focus(); }
                }
            };
            showSecret.CheckedChanged += (s, e) => secret.UseSystemPasswordChar = !showSecret.Checked;
            secret.Enter += (s, e) => AcceptButton = open;
            secret.Leave += (s, e) => AcceptButton = null;
            restorePoint.SelectionChangeCommitted += async (s, e) => await OpenSelected(false);
            year.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(1); };
            schoolClass.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(2); };
            course.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(3); };
            list.SelectedIndexChanged += (s, e) => { if (!filling) ShowList(); };
            rawCopy.Click += async (s, e) => await Export(true, false);
            saveList.Click += async (s, e) => await Export(false, true);
            saveAll.Click += async (s, e) => await Export(false, false);
            lockAccess.Click += (s, e) => Lock();
            FormClosing += (s, e) => { if (busy) { e.Cancel = true; SetStatus("Warte, bis der laufende Vorgang abgeschlossen ist."); } };
            FormClosed += (s, e) => { SystemEvents.SessionSwitch -= SessionSwitch; ClearSnapshot(); source?.Dispose(); errorFont.Dispose(); };
            SystemEvents.SessionSwitch += SessionSwitch;
            Shown += async (s, e) => {
                var root = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Daten");
                if (Directory.Exists(root)) await SelectSource(root, chooseDirectory);
                else { SetStatus("Wähle den Notenblick-Datenordner oder eine Sicherung."); chooseDirectory.Focus(); }
            };
            ConfigureCredential();
            RefreshActions();
        }

        internal static string ReadKeyText(string content) {
            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(line => line.Trim()).ToArray();
            var prefix = new[] { "Notfallschlüssel:", "Notfallschluessel:" };
            foreach (var name in prefix) {
                var at = Array.FindIndex(lines, line => line.StartsWith(name, StringComparison.OrdinalIgnoreCase));
                if (at < 0) continue;
                var value = lines[at].Substring(name.Length).Trim();
                if (value.Length > 0) return value;
                if (at + 1 < lines.Length) return lines[at + 1];
            }
            if (lines.Length == 1) return lines[0];
            throw new InvalidDataException();
        }

        private static TableLayoutPanel Column() {
            var grid = new TableLayoutPanel { ColumnCount = 1, RowCount = 0, Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Margin = new Padding(0) };
            grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            return grid;
        }

        private static Label NewLabel(string value = "") { return new Label { Text = value, AutoSize = true, Margin = new Padding(1, 3, 1, 6), UseMnemonic = false }; }
        private static Button NewButton(string label, EventHandler action = null) {
            var element = new Button { Text = label, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Padding = new Padding(5, 3, 5, 3) };
            if (action != null) element.Click += action;
            return element;
        }
        private static ComboBox Choice(string name) { return new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Top, AccessibleName = name }; }
        private static Control WithLabel(string text, ComboBox box) {
            var parent = Column();
            var label = NewLabel(text);
            label.UseMnemonic = true;
            parent.Controls.Add(label);
            parent.Controls.Add(box);
            return parent;
        }
        private static Control Buttons(params Control[] buttons) {
            var row = new FlowLayoutPanel { Dock = DockStyle.Top, AutoSize = true, WrapContents = true, Margin = new Padding(0, 3, 0, 6) };
            row.Controls.AddRange(buttons);
            return row;
        }

        private static string Value(ComboBox box) { return (box.SelectedItem as Option)?.Value; }
        private static void Options(ComboBox box, Option[] options, bool includeAll) {
            box.Items.Clear();
            if (includeAll) box.Items.Add(new Option("Alle", null));
            box.Items.AddRange(options);
            if (box.Items.Count > 0) box.SelectedIndex = 0;
        }

        private void ConfigureCredential() {
            secretLabel.Text = recoveryMode ? "Notfallschlüssel" : "Passwort";
            secret.AccessibleName = secretLabel.Text;
            changeCredential.Text = recoveryMode ? "Mit Passwort öffnen" : "Mit Notfallschlüssel öffnen";
            pickKey.Visible = recoveryMode;
            showSecret.Text = recoveryMode ? "Notfallschlüssel an&zeigen" : "Passwort an&zeigen";
        }

        private bool NeedsCredential { get { return source != null && source.Protected && !source.IsUnlocked; } }

        private void RefreshActions() {
            chooseDirectory.Enabled = chooseFile.Enabled = !busy;
            open.Enabled = !busy;
            secret.Enabled = showSecret.Enabled = changeCredential.Enabled = pickKey.Enabled = !busy;
            credentialPanel.Visible = NeedsCredential;
            restorePoint.Enabled = !busy;
            pointPanel.Visible = restorePoint.Items.Count > 1;
            listPanel.Visible = snapshot != null && snapshot.Lists.Any();
            bool protectedSource = source != null && source.Protected;
            rawCopy.Visible = protectedSource;
            rawCopy.Text = source != null && source.IsFolder ? "Geschützten Datenordner kopieren" : "Geschützte Sicherung kopieren";
            rawCopy.Enabled = !busy;
            saveAll.Visible = snapshot != null;
            saveAll.Enabled = !busy;
            saveAll.Text = protectedSource ? "Entschlüsselte Datenkopie erstellen" : "Datenkopie erstellen";
            saveList.Visible = listPanel.Visible;
            saveList.Enabled = !busy;
            lockAccess.Visible = protectedSource && !NeedsCredential;
            lockAccess.Enabled = !busy;
        }

        private void SetStatus(string value, bool error = false) {
            status.Text = value;
            status.ForeColor = SystemColors.ControlText;
            status.Font = error ? errorFont : Font;
            status.AccessibleName = error ? "Fehler. " + value : value;
            status.Announce();
        }

        private void ClearSnapshot() {
            preview.Clear();
            var current = snapshot;
            snapshot = null;
            current?.Dispose();
            filling = true;
            try { year.Items.Clear(); schoolClass.Items.Clear(); course.Items.Clear(); list.Items.Clear(); }
            finally { filling = false; }
        }

        private async Task SelectSource(string path, Control opener) {
            if (busy) return;
            ClearSnapshot();
            restorePoint.Items.Clear();
            ResetCredential();
            source?.Dispose();
            source = null;
            location.Text = "";
            try {
                source = new RescueSource(path);
                location.Text = source.IsFolder ? "Quelle: " + Path.GetFileName(source.SelectedPath) : "Sicherung: " + Path.GetFileName(source.SelectedPath);
                ConfigureCredential();
                RefreshActions();
                if (NeedsCredential) { SetStatus("Gib dein Passwort ein oder verwende den Notfallschlüssel."); secret.Focus(); }
                else await OpenSelected(true);
            } catch (Exception error) {
                SetStatus(Message(error, "Der gewählte Datenordner oder die Sicherung konnte nicht geöffnet werden."), true);
                source?.Dispose();
                source = null;
                location.Text = "";
                RefreshActions();
                opener.Focus();
            }
        }

        private void ResetCredential() {
            recoveryMode = false;
            secret.Clear();
            showSecret.Checked = false;
        }

        private void SessionSwitch(object sender, SessionSwitchEventArgs e) {
            if (e.Reason != SessionSwitchReason.SessionLock || IsDisposed || !IsHandleCreated) return;
            try { BeginInvoke((Action)(() => { if (source != null) Lock(); })); } catch (InvalidOperationException) {}
        }

        private void Lock() {
            preview.Clear();
            restorePoint.Items.Clear();
            ResetCredential();
            if (busy) { lockRequested = true; listPanel.Visible = false; return; }
            ClearSnapshot();
            ConfigureCredential();
            string path = source?.SelectedPath;
            source?.Dispose();
            source = null;
            try { if (path != null) source = new RescueSource(path); } catch (IOException) { location.Text = ""; }
            RefreshActions();
            SetStatus("Der Zugriff ist gesperrt.");
            if (NeedsCredential) secret.Focus(); else chooseDirectory.Focus();
        }

        private async Task OpenSelected(bool changeFocus) {
            if (source == null || busy) return;
            string selection = Value(restorePoint);
            bool needs = NeedsCredential;
            string credential = needs ? secret.Text : null;
            if (needs && String.IsNullOrEmpty(credential)) { SetStatus(recoveryMode ? "Bitte gib den Notfallschlüssel ein." : "Bitte gib dein Passwort ein.", true); secret.Focus(); return; }
            bool recovery = recoveryMode;
            if (needs && (recovery ? credential.Length > 256 : System.Text.Encoding.UTF8.GetByteCount(credential) > 4096)) {
                SetStatus(recovery ? "Der Notfallschlüssel ist zu lang. Füge nur den Schlüssel ein oder öffne die Schlüsseldatei." : "Das Passwort ist zu lang. Prüfe deine Eingabe.", true);
                secret.Focus();
                return;
            }
            secret.Clear();
            ClearSnapshot();
            busy = true;
            SetStatus("Der Notenstand wird geöffnet …");
            RefreshActions();
            try {
                snapshot = await Task.Run(() => source.Open(selection, recovery ? null : credential, recovery ? credential : null));
                if (!lockRequested) {
                    await FillRestorePoints(selection);
                    FillLists(0);
                    string opened = "Stand vom " + snapshot.Updated.ToLocalTime().ToString("g", CultureInfo.CurrentCulture) + " geöffnet.";
                    if (snapshot.AdditionalDataUnavailable) SetStatus(opened + " Einige Zusatzdateien konnten nicht geprüft werden. Die lesbaren Daten kannst du kopieren.");
                    else if (snapshot.Lists.Any()) SetStatus(opened);
                    else SetStatus("Zu diesem Stand sind keine fertigen Notenlisten vorhanden. Du kannst eine Datenkopie erstellen.");
                }
            } catch (Exception error) {
                string message = NeedsCredential ? "Der Zugang konnte nicht geprüft werden. Prüfe das Passwort oder den Notfallschlüssel und versuche es erneut." : Message(error, "Dieser Notenstand konnte nicht gelesen werden.");
                if (!NeedsCredential) {
                    try { await FillRestorePoints(selection); } catch (IOException) {}
                    if (restorePoint.Items.Count > 1) message += " Wähle einen früheren Stand.";
                }
                SetStatus(message, true);
            } finally {
                credential = null;
                busy = false;
                if (lockRequested) { lockRequested = false; Lock(); changeFocus = false; }
                else RefreshActions();
            }
            if (!changeFocus) return;
            if (NeedsCredential) secret.Focus();
            else if (listPanel.Visible) list.Focus();
            else if (saveAll.Visible) saveAll.Focus();
            else if (pointPanel.Visible) restorePoint.Focus();
            else chooseFile.Focus();
        }

        private async Task FillRestorePoints(string current) {
            var options = await Task.Run(() => source.Earlier().Select(item => new Option(item.Value, item.Key)).ToArray());
            if (lockRequested) return;
            restorePoint.Items.Clear();
            if (options.Length == 0) return;
            restorePoint.Items.Add(new Option("Aktueller Stand", null));
            restorePoint.Items.AddRange(options);
            int index = Array.FindIndex(options, x => x.Value == current);
            restorePoint.SelectedIndex = index < 0 ? 0 : index + 1;
        }

        private void FillLists(int from) {
            if (snapshot == null) return;
            filling = true;
            try {
                var parts = snapshot.Lists.Select(p => new { File = p, Parts = p.Split('/') }).ToArray();
                if (from == 0) Options(year, FilterOptions(parts.Select(p => p.Parts[1])), true);
                var chosenYear = Value(year);
                var inYear = parts.Where(p => chosenYear == null || p.Parts[1] == chosenYear).ToArray();
                if (from < 2) Options(schoolClass, FilterOptions(inYear.Select(p => p.Parts[2])), true);
                var chosenClass = Value(schoolClass);
                var inClass = inYear.Where(p => chosenClass == null || p.Parts[2] == chosenClass).ToArray();
                if (from < 3) Options(course, FilterOptions(inClass.Where(p => p.Parts.Length > 4).Select(p => p.Parts[3])), true);
                var chosenCourse = Value(course);
                var inCourse = inClass.Where(p => chosenCourse == null || (p.Parts.Length > 4 && p.Parts[3] == chosenCourse)).OrderBy(p => Path.GetFileName(p.File) == "Notenübersicht.txt" ? 0 : 1);
                var choices = inCourse.Select(p => new Option(String.Join(" · ", p.Parts.Skip(1)).Replace(".txt", ""), p.File)).ToArray();
                Options(list, choices, false);
            } finally { filling = false; }
            ShowList();
        }

        private static Option[] FilterOptions(System.Collections.Generic.IEnumerable<string> names) {
            return names.Distinct(StringComparer.Ordinal).OrderBy(x => x, StringComparer.CurrentCultureIgnoreCase).Select(x => new Option(x, x)).ToArray();
        }

        private void ShowList() {
            string path = Value(list);
            try { preview.Text = snapshot == null || path == null ? "" : RescueSource.Text(snapshot.Files[path]); }
            catch (System.Text.DecoderFallbackException) { preview.Text = "Diese Notenliste ist nicht als Text lesbar."; }
            preview.Select(0, 0);
        }

        private async Task Export(bool protectedCopy, bool textOnly) {
            if (source == null || busy || (!protectedCopy && snapshot == null)) return;
            string[] selected = null;
            if (textOnly) {
                if (list.Items.Count == 0) return;
                var all = MessageBox.Show(this, "Möchtest du alle Notenlisten dieses Stands speichern?\n\nJa: alle Notenlisten\nNein: nur die ausgewählte Notenliste", Text, MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question);
                if (all == DialogResult.Cancel) return;
                if (all == DialogResult.Yes) selected = snapshot.Lists.ToArray();
                else if (Value(list) != null) selected = new[] { Value(list) };
                else { SetStatus("Wähle zuerst eine Notenliste.", true); list.Focus(); return; }
            }
            if (!protectedCopy && source.Protected && MessageBox.Show(this, "Diese Kopie enthält unverschlüsselte Schülerdaten. Wähle einen sicheren Speicherort.", Text, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) return;
            string target;
            using (var dialog = new FolderBrowserDialog { Description = "Wähle, wo der neue Ordner für die Kopie angelegt werden soll.", ShowNewFolderButton = false }) {
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                string name = protectedCopy ? "Notenblick – geschützte Kopie" : textOnly ? "Notenblick – Notenlisten" : "Notenblick – Datenkopie";
                target = Path.Combine(dialog.SelectedPath, name + " " + DateTime.Now.ToString("yyyy-MM-dd HH-mm-ss", CultureInfo.InvariantCulture));
            }
            busy = true;
            SetStatus("Die Kopie wird erstellt …");
            RefreshActions();
            try {
                await Task.Run(() => { if (protectedCopy) source.SaveProtected(target); else source.SaveSnapshot(snapshot, target, selected); });
                SetStatus("Kopie erstellt. Neuer Ordner: " + target);
            } catch (Exception error) { SetStatus(Message(error, "Die Kopie konnte nicht fertiggestellt werden. Wähle einen anderen Zielordner."), true); }
            finally {
                busy = false;
                if (lockRequested) { lockRequested = false; Lock(); }
                else { RefreshActions(); (protectedCopy ? rawCopy : textOnly ? saveList : saveAll).Focus(); }
            }
        }

        private static string Message(Exception error, string fallback) {
            if (error is UnauthorizedAccessException) return "Auf den Ordner kann nicht zugegriffen werden. Prüfe den Speicherort oder wähle einen anderen Ordner.";
            if (error is FileNotFoundException || error is DirectoryNotFoundException) return "Dieser Stand fehlt. Wähle einen früheren Stand oder eine andere Sicherung.";
            string text = error.Message;
            string[] safe = { "Der Datenordner ist gerade", "Wähle ", "Dieser Name ist", "Diese Daten sind", "Diese Sicherung wird", "Die Daten wurden", "Die Notenlisten wurden", "Verknüpfte Dateien", "Dieser Notenstand ist" };
            return safe.Any(prefix => text.StartsWith(prefix, StringComparison.Ordinal)) ? text : fallback;
        }

    }
}
