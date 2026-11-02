# Drittanbieter

Die GPLv3 gilt für die eigenen Notenblick-Quellen. Unverändert übernommene Bestandteile behalten ihre Lizenzen und Copyright-Vermerke. Vollständige Texte liegen an den genannten Stellen; die benötigten Laufzeithinweise werden mit der Windows-Ausgabe ausgeliefert.

| Bestandteil | Version | Lizenz und vollständiger Text |
| --- | --- | --- |
| Newtonsoft.Json | 13.0.3 | MIT, James Newton-King; `dev/newtonsoft.json/LICENSE.md` |
| WebView2 SDK und Loader | 1.0.2903.40 | BSD-3-Clause, Microsoft; `dev/webview2/LICENSE.txt` |
| PDFKit einschließlich eingebundener Module | 0.20.2 | MIT, BSD und Apache-2.0; `src/vendor/PDFKit-LICENSE.txt` und `src/vendor/THIRD-PARTY-NOTICES.txt` |
| DejaVu Sans, normal und fett | mitgelieferte Dateien | Bitstream-Vera-/DejaVu-Hinweise einschließlich ergänzender Schriftvermerke; `src/fonts/LICENSE.txt` |
| .NET Framework-Referenzassemblies | 4.8 / Paket 1.0.3 | MIT, Microsoft; `dev/microsoft.netframework.referenceassemblies.net48/LICENSE.txt`; nur zum Kompilieren |

PDFKit enthält unter anderem base64-js, brotli, clone, dfa, fast-deep-equal, fflate, fontkit, linebreak, pako, png-js, restructure, tiny-inflate, tslib, unicode-properties, unicode-trie und @swc/helpers. Maßgeblich sind die vollständigen mitgelieferten Vermerke; diese Dateien werden nicht pauschal umlizenziert.

## Nur für die Entwicklung

`package-lock.json` sperrt direkte und indirekte npm-Abhängigkeiten einschließlich ihrer Lizenzangaben. Direkte Werkzeuge: jsdom 26.1.0 (MIT), axe-core 4.14.0 (MPL-2.0) und Playwright 1.62.1 (Apache-2.0). Sie sind eigenständige Prüfwerkzeuge und werden nicht in die Anwendung eingebunden oder mit dem Windows-ZIP verteilt.

Das .NET SDK 8.0.426 und Open XML SDK 3.3.0 dienen Kompilierung und Prüfung. Python-Prüfpakete stehen in `dev/export-qa-requirements.txt`; Java, LibreOffice, veraPDF und Chromium sind externe Entwicklungswerkzeuge. Deren Installationen behalten ihre jeweiligen Lizenzen. Sie werden nicht mit Notenblick ausgeliefert. Versions- und Dateisperren unter `dev/` halten die verwendeten Pakete nachvollziehbar.

## Separat installierte Laufzeiten

Windows, .NET Framework und Microsoft Edge WebView2 Runtime sind Voraussetzungen auf dem Anwendergerät und kein Bestandteil des Downloads. Für sie gelten die Bedingungen von Microsoft. Die mitgelieferten WebView2-SDK-Dateien sind davon zu unterscheiden.

Quellen: Paketmetadaten in den jeweiligen `.nuspec`-Dateien, [Referenzassemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies.net48/1.0.3), deren [Lizenzverweis](https://github.com/microsoft/dotnet/blob/main/LICENSE), [WebView2 SDK](https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.2903.40) und die Sperrdateien im Repository.

Die permissiven Softwarelizenzen sind mit GPLv3 vereinbar. Die unveränderten Schriftdateien werden mit ihren gesonderten Bedingungen gebündelt. Fremde Urheber werden nicht als Urheber von Notenblick ausgegeben.

## Zusätzliche Erlaubnis

Die standardisierte [GPLv3-Bibliotheksausnahme](LICENSE-EXCEPTION) gemäß §7 erlaubt die Verknüpfung und Weitergabe mit den ausdrücklich genannten WebView2-, Newtonsoft.Json- und PDFKit-Komponenten. Das vermeidet unklare Pflichten bei vorgefertigten SDK-Dateien und dem unveränderten PDFKit-Bundle. Die eigenen Notenblick-Quellen samt Buildwerkzeugen werden vollständig mitgeliefert und bleiben unter GPLv3. Die Ausnahme ändert keine Drittanbieterlizenz. Grundlage: [GNU-FAQ](https://www.gnu.org/licenses/gpl-faq.html#GPLIncompatibleLibs) und [SPDX-Ausnahme](https://spdx.org/licenses/GPL-3.0-linking-exception.html).
