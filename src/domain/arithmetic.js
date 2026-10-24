/* Notenblick – domain/arithmetic.js. Shared application API: NR. */
(function (NR) {
'use strict';
NR.gcd = (a, b) => {
  a = a < 0n ? -a : a;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1n;
};
NR.Q = class Q {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (!d) throw Error('Division durch null.');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = NR.gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  static from(v) {
    if (v instanceof NR.Q) return v;
    const s = String(v).trim().replace(',', '.');
    if (!/^-?\d+(\.\d{1,4})?$/.test(s)) throw Error('Bitte eine Zahl mit höchstens vier Nachkommastellen eingeben.');
    const [a, b = ''] = s.split('.');
    return new NR.Q(BigInt(a.replace('-', '') + b) * (s[0] === '-' ? -1n : 1n), 10n ** BigInt(b.length));
  }
  add(b) {
    b = NR.Q.from(b);
    return new NR.Q(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  mul(b) {
    b = NR.Q.from(b);
    return new NR.Q(this.n * b.n, this.d * b.d);
  }
  div(b) {
    b = NR.Q.from(b);
    return new NR.Q(this.n * b.d, this.d * b.n);
  }
  cmp(b) {
    b = NR.Q.from(b);
    return this.n * b.d - b.n * this.d;
  }
  fixed(p = 2, mode = 'round') {
    const scale = 10n ** BigInt(p),
      n = this.n * scale;
    let q = n / this.d;
    if (mode === 'round' && n % this.d * 2n >= this.d) q++;
    const s = q.toString().padStart(p + 1, '0');
    return p ? s.slice(0, -p) + ',' + s.slice(-p) : s;
  }
};
NR.grade = function grade(v) {
  const s = String(v).trim().replace(',', '.');
  if (!/^\d(\.\d{1,2})?$/.test(s)) throw Error('Note als Zahl von 1 bis 6 eingeben, zum Beispiel 2,5.');
  const q = NR.Q.from(s);
  if (q.cmp(1) < 0n || q.cmp(6) > 0n) throw Error('Die Note muss zwischen 1 und 6 liegen.');
  return String(Number(s));
};
NR.weightsValid = function weightsValid(w, {legacy = false, incomplete = false, mode = 'grouped'} = {}) {
  if (!['grouped','direct'].includes(mode)) throw Error('Unbekannte Berechnungsart.');
  if(mode==='direct' && Object.hasOwn(w?.overall||{},'written'))throw Error('Direkte Gewichtung darf keinen zusätzlichen schriftlichen Anteil enthalten.');
  for (const [group, keys] of [['overall', [...Object.keys(mode==='direct'?NR.KINDS:NR.OVERALL),...(legacy?['other']:[])]], ['written', ['exam', 'test']]]) {
    let sum = new NR.Q(0);
    for (const k of keys) {
      const v = NR.Q.from(w?.[group]?.[k]);
      if (v.cmp(0) < 0n || v.cmp(100) > 0n) throw Error('Gewichtungen müssen zwischen 0 und 100 Prozent liegen.');
      sum = sum.add(v);
    }
    if (!(incomplete && group === 'overall' && sum.cmp(100) <= 0n) && sum.cmp(100) !== 0n) throw Error((group === 'overall' ? 'Gesamtgewichtung' : 'Schriftliche Gewichtung') + ': Die Summe muss 100 Prozent betragen.');
  }
  return true;
};
NR.average = function average(items) {
  let sum = new NR.Q(0),
    weight = new NR.Q(0);
  for (const i of items) {
    if (i.value === null || i.value === undefined) continue;
    const w = NR.Q.from(i.weight ?? 1);
    if (w.cmp(0) <= 0n) continue;
    sum = sum.add(NR.Q.from(i.value).mul(w));
    weight = weight.add(w);
  }
  return weight.n ? sum.div(weight) : null;
};
NR.show = (v, c) => v === null ? 'Noch keine Note' : v.fixed(c?.precision ?? 2, c?.rounding ?? 'round');
})(globalThis.NR = globalThis.NR || {});
