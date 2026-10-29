/* Notenblick – domain/constants.js. Shared application API: NR. */
(function (NR) {
'use strict';
NR.ACTIVE_VERSIONS = ['1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0','1.9.0','1.10.0','1.11.0','1.12.0','1.13.0','1.14.0','1.15.0','1.16.0','1.17.0','1.18.0','1.19.0','1.20.0','1.20.1'];
NR.isCurrentData = d => !!d && NR.ACTIVE_VERSIONS.includes(d.appVersion);
NR.KINDS = {
  exam: 'Klassenarbeiten',
  test: 'Tests',
  oral: 'Mündlich',
  homework: 'Hausaufgaben',
  notebook: 'Heftführung'
};
NR.OVERALL = {
  written: 'Schriftlich',
  oral: 'Mündlich',
  homework: 'Hausaufgaben',
  notebook: 'Heftführung'
};
NR.STATUS = {
  open: 'Noch offen',
  graded: 'Bewertet',
  absent: 'Gefehlt',
  makeup: 'Nachschreibtermin',
  excluded: 'Nicht gewertet'
};
})(globalThis.NR = globalThis.NR || {});
