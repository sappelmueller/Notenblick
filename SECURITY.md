# Sicherheit

Sicherheitskorrekturen werden auf dem aktuellen Entwicklungsstand und für die neueste veröffentlichte Version vorbereitet. Ältere Versionen erhalten keine eigene Wartung.

## Eine Lücke melden

Bitte keine Sicherheitslücke mit Zugangsdaten, echten Schülerdaten oder einer unmittelbar ausnutzbaren Anleitung öffentlich als Issue melden. Verwende nach der öffentlichen Freischaltung unter **Security → Advisories → Report a vulnerability** die private Meldung. Solange diese Funktion nicht verfügbar ist, keine vertraulichen Angaben auf GitHub einstellen.

Nenne betroffene Version, Auswirkung und ein erfundenes Beispiel. Zugangsdaten niemals mitsenden. Bei versehentlich veröffentlichten Schlüsseln reicht das Löschen aus Git nicht: Der Schlüssel muss beim ausstellenden Dienst widerrufen werden.

## Daten schützen

Notenblick speichert lokal und bietet keine verschlüsselte Datenablage. Schutz des Windows-Kontos, Datenträgerverschlüsselung und sichere externe Sicherungen liegen bei der Lehrkraft. Fehlerberichte und Screenshots dürfen keine echten Schülerdaten enthalten.

Downloads nur aus offiziellen Releases beziehen und SHA-256-Prüfsummen vergleichen. Das Programm prüft seine vorgesehenen Dateien beim Start. Diese Integritätsprüfung ersetzt keine digitale Herausgebersignatur; eine Codesignierung ist bisher nicht vorhanden.

Ab 1.24.0 kontaktiert nur die freiwillige Aktualisierungsprüfung GitHub. Schülerdaten werden nicht übertragen. Die Startprüfung ist zunächst aus. Der Updater verlangt ein stabiles freigegebenes Release und dessen vollständigen Deskriptor; er ersetzt nur EXE und Programm, niemals Daten. Ein freigegebener Datensatz aus GitHub ist weiterhin eine Vertrauensentscheidung über die Veröffentlichungsrechte und keine digitale Herausgebersignatur. Details und Prüfgrenzen stehen im aktuellen Prüfbericht.
