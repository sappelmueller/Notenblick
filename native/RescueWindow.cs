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
        private readonly Font emphasisFont, headingFont;
        private readonly Panel surface = new Panel { Dock = DockStyle.Fill, AutoScroll = true, BackColor = SystemColors.Control };
        private readonly TableLayoutPanel shell = Column();
        private readonly TableLayoutPanel sourcePanel = Column();
        private readonly TableLayoutPanel readingPanel = Column();
        private readonly TableLayoutPanel locationPanel = Column();
        private readonly Label locationLabel = NewLabel();
        private readonly TextBox location = new TextBox {
            Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical,
            Dock = DockStyle.Top, Height = 44, BackColor = SystemColors.Window
        };
        private readonly ComboBox restorePoint = Choice("Gespeicherter Stand");
        private readonly ComboBox year = Choice("Schuljahr");
        private readonly ComboBox schoolClass = Choice("Klasse");
        private readonly ComboBox course = Choice("Fach");
        private readonly ComboBox list = Choice("Notenliste");
        private readonly TextBox secret = new TextBox { UseSystemPasswordChar = true, Dock = DockStyle.Fill, MaxLength = 0 };
        private readonly CheckBox showSecret = new CheckBox { Text = "Passwort an&zeigen", AutoSize = true };
        private readonly TextBox preview = new TextBox {
            AccessibleName = "Inhalt der Notenliste", Multiline = true, ReadOnly = true,
            ScrollBars = ScrollBars.Both, WordWrap = false, Dock = DockStyle.Top, Height = 185,
            BackColor = SystemColors.Window
        };
        private readonly Button open = NewButton("Ö&ffnen");
        private readonly Button changeCredential = NewButton("Mit Notfallschlüssel öffnen");
        private readonly Button pickKey = NewButton("Schlüsseldatei auswählen");
        private readonly Button rawCopy = NewButton("Geschützte Kopie erstellen");
        private readonly Button saveList = NewButton("Diese Notenliste speichern");
        private readonly Button saveLists = NewButton("Alle Notenlisten speichern");
        private readonly Button saveData = NewButton("Datenkopie erstellen");
        private readonly Button chooseDirectory = NewButton("&Datenordner auswählen");
        private readonly Button chooseFile = NewButton("&Sicherung auswählen");
        private readonly Button lockAccess = NewButton("Zugriff sperren");
        private readonly TableLayoutPanel credentialPanel = Column();
        private readonly TableLayoutPanel listPanel = Column();
        private readonly TableLayoutPanel filters = Column();
        private readonly TableLayoutPanel pointPanel = Column();
        private readonly TableLayoutPanel copyPanel = Column();
        private readonly CheckBox moreCopies = new CheckBox { Text = "Weitere Kopien", Appearance = Appearance.Button, AutoSize = true };
        private readonly FlowLayoutPanel extraCopies;
        private readonly Label secretLabel = NewLabel();
        private readonly Control[] filterFields;
        private RescueSource source;
        private RescueSnapshot snapshot;
        private string pendingBackup;
        private int contentWidth;
        private bool recoveryMode, busy, filling, lockRequested, snapshotWasProtected;

        private enum CopyKind { Protected, List, Lists, Data }

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
            emphasisFont = new Font(Font, FontStyle.Bold);
            headingFont = new Font(Font.FontFamily, Font.Size + 6, FontStyle.Bold);
            AutoScaleDimensions = new SizeF(96, 96);
            AutoScaleMode = AutoScaleMode.Dpi;
            KeyPreview = true;
            KeyDown += (s, e) => {
                if (e.KeyCode != Keys.F1) return;
                e.Handled = e.SuppressKeyPress = true;
                MessageBox.Show(this, HelpText(), "Hilfe zum Notfallzugriff", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(800, 690);
            MinimumSize = new Size(390, 390);
            try { using (var identified = Icon.ExtractAssociatedIcon(Application.ExecutablePath)) if (identified != null) Icon = (Icon)identified.Clone(); } catch (ArgumentException) {}

            shell.Padding = new Padding(18, 14, 18, 14);
            surface.Controls.Add(shell);
            Controls.Add(surface);
            var heading = NewLabel("Notfallzugriff für Notenblick");
            heading.Font = headingFont;
            shell.Controls.Add(heading);
            sourcePanel.Controls.Add(NewLabel("Öffne deinen Datenordner oder eine Sicherung, um deine Noten zu lesen."));
            sourcePanel.Controls.Add(Buttons(chooseDirectory, chooseFile));
            locationPanel.Controls.Add(locationLabel);
            locationPanel.Controls.Add(location);
            sourcePanel.Controls.Add(locationPanel);
            sourcePanel.Controls.Add(status);
            var secretRow = Column();
            secretRow.Controls.Add(secretLabel);
            secretRow.Controls.Add(secret);
            credentialPanel.Controls.Add(secretRow);
            credentialPanel.Controls.Add(showSecret);
            credentialPanel.Controls.Add(Buttons(open, changeCredential, pickKey));
            sourcePanel.Controls.Add(credentialPanel);
            shell.Controls.Add(Area("Daten öffnen", sourcePanel));
            pointPanel.Controls.Add(WithLabel("Gespeicherter S&tand", restorePoint));
            readingPanel.Controls.Add(pointPanel);
            readingPanel.Controls.Add(listPanel);
            shell.Controls.Add(Area("Noten lesen", readingPanel));
            filterFields = new[] { WithLabel("Schul&jahr", year), WithLabel("&Klasse", schoolClass), WithLabel("&Fach", course) };
            foreach (var field in filterFields) filters.Controls.Add(field);
            listPanel.Controls.Add(filters);
            listPanel.Controls.Add(WithLabel("&Notenliste", list));
            listPanel.Controls.Add(preview);
            copyPanel.Controls.Add(Buttons(saveList, moreCopies));
            extraCopies = (FlowLayoutPanel)Buttons(saveLists, saveData, rawCopy);
            copyPanel.Controls.Add(extraCopies);
            shell.Controls.Add(Area("Kopie speichern", copyPanel));
            moreCopies.CheckedChanged += (s, e) => RefreshActions();
            shell.Controls.Add(Buttons(lockAccess, NewButton("S&chließen", (s, e) => Close())));
            ClientSizeChanged += (s, e) => FitContent();

            chooseDirectory.Click += async (s, e) => {
                using (var dialog = new FolderBrowserDialog { Description = "Notenblick-Datenordner auswählen", ShowNewFolderButton = false }) {
                    if (dialog.ShowDialog(this) == DialogResult.OK) await SelectSource(dialog.SelectedPath, chooseDirectory);
                    else chooseDirectory.Focus();
                }
            };
            chooseFile.Click += async (s, e) => {
                using (var dialog = new OpenFileDialog { Title = "Notenblick-Sicherung auswählen", Filter = "Notenblick-Sicherungen|*.nbx;*.nbk;*.json;*.zip|Alle Dateien|*.*", CheckFileExists = true, Multiselect = false }) {
                    if (dialog.ShowDialog(this) == DialogResult.OK) await SelectSource(dialog.FileName, chooseFile);
                    else chooseFile.Focus();
                }
            };
            open.Click += async (s, e) => await OpenSelected();
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
                        await OpenSelected();
                    } catch { SetStatus("Die Schlüsseldatei konnte nicht gelesen werden. Wähle die gesicherte Textdatei oder füge den Schlüssel ein.", true); secret.Focus(); }
                }
            };
            showSecret.CheckedChanged += (s, e) => secret.UseSystemPasswordChar = !showSecret.Checked;
            secret.Enter += (s, e) => AcceptButton = open;
            secret.Leave += (s, e) => AcceptButton = null;
            restorePoint.SelectionChangeCommitted += async (s, e) => await OpenSelected(changingStand: true);
            year.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(1); };
            schoolClass.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(2); };
            course.SelectedIndexChanged += (s, e) => { if (!filling) FillLists(3); };
            list.SelectedIndexChanged += (s, e) => { if (!filling) ShowList(); };
            rawCopy.Click += async (s, e) => await Export(CopyKind.Protected, rawCopy);
            saveList.Click += async (s, e) => await Export(CopyKind.List, saveList);
            saveLists.Click += async (s, e) => await Export(CopyKind.Lists, saveLists);
            saveData.Click += async (s, e) => await Export(CopyKind.Data, saveData);
            lockAccess.Click += (s, e) => Lock();
            FormClosing += (s, e) => { if (busy) { e.Cancel = true; SetStatus("Warte, bis der laufende Vorgang abgeschlossen ist."); } };
            FormClosed += (s, e) => { SystemEvents.SessionSwitch -= SessionSwitch; ClearSnapshot(); source?.Dispose(); emphasisFont.Dispose(); headingFont.Dispose(); };
            SystemEvents.SessionSwitch += SessionSwitch;
            Shown += async (s, e) => {
                var root = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Daten");
                if (Directory.Exists(root)) await SelectSource(root, chooseDirectory);
                else { SetStatus("Wähle den Notenblick-Datenordner oder eine Sicherung."); chooseDirectory.Focus(); }
            };
            ConfigureCredential();
            RefreshActions();
        }

        private void FitContent() {
            int usable = Math.Max(1, surface.ClientSize.Width - shell.Padding.Horizontal - SystemInformation.VerticalScrollBarWidth);
            if (usable != contentWidth) {
                contentWidth = usable;
                int groupWidth = Math.Max(1, usable - LogicalToDeviceUnits(18));
                foreach (var row in shell.Controls.OfType<FlowLayoutPanel>().Concat(sourcePanel.Controls.OfType<FlowLayoutPanel>()).Concat(credentialPanel.Controls.OfType<FlowLayoutPanel>()).Concat(copyPanel.Controls.OfType<FlowLayoutPanel>()))
                    row.MaximumSize = new Size(groupWidth, 0);
                foreach (var label in shell.Controls.OfType<Label>().Concat(sourcePanel.Controls.OfType<Label>()).Concat(locationPanel.Controls.OfType<Label>()))
                    label.MaximumSize = new Size(groupWidth, 0);

                int columns = usable >= LogicalToDeviceUnits(550) ? filterFields.Length : 1;
                filters.SuspendLayout();
                if (columns > filters.ColumnCount) filters.ColumnCount = columns;
                for (int i = 0; i < filterFields.Length; i++)
                    filters.SetCellPosition(filterFields[i], new TableLayoutPanelCellPosition(i % columns, i / columns));
                filters.ColumnCount = columns;
                filters.ColumnStyles.Clear();
                for (int i = 0; i < columns; i++) filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100f / columns));
                filters.ResumeLayout();
            }
            if (listPanel.Visible) {
                shell.PerformLayout();
                int available = surface.ClientSize.Height - (shell.Height - preview.Height) - 2;
                preview.Height = Math.Max(LogicalToDeviceUnits(150), available);
            }
        }

        private static GroupBox Area(string label, TableLayoutPanel content) {
            var group = new GroupBox { Text = label, Dock = DockStyle.Top, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink,
                Margin = new Padding(0, 4, 0, 6), Padding = new Padding(8, 4, 8, 6), TabStop = false };
            group.Controls.Add(content);
            return group;
        }

        private string HelpText() {
            if (busy) return "Warte, bis der laufende Vorgang abgeschlossen ist.";
            if (source == null) return "Wähle den Notenblick-Datenordner oder eine gespeicherte Sicherung.";
            if (NeedsCredential) return recoveryMode
                ? "Gib den Notfallschlüssel ein oder wähle die gespeicherte Schlüsseldatei. Eine geschützte Kopie kannst du auch vor dem Öffnen erstellen."
                : "Gib dein Passwort ein oder wähle „Mit Notfallschlüssel öffnen“. Eine geschützte Kopie kannst du auch vor dem Öffnen erstellen.";
            if (snapshot == null) return pointPanel.Visible ? "Wähle einen früheren Stand oder öffne eine andere Sicherung." : "Wähle einen anderen Datenordner oder eine Sicherung.";
            if (!listPanel.Visible) return "Zu diesem Stand gibt es keine Notenlisten. Unter „Weitere Kopien“ kannst du eine Datenkopie erstellen.";
            if (copyPanel.ContainsFocus) return "Speichere die ausgewählte Notenliste, alle Listen dieses Stands oder eine Datenkopie in einem Ordner deiner Wahl. Deine Originale bleiben erhalten.";
            return "Wähle eine Notenliste. Mit Tab erreichst du den Inhalt der Liste und anschließend die Schaltflächen zum Speichern.";
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
        private static ComboBox Choice(string name) {
            var box = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Top, AccessibleName = name };
            box.DropDown += (s, e) => {
                int available = Screen.FromControl(box).WorkingArea.Width - 24;
                int widest = box.Items.Cast<Option>().Select(item => TextRenderer.MeasureText(item.Label, box.Font).Width).DefaultIfEmpty(0).Max();
                box.DropDownWidth = Math.Max(box.Width, Math.Min(available, widest + SystemInformation.VerticalScrollBarWidth));
            };
            return box;
        }
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
            secretLabel.Text = recoveryMode ? "Notfallschlüssel" : pendingBackup == null ? "Passwort" : "Passwort der Sicherung";
            secret.AccessibleName = secretLabel.Text;
            changeCredential.Text = recoveryMode ? "Mit Passwort öffnen" : "Mit Notfallschlüssel öffnen";
            pickKey.Visible = recoveryMode;
            showSecret.Text = recoveryMode ? "Notfallschlüssel an&zeigen" : "Passwort an&zeigen";
        }

        private bool NeedsCredential => pendingBackup != null || (source != null && source.Protected && !source.IsUnlocked);

        private void RefreshActions() {
            chooseDirectory.Enabled = chooseFile.Enabled = !busy;
            locationPanel.Visible = source != null;
            open.Enabled = !busy;
            secret.Enabled = showSecret.Enabled = changeCredential.Enabled = pickKey.Enabled = !busy;
            credentialPanel.Visible = NeedsCredential;
            restorePoint.Enabled = !busy;
            pointPanel.Visible = restorePoint.Items.Count > 1;
            bool hasLists = snapshot != null && snapshot.Lists.Any();
            listPanel.Visible = hasLists;
            readingPanel.Parent.Visible = restorePoint.Items.Count > 1 || hasLists;
            bool protectedSource = source != null && source.Protected;
            rawCopy.Visible = protectedSource;
            rawCopy.Enabled = !busy;
            saveData.Visible = snapshot != null;
            saveData.Enabled = !busy;
            saveList.Visible = saveLists.Visible = hasLists;
            saveList.Enabled = !busy && Value(list) != null;
            saveLists.Enabled = !busy;
            bool hasCopies = protectedSource || snapshot != null;
            moreCopies.Visible = hasCopies;
            if (!hasCopies) moreCopies.Checked = false;
            extraCopies.Visible = moreCopies.Checked;
            copyPanel.Parent.Visible = hasCopies;
            lockAccess.Visible = protectedSource && source.IsUnlocked;
            lockAccess.Enabled = !busy;
            FitContent();
        }

        private void SetStatus(string value, bool error = false) {
            var accessible = error ? "Fehler. " + value : value;
            if (status.Text == value && status.AccessibleName == accessible) return;
            status.Text = value;
            status.ForeColor = SystemColors.ControlText;
            status.Font = error ? emphasisFont : Font;
            status.AccessibleName = accessible;
            FitContent();
            status.Announce();
        }

        private void ClearSnapshot() {
            preview.Clear();
            var current = snapshot;
            snapshot = null;
            snapshotWasProtected = false;
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
                locationLabel.Text = source.IsFolder ? "Gewählter Datenordner" : "Gewählte Sicherung";
                location.AccessibleName = locationLabel.Text;
                location.Text = source.SelectedPath;
                location.Select(0, 0);
                ConfigureCredential();
                RefreshActions();
                if (NeedsCredential) { SetStatus("Gib dein Passwort ein oder verwende den Notfallschlüssel."); secret.Focus(); }
                else await OpenSelected();
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
            pendingBackup = null;
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
            try { if (path != null) source = new RescueSource(path); }
            catch (Exception error) when (ReadFailure(error)) { location.Text = ""; }
            RefreshActions();
            SetStatus(NeedsCredential ? "Der Zugriff ist gesperrt." : "Der Zugriff ist gesperrt. Wähle einen Datenordner oder eine Sicherung.");
            if (NeedsCredential) secret.Focus(); else chooseDirectory.Focus();
        }

        private async Task OpenSelected(bool changingStand = false) {
            if (source == null || busy) return;
            string selection = Value(restorePoint);
            if (changingStand) { ResetCredential(); ConfigureCredential(); }
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
            showSecret.Checked = false;
            ClearSnapshot();
            busy = true;
            SetStatus("Der Notenstand wird geöffnet …");
            RefreshActions();
            bool focusCredential = false;
            try {
                if (changingStand && selection != null && await Task.Run(() => source.EarlierNeedsCredential(selection))) {
                    pendingBackup = selection;
                    ConfigureCredential();
                    focusCredential = true;
                    if (!lockRequested) SetStatus("Gib das Passwort dieser Sicherung ein oder verwende ihren Notfallschlüssel.");
                } else {
                    snapshot = await Task.Run(() => source.Open(selection, recovery ? null : credential, recovery ? credential : null));
                    snapshotWasProtected = source.Protected || pendingBackup != null;
                    pendingBackup = null;
                    if (!lockRequested) {
                        bool earlierLoaded = await TryFillRestorePoints(selection);
                        if (!lockRequested) {
                            FillLists(0);
                            string opened = "Stand vom " + snapshot.Updated.ToLocalTime().ToString("g", CultureInfo.CurrentCulture) + " geöffnet.";
                            if (snapshot.AdditionalDataUnavailable) opened += " Einige zusätzliche Dateien sind nicht lesbar. Du kannst die lesbaren Daten kopieren.";
                            if (!snapshot.Lists.Any()) opened += " Es gibt keine fertigen Notenlisten. Du kannst eine Datenkopie erstellen.";
                            if (!earlierLoaded) opened += " Frühere Stände sind gerade nicht verfügbar.";
                            SetStatus(opened);
                        }
                    }
                }
            } catch (Exception error) when (ReadFailure(error)) {
                if (!lockRequested) {
                    focusCredential = error is VaultAccessException;
                    if (!focusCredential) {
                        pendingBackup = null;
                        if (!NeedsCredential && !(error is RescueSourceInUseException)) await TryFillRestorePoints(selection);
                    }
                    if (!lockRequested) SetStatus(Message(error, "Dieser Notenstand konnte nicht gelesen werden."), true);
                }
            } finally {
                credential = null;
                busy = false;
                if (lockRequested) { lockRequested = false; Lock(); }
                else {
                    RefreshActions();
                    if (focusCredential) secret.Focus();
                    else if (changingStand && pointPanel.Visible) restorePoint.Focus();
                    else if (listPanel.Visible) list.Focus();
                    else if (saveData.Visible) saveData.Focus();
                    else if (pointPanel.Visible) restorePoint.Focus();
                    else if (source.IsFolder) chooseDirectory.Focus();
                    else chooseFile.Focus();
                }
            }
        }

        private async Task<bool> TryFillRestorePoints(string current) {
            try { await FillRestorePoints(current); return true; }
            catch (Exception error) when (ReadFailure(error)) { return false; }
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
            saveList.Enabled = !busy && path != null;
        }

        private async Task Export(CopyKind kind, Control opener) {
            bool protectedCopy = kind == CopyKind.Protected;
            if (source == null || busy || (!protectedCopy && snapshot == null)) return;
            var original = source;
            var opened = snapshot;
            string selectedList = Value(list);
            if (kind == CopyKind.List && selectedList == null) {
                SetStatus("Wähle zuerst eine Notenliste.", true);
                list.Focus();
                return;
            }
            string[] selected = kind == CopyKind.List ? new[] { selectedList } : kind == CopyKind.Lists ? opened.Lists.ToArray() : null;
            if (!protectedCopy && snapshotWasProtected && MessageBox.Show(this, "Diese Kopie ist ohne Passwort lesbar. Wähle einen sicheren Speicherort.", Text, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.OK) {
                opener.Focus();
                return;
            }
            if (source != original || snapshot != opened) return;
            string target;
            using (var dialog = new FolderBrowserDialog { Description = "Wähle, wo der neue Ordner für die Kopie angelegt werden soll.", ShowNewFolderButton = false }) {
                if (dialog.ShowDialog(this) != DialogResult.OK) { opener.Focus(); return; }
                string name = protectedCopy ? "Notenblick – geschützte Kopie" : selected != null ? "Notenblick – Notenlisten" : "Notenblick – Datenkopie";
                target = Path.Combine(dialog.SelectedPath, name + " " + DateTime.Now.ToString("yyyy-MM-dd HH-mm-ss", CultureInfo.InvariantCulture));
            }
            if (source != original || snapshot != opened) return;
            busy = true;
            SetStatus("Die Kopie wird erstellt …");
            RefreshActions();
            try {
                await Task.Run(() => { if (protectedCopy) original.SaveProtected(target); else original.SaveSnapshot(opened, target, selected); });
                if (!lockRequested) SetStatus("Kopie erstellt. Neuer Ordner: " + target);
            } catch (Exception error) when (ReadFailure(error)) {
                if (!lockRequested) SetStatus(Message(error, "Die Kopie konnte nicht fertiggestellt werden. Wähle einen anderen Zielordner."), true);
            }
            finally {
                busy = false;
                if (lockRequested) { lockRequested = false; Lock(); }
                else { RefreshActions(); opener.Focus(); }
            }
        }

        private static bool ReadFailure(Exception error) => error is IOException || error is InvalidDataException ||
            error is UnauthorizedAccessException || error is Newtonsoft.Json.JsonException || error is System.Text.DecoderFallbackException;

        private static string Message(Exception error, string fallback) {
            if (error is RescueSourceInUseException || error is VaultAccessException) return error.Message;
            if (error is UnauthorizedAccessException) return "Auf den Ordner kann nicht zugegriffen werden. Prüfe den Speicherort oder wähle einen anderen Ordner.";
            if (error is FileNotFoundException || error is DirectoryNotFoundException) return "Dieser Stand fehlt. Wähle einen früheren Stand oder eine Sicherung.";
            string text = error.Message;
            string[] safe = { "Wähle ", "Dieser Name ist", "Diese Daten sind", "Diese Sicherung wird", "Die Daten wurden", "Die Notenlisten wurden", "Verknüpfte Dateien" };
            if (safe.Any(prefix => text.StartsWith(prefix, StringComparison.Ordinal))) return text;
            if (error is InvalidDataException || error is Newtonsoft.Json.JsonException || error is System.Text.DecoderFallbackException)
                return "Der Notenstand ist beschädigt, unvollständig oder wird nicht unterstützt. Wähle einen anderen Stand oder eine Sicherung.";
            return fallback;
        }

    }
}
