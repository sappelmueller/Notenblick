/* Notenblick – domain/records.js. Shared application API: NR. */
(function (NR) {
  'use strict';

  NR.id = () => globalThis.crypto?.randomUUID?.() || 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  NR.clone = v => JSON.parse(JSON.stringify(v));
  NR.blank = function blank() {
    return {
      format: 'notenraum',
      version: 1,
      id: NR.id(),
      revision: 0,
      commitId: NR.id(),
      updatedAt: new Date().toISOString(),
      years: [],
      classes: [],
      students: [],
      courses: [],
      assessments: [],
      finals: []
    };
  };
  NR.defaultWeights = () => ({
    overall: {
      written: '50',
      oral: '50',
      homework: '0',
      notebook: '0'
    },
    written: {
      exam: '80',
      test: '20'
    }
  });
  NR.validate = function validate(d) {
    const fail = msg => {
      throw Error('Ungültige Datendatei: ' + msg);
    };
    if (!d || d.format !== 'notenraum' || d.version !== 1) fail('Format oder Version wird nicht unterstützt.');
    if(d.appVersion&&/^\d+\.\d+\.\d+$/.test(d.appVersion)&&d.appVersion.split('.').map(Number).some((v,i,parts)=>{const current=[1,26,0];return parts.slice(0,i).every((n,j)=>n===current[j])&&v>current[i];}))fail('Diese Datei stammt aus einer neueren Notenblick-Version. Bitte aktualisiere das Programm.');
    const safeId = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
    if (!safeId(d.id) || !safeId(d.commitId) || !Number.isSafeInteger(d.revision) || d.revision < 0 || typeof d.updatedAt !== 'string' || !Number.isFinite(Date.parse(d.updatedAt))) fail('Speicherstand ist beschädigt.');
    const sets = {};
    for (const key of ['years', 'classes', 'students', 'courses', 'assessments', 'finals']) {
      if (!Array.isArray(d[key]) || d[key].length > (key==='assessments'?500000:1000000)) fail(key + ' fehlt oder ist zu groß.');
      sets[key] = new Set();
      for (const x of d[key]) {
        if (!x || !safeId(x.id) || sets[key].has(x.id)) fail('Kennungen in ' + key + ' sind nicht eindeutig.');
        sets[key].add(x.id);
      }
    }
    const maps=Object.fromEntries(['years','classes','students','courses'].map(k=>[k,new Map(d[k].map(x=>[x.id,x]))]));
    const legacy=!NR.isCurrentData(d);
    const txt = (v, label, max = 500) => {
      if (typeof v !== 'string' || v.length > max || !v.trim()) fail(label + ' fehlt oder ist zu lang.');
    };
    for (const y of d.years) {txt(y.label, 'Schuljahr', 80);if(y.startYear!==undefined&&(!Number.isInteger(y.startYear)||y.startYear<1900||y.startYear>9998))fail('Ungültiger Beginn des Schuljahres.');}
    for (const c of d.classes) {
      txt(c.name, 'Klasse', 80);
      if(c.halfYearReport!==undefined&&!['information','certificate'].includes(c.halfYearReport))fail('Ungültige Ausgabe zum Halbjahr.');
      if (!sets.years.has(c.yearId)) fail('Klasse ohne Schuljahr.');
    }
    for (const s of d.students) {
      if (s.alias !== undefined && (typeof s.alias !== 'string' || s.alias.length > 80)) fail('Namenszusatz ist zu lang.');
      txt(s.first, 'Vorname', 100);
      txt(s.last, 'Nachname', 100);
      if (!sets.classes.has(s.classId)) fail('Schüler ohne Klasse.');
    }
    for(const s of d.students){if(s.originStudentId!==undefined){const seen=new Set([s.id]);let x=s;while(x.originStudentId!==undefined){if(!safeId(x.originStudentId)||!sets.students.has(x.originStudentId)||seen.has(x.originStudentId))fail('Ungültige Herkunft beim Klassenwechsel.');seen.add(x.originStudentId);x=maps.students.get(x.originStudentId);}}}
    for (const c of d.courses) {
      txt(c.name, 'Fach', 80);
      if (!sets.classes.has(c.classId) || !Array.isArray(c.studentIds) || new Set(c.studentIds).size !== c.studentIds.length) fail('Ungültige Fachzuordnung.');
      for (const sid of c.studentIds) if (!sets.students.has(sid) || maps.students.get(sid).classId !== c.classId) fail('Schüler gehört nicht zur Klasse.');
      if (c.inactiveStudentIds && (!Array.isArray(c.inactiveStudentIds) || c.inactiveStudentIds.some(id => !c.studentIds.includes(id)) || new Set(c.inactiveStudentIds).size !== c.inactiveStudentIds.length)) fail('Ungültige Fachteilnahme.');
      if(c.calculationMode!==undefined&&!['grouped','direct'].includes(c.calculationMode))fail('Ungültige Berechnungsart.');
      if(c.areas)NR.validateAreas(c);
      NR.weightsValid(c.weights,{course:c,mode:c.calculationMode||'grouped',legacy:legacy&&c.weights.overall.other!==undefined,incomplete:!legacy&&!!d.legacyOther?.courses?.some(x=>x.courseId===c.id&&x.status==='pending')});
      if(!legacy&&Object.hasOwn(c.weights.overall,'other'))fail('Veraltete aktive Gewichtung.');
      if (![0, 1, 2].includes(c.precision) || !['round', 'truncate'].includes(c.rounding) || !Array.isArray(c.lockedPeriods) || c.lockedPeriods.some(p => !['1', '2'].includes(p))) fail('Ungültige Facheinstellungen.');
    }
    const memberships=new Map(d.courses.map(c=>[c.id,new Set(c.studentIds)]));
    for (const a of d.assessments) {
      txt(a.title, 'Leistungsbezeichnung', 150);
      if (!sets.courses.has(a.courseId) || !['1', '2'].includes(a.period) || !(NR.areaIds(maps.courses.get(a.courseId)).includes(a.kind)||legacy&&a.kind==='other')) fail('Ungültige Leistung.');
      if (typeof a.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !Number.isFinite(Date.parse(a.date)) || new Date(a.date).toISOString().slice(0, 10) !== a.date) fail('Ungültiges Datum.');
      const w = NR.Q.from(a.weight);
      if (w.cmp(0) <= 0n || w.cmp(100) > 0n) fail('Ungültige Gewichtung der Leistung.');
      if (!a.results || typeof a.results !== 'object' || Array.isArray(a.results)) fail('Leistungen fehlen.');
      const course = maps.courses.get(a.courseId);
      NR.validatePointRecord(a);
      if(a.oralEntry!==undefined&&(!['individual','class','unclassified'].includes(a.oralEntry)||a.oralEntry==='individual'&&(!Array.isArray(a.participantIds)||a.participantIds.length!==1)))fail('Ungültige mündliche Erfassungsart.');
      if(a.participantIds!==undefined&&(!Array.isArray(a.participantIds)||!a.participantIds.length||new Set(a.participantIds).size!==a.participantIds.length||a.participantIds.some(id=>!safeId(id)||!memberships.get(course.id).has(id))||Object.keys(a.results).some(id=>!a.participantIds.includes(id))))fail('Ungültige Teilnahme an der Leistung.');
      for (const [sid, r] of Object.entries(a.results)) {
        if (!safeId(sid) || !memberships.get(course.id).has(sid) || !r || !Object.hasOwn(NR.STATUS, r.status) || typeof r.note !== 'string' || r.note.length > 2000) fail('Ungültige Schülerleistung.');
        if (r.grade !== null) {
          if (typeof r.grade !== 'string') fail('Noten müssen als Dezimaltext gespeichert sein.');
          NR.grade(r.grade);
        }
        NR.validatePointRecord(a,r);
        if (r.status === 'graded' && r.grade === null) fail('Bewertete Leistung ohne Note.');
        if (r.status !== 'graded' && r.grade !== null) fail('Nicht gewertete Leistung mit aktiver Note.');
      }
    }
    const finalKeys = new Set();
    for (const f of d.finals) {
      const key = f.courseId + '|' + (NR.isHalfFinal?.(f)?'half':f.period) + '|' + f.studentId;
      if (finalKeys.has(key) || !sets.courses.has(f.courseId) || !['1', '2', 'all'].includes(f.period) || !memberships.get(f.courseId).has(f.studentId) || typeof f.note !== 'string' || f.note.length > 2000 || typeof f.grade !== 'string') fail('Ungültige Zeugnisnote.');
      NR.grade(f.grade);
      if(f.reportType!==undefined){
        if(!['information','certificate','annual'].includes(f.reportType)||f.period!==(f.reportType==='annual'?'all':'1'))fail('Ungültige Zeugnisart oder Bezugszeit.');
        NR.finalGrade(f.grade,f.reportType);const c=maps.courses.get(f.courseId),cl=maps.classes.get(c.classId);
        if(f.classId!==cl.id||f.yearId!==cl.yearId||typeof f.decidedAt!=='string'||!Number.isFinite(Date.parse(f.decidedAt)))fail('Ungültige Zuordnung oder Festlegungsdatum.');
        const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
        if(!date(f.referenceStart)||!date(f.referenceEnd)||f.referenceStart>f.referenceEnd)fail('Ungültiger Notenzeitraum.');
        const a=f.averageAtDecision;if(a!==null){if(!a||typeof a.n!=='string'||typeof a.d!=='string'||!/^\d{1,300}$/.test(a.n)||!/^\d{1,300}$/.test(a.d)||BigInt(a.d)===0n)fail('Ungültiger gespeicherter Durchschnitt.');const q=new NR.Q(BigInt(a.n),BigInt(a.d));if(q.cmp(1)<0n||q.cmp(6)>0n)fail('Ungültiger gespeicherter Durchschnitt.');}
      }
      finalKeys.add(key);
    }
    if (d.previousFinals !== undefined) {
      if (!Array.isArray(d.previousFinals) || d.previousFinals.length > 100000) fail('Bisherige Zeugnisnoten sind beschädigt.');
      for (const f of d.previousFinals) {
        if (!f || !sets.courses.has(f.courseId) || !memberships.get(f.courseId).has(f.studentId) || !['1', '2'].includes(f.period) || typeof f.grade !== 'string' || typeof f.note !== 'string' || f.note.length > 2000) fail('Bisherige Zeugnisnote ist beschädigt.');
        NR.grade(f.grade);
      }
    }
    if (d.preferences) {
      if (!['first', 'last'].includes(d.preferences.sortBy) || !['asc', 'desc'].includes(d.preferences.sortDir) || !Array.isArray(d.preferences.columns) || d.preferences.columns.some(k => !['written', ...Object.keys(NR.KINDS),...(legacy?['other']:[])].includes(k)) || new Set(d.preferences.columns).size !== d.preferences.columns.length) fail('Ungültige Ansichtseinstellungen.');
    }
    if(d.legacyOther!==undefined){
      const a=d.legacyOther;if(!a||a.version!==1||!Array.isArray(a.assessments)||!Array.isArray(a.courses))fail('Altbestand ist beschädigt.');
      const keys=new Set();for(const x of a.courses){if(!x||!sets.courses.has(x.courseId)||keys.has(x.courseId)||!['pending','resolved'].includes(x.status))fail('Ungültige Zuordnung des Altbestands.');keys.add(x.courseId);NR.weightsValid({overall:x.overall,written:x.written||maps.courses.get(x.courseId).weights.written},{legacy:true});}
      const ids=new Set();for(const x of a.assessments){if(!x||x.kind!=='other'||!keys.has(x.courseId)||ids.has(x.id))fail('Ungültige Leistung im Altbestand.');ids.add(x.id);}
      if(a.assessments.length){const projection={...d,appVersion:'1.2.0',legacyOther:undefined,assessments:a.assessments,finals:[],previousFinals:[]};projection.courses=d.courses.map(c=>({...c,calculationMode:'grouped',weights:{overall:a.courses.find(x=>x.courseId===c.id)?.overall||{...NR.defaultWeights().overall,...(c.calculationMode==='direct'?{}:c.weights.overall),other:'0'},written:a.courses.find(x=>x.courseId===c.id)?.written||c.weights.written},areas:undefined,writtenIds:undefined,writtenName:undefined}));NR.validate(projection);}
    }
    return d;
  };
  NR.upgrade = function(input){
    const d=NR.clone(NR.validate(input));
    if(!['1.1','1.2.0',...NR.ACTIVE_VERSIONS].includes(d.appVersion)){
      d.previousFinals=(d.previousFinals||[]).concat(d.finals.filter(f=>f.period!=='all'));
      d.finals=d.finals.filter(f=>f.period==='all');
      for(const c of d.courses)c.lockedPeriods=[];
    }
    return NR.isCurrentData(d)?d:NR.migrate130(d);
  };
  NR.copyClass = function copyClass(d, sourceId, yearId, className) {
    const source = d.classes.find(c => c.id === sourceId);
    if (!source || !d.years.some(y => y.id === yearId)) throw Error('Die Klasse kann nicht übernommen werden.');
    if(d.courses.some(c=>c.classId===sourceId&&NR.legacyPending?.(d,c.id)))throw Error('Bitte prüfe zuerst den Altbestand der bisherigen Klasse.');
    const target = {
      id: NR.id(),
      yearId,
      name: className || source.name,
      archived: false
    };
    if (d.classes.some(c => c.yearId === yearId && c.name.toLocaleLowerCase('de') === target.name.toLocaleLowerCase('de'))) throw Error('Diese Klasse gibt es im Schuljahr bereits.');
    d.classes.push(target);
    const ids = new Map();
    for (const s of d.students.filter(s => s.classId === source.id && !s.archived)) {
      const next = {
        ...NR.clone(s),
        id: NR.id(),
        classId: target.id,
        archived: false
      };
      d.students.push(next);
      ids.set(s.id, next.id);
    }
    for (const c of d.courses.filter(c => c.classId === source.id && !c.archived)) {
      d.courses.push({
        ...NR.clone(c),
        id: NR.id(),
        classId: target.id,
        studentIds: c.studentIds.filter(s => ids.has(s)).map(s => ids.get(s)),
        inactiveStudentIds: (c.inactiveStudentIds || []).filter(s => ids.has(s)).map(s => ids.get(s)),
        lockedPeriods: [],
        archived: false
      });
    }
    return target;
  };
})(globalThis.NR = globalThis.NR || {});
