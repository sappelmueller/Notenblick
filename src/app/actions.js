/* Notenblick – app/actions.js. Shared application API: Notenblick. */
(function (Notenblick) {
  'use strict';

  Notenblick.action = async function action(el) {
    const a = el.dataset.action,
      id = el.dataset.id,
      kind = el.dataset.kind;
    if (!['close','help'].includes(a) && !Notenblick.canLeave()) return;
    if(a.startsWith('setup-')&&Notenblick.setupDraft)return Notenblick.setupAction(el);
    switch (a) {
      case 'weight-preview':Notenblick.previewWeights?.();break;
      case 'matrix-page':{const w=Notenblick.W();w.matrixPages[kind]=Math.max(0,(w.matrixPages[kind]||0)+Number(el.dataset.step));Notenblick.refreshTable('matrix');Notenblick.remember();const b=Notenblick.$('[data-action=matrix-page][data-step="'+el.dataset.step+'"]');(b&&!b.disabled?b:Notenblick.$('#matrixTitle'))?.focus();break;}
      case 'settings-course-weights':Notenblick.weightsDialog(Notenblick.data.courses.find(c=>c.id===Notenblick.ui.weightCourse));break;
      case 'oral-review':Notenblick.reviewOral(id||Notenblick.ui.course);break;
      case 'edit-oral':{const a=Notenblick.data.assessments.find(a=>a.id===id);Notenblick.W().oralFocusId=id;Notenblick.quickOral(a.participantIds[0],a);break;}
      case 'oral-student':Notenblick.openOralStudent(id,el.dataset.record);break;
      case 'return-oral':Notenblick.returnToOral();break;
      case 'oral-page':Notenblick.W().oralPage=Math.max(0,Notenblick.W().oralPage+Number(el.dataset.step));Notenblick.refreshOralTable();Notenblick.remember();Notenblick.$('#oralNotesTitle')?.focus();break;
      case 'choose-shortcuts':Notenblick.shortcutDialog();break;
      case 'quick-course':{if(Notenblick.chooseContext({courseId:id,historical:true,openNotes:true})){const link=Notenblick.$('#quick-'+id);if(link&&!link.closest('[hidden]'))link.focus();else Notenblick.$('#noteTabs [aria-selected=true]')?.focus();}break;}
      case 'home-all-courses':Notenblick.activateGroup('main','notes',false,true);Notenblick.$('#allSelection').open=true;(Notenblick.$('#class').options[0]?.value?Notenblick.$('#class'):Notenblick.$('#noteTabs [aria-selected=true]'))?.focus();break;
      case 'resume-assessment':{const record=Notenblick.data.assessments.find(a=>a.id===id);if(record){Notenblick.courseNotes(record.courseId);Notenblick.W().assessmentFilter=record.kind;Notenblick.W().view=Notenblick.assessmentView(record.kind);if(record.kind==='oral')Notenblick.W().oralView='classes';Notenblick.openAssessment(id,true,true);}break;}
      case 'dismiss-errors': Notenblick.errors.clear();Notenblick.error();break;
      case 'preview-names':Notenblick.previewNames(el.dataset.prefix);break;
      case 'oral-save-next':await Notenblick.submitModal(true);break;
      case 'legacy-archive':Notenblick.legacyArchive(id||Notenblick.ui.course,el.dataset.student);break;
      case 'legacy-review':Notenblick.legacyDialog(id||Notenblick.ui.course);break;
      case 'legacy-preview':Notenblick.legacyPreview?.();break;
      case 'work-year':{const y=Notenblick.data.years.find(y=>y.id===id);if(!y)throw Error('Dieses Schuljahr ist nicht mehr vorhanden.');Object.assign(Notenblick.ui,{workingYear:id,historicalYear:'',year:id,class:'',course:''});Notenblick.normalizeContext();Notenblick.renderAdmin();Notenblick.remember();Notenblick.$('[data-menu-key=year-'+id+']')?.focus();break;}
      case 'year-notes':Notenblick.ui.historicalYear=id===Notenblick.ui.workingYear?'':id;Notenblick.ui.year=id;Notenblick.ui.class='';Notenblick.ui.course='';Notenblick.normalizeContext();Notenblick.rendered={};Notenblick.activateGroup('main','notes',false,true);Notenblick.$('#class').focus();break;
      case 'current-year':Notenblick.ui.historicalYear='';Notenblick.ui.year=Notenblick.ui.workingYear;Notenblick.ui.class='';Notenblick.ui.course='';Notenblick.normalizeContext();Notenblick.rendered={};Notenblick.renderNotes();Notenblick.remember();Notenblick.$('#class').focus();break;
      case 'assessment-list': Notenblick.returnToAssessmentList(); break;
      case 'next-empty': {
        const w=Notenblick.W(),record=Notenblick.data.assessments.find(x=>x.id===w.selected[kind]),list=Notenblick.pointEntryList(record);
        if(!record||!list.length)break;let next=-1;
        for(let step=1;step<=list.length;step++){const at=(w.studentIndex+step)%list.length;if(!Notenblick.N.hasEntry(record.results[list[at].id])){next=at;break;}}
        if(next>=0){w.studentIndex=next;Notenblick.renderEntry(kind,'single');Notenblick.remember();Notenblick.$('#entry-'+kind+'-single [data-entry=points],#entry-'+kind+'-single [data-entry=grade]')?.focus();}break;
      }
      case 'assessment-edit': Notenblick.editAssessment(); break;
      case 'assessment-done': Notenblick.finishAssessment(); break;
      case 'point-settings': Notenblick.editPointSettings(); break;
      case 'open-assessment': Notenblick.openAssessment(id,true); break;
      case 'oral-picker': Notenblick.oralPicker(); break;
      case 'final-dialog': Notenblick.finalDialog(id,el.dataset.period||'annual'); break;
      case 'finals-class': Notenblick.finalDialog(null,el.dataset.period||'annual'); break;
      case 'edit-result': Notenblick.resultDialog(id,el.dataset.student); break;
      case 'transfer-student': Notenblick.transferDialog(id); break;
      case 'copy-course': Notenblick.copyCourseDialog(); break;
      case 'course-notes': Notenblick.courseNotes(id); break;
      case 'class-notes': Notenblick.classNotes(id); break;
      case 'class-subjects': Notenblick.ui.adminClass=id; Notenblick.ui.adminView='subjects'; Notenblick.renderAdmin(); Notenblick.remember(); Notenblick.$('#tab-subjects').focus(); break;
      case 'year-classes': Notenblick.ui.adminYear=id; Notenblick.ui.adminView='classes'; Notenblick.renderAdmin(); Notenblick.remember(); Notenblick.$('#tab-classes').focus(); break;
      case 'pupil-prev':
      case 'pupil-next': {const list=Notenblick.sorted(Notenblick.N.activeStudents(Notenblick.data,Notenblick.getCourse(),true),Notenblick.W().sortBy,Notenblick.W().sortDir),i=list.findIndex(s=>s.id===Notenblick.W().pupil);Notenblick.W().pupil=list[i+(a==='pupil-next'?1:-1)]?.id||Notenblick.W().pupil;Notenblick.renderPupil();Notenblick.remember();Notenblick.$('#pupilSelect').focus();break;}
      case 'open-folder': await window.NRDesktop.call('open-folder'); break;
      case 'csv': if(!Notenblick.getCourse()) throw Error('Bitte wähle unter „Noten“ zuerst ein Fach.'); await Notenblick.tableExport('overview'); break;
      case 'help':
        Notenblick.help();
        break;
      case 'close':
        if(!Notenblick.dialogBusy||Notenblick.dialogCancellable)Notenblick.closeModal();
        break;
      case 'folder':
        await Notenblick.folder();
        break;
      case 'relocate':
        await Notenblick.folder(true);
        break;
      case 'setup':
        Notenblick.setup();
        break;
      case 'open-admin':
        Notenblick.activateGroup('main', 'admin', true, true);
        break;
      case 'classes':
        Notenblick.ui.adminView = 'classes';
        Notenblick.renderAdmin();
        Notenblick.remember();
        Notenblick.$('#adminYear')?.focus();
        break;
      case 'manage-class':
        Notenblick.ui.adminClass = id;
        Notenblick.ui.adminView = 'students';
        Notenblick.renderAdmin();
        Notenblick.remember();
        Notenblick.$('#tab-students').focus();
        break;
      case 'new-year':
        if (Notenblick.ui.main !== 'admin') Notenblick.activateGroup('main', 'admin', false, false);
        Notenblick.yearDialog();
        break;
      case 'edit-year':
        if(id) Notenblick.ui.adminYear=id;
        Notenblick.yearDialog(true);
        break;
      case 'new-class':
        Notenblick.classDialog();
        break;
      case 'edit-class':
        Notenblick.classDialog(Notenblick.data.classes.find(c => c.id === id));
        break;
      case 'copy-class':
        Notenblick.copyClassDialog();
        break;
      case 'new-course':
        Notenblick.subjectDialog();
        break;
      case 'edit-course':
        Notenblick.subjectDialog(Notenblick.data.courses.find(c => c.id === id));
        break;
      case 'members':
        Notenblick.membersDialog(Notenblick.data.courses.find(c => c.id === id));
        break;
      case 'weights':
        Notenblick.weightsDialog(id ? Notenblick.data.courses.find(c => c.id === id) : Notenblick.getCourse());
        break;
      case 'new-student':
        Notenblick.studentDialog();
        break;
      case 'edit-student':
        Notenblick.studentDialog(Notenblick.getStudent(id));
        break;
      case 'bulk':
        Notenblick.bulkDialog();
        break;
      case 'exit-student':
        {
          const s = Notenblick.getStudent(id);
          Notenblick.ensureClassEdit(Notenblick.data.classes.find(c=>c.id===s.classId));
          Notenblick.confirm(s.archived ? 'Schüler wieder aufnehmen' : 'Teilnahme beenden', Notenblick.studentName(s) + (s.archived ? ' wird wieder in der Schülerliste angezeigt.' : ' wird als ehemalig geführt. Bisherige Noten bleiben erhalten.'), () => Notenblick.mutate(d => {
            d.students.find(x => x.id === id).archived = !s.archived;
          }), s.archived ? 'Wieder aufnehmen' : 'Teilnahme beenden');
          break;
        }
      case 'toggle-year':
      case 'toggle-class':
      case 'toggle-subject':
        {
          const key = a === 'toggle-year' ? 'years' : a === 'toggle-class' ? 'classes' : 'courses',
            x = Notenblick.data[key].find(x => x.id === id),
            archived = !x.archived;
          if(Notenblick.$('#dialog').open)Notenblick.closeModal();
          const year=key==='years',title=year?(archived?'Schuljahr abschließen':'Schuljahr wieder öffnen'):(archived?'Ausblenden':'Wieder anzeigen');
          const text=year?(archived?'Das '+Notenblick.schoolYear(x)+' wird abgeschlossen. Alle Klassen, Schüler und Noten bleiben erhalten, können anschließend aber nicht mehr bearbeitet werden. Du kannst das Schuljahr später wieder öffnen.':'Das '+Notenblick.schoolYear(x)+' wird wieder geöffnet. Klassen, Schüler und Noten bleiben erhalten und können wieder bearbeitet werden.'):(key==='classes'?'Die Klasse ':'Das Fach ')+x.name+(archived?' wird in der Auswahl ausgeblendet. Alle Schülerzuordnungen, Leistungen und Noten bleiben erhalten. Du kannst den Eintrag später wieder anzeigen.':' wird wieder in der Auswahl angezeigt. Alle bisherigen Daten bleiben erhalten.');
          Notenblick.confirm(title,text,()=>Notenblick.mutate(d=>{d[key].find(x=>x.id===id).archived=archived;}),title);
          break;
        }
      case 'new-assessment':
        Notenblick.assessmentDialog(null, kind,el.dataset.fixed==='true');
        break;
      case 'edit-assessment':
        Notenblick.assessmentDialog(Notenblick.data.assessments.find(a => a.id === id));
        break;
      case 'prev':
      case 'next':
        {
          const w = Notenblick.W();
          w.studentIndex = Math.max(0, Math.min(Notenblick.pointEntryList(Notenblick.data.assessments.find(x=>x.id===w.selected[kind])).length - 1, w.studentIndex + (a === 'next' ? 1 : -1)));
          Notenblick.renderEntry(kind, 'single');
          Notenblick.remember();
          Notenblick.$('#singleName-' + kind)?.focus();
          break;
        }
      case 'student-notes':{const s=Notenblick.getStudent(id),courses=Notenblick.data.courses.filter(c=>c.studentIds.includes(id)),c=courses.find(c=>c.id===Notenblick.ui.course)||courses.find(c=>!c.archived)||courses[0];if(!c)throw Error('Bitte ordne den Schüler zuerst einem Fach zu.');Notenblick.courseNotes(c.id);Notenblick.W().pupil=s.id;Notenblick.activateGroup('notes','pupil',true,true);break;}
      case 'student':
        Notenblick.W().pupil=id; Notenblick.activateGroup('notes','pupil',true,true);
        break;
      case 'quick-oral':
        Notenblick.quickOral(id);
        break;
      case 'delete-assessment':
        {
          const item = Notenblick.data.assessments.find(x => x.id === id);if(!item)throw Error('Diese Leistung ist nicht mehr vorhanden.');Notenblick.ensureEdit(Notenblick.data.courses.find(c=>c.id===item.courseId));
          if(Notenblick.$('#dialog').open)Notenblick.closeModal();
          Notenblick.confirm(Notenblick.N.isOralIndividual(item)?'Einzelnote löschen':'Leistung entfernen', (Notenblick.N.isOralIndividual(item)?Notenblick.studentName(Notenblick.getStudent(item.participantIds[0]))+', '+Notenblick.date(item.date)+': ':'')+'„' + item.title + '“ und die zugehörigen Noten werden entfernt. Du kannst die Änderung unter „Sicherung“ rückgängig machen.', () => {
            Notenblick.ensureEdit(Notenblick.data.courses.find(c=>c.id===item.courseId));
            Notenblick.mutate(d => {
              d.assessments = d.assessments.filter(x => x.id !== id);
              Notenblick.W().selected[item.kind] = 'all';
            });
            Notenblick.remember();
          }, 'Entfernen');
          break;
        }
      case 'copy-weights':Notenblick.openWeightCopy();break;
      case 'save':{
        const A=Notenblick,needed=A.dirty||A.workspaceFailed;A.feedback('status','');A.remember();await A.workspacePromise;await A.save();
        if(A.workspaceFailed||A.dirty)A.error('Bitte beachte die Meldung zum Speichern.','storage');else{A.error('','storage');A.feedback('status',needed?'Alle Änderungen wurden gespeichert.':'Alle Noten sind bereits gespeichert.');}break;
      }
      case 'cleanup':await Notenblick.openCleanup();break;
      case 'selected-export':{const s=Notenblick.backupExportSelection;Notenblick.output(s.content,Notenblick.independentExportContext(s.course,s.content));break;}
      case 'all-notes':await Notenblick.openAllNotesExport(Notenblick.val('allNotesFormat'));break;
      case 'restored-notes':Notenblick.activateGroup('main','notes',false,true);Notenblick.activateGroup('notes','overview',true,true);break;
      case 'all-text':await Notenblick.openAllNotesExport('txt');break;
      case 'backup':
        await Notenblick.backup();
        break;
      case 'import':
        Notenblick.$('#importFile').click();
        break;
      case 'restore-point':
        await Notenblick.restorePoint();
        break;
      case 'recovery':
        {
          let found;
          try {
            found = JSON.parse(localStorage.getItem('notenblick-recovery'));
          } catch {}
          if (!found?.dirty || found.demo) throw Error('Es gibt keine ungespeicherten Noten zum Wiederherstellen.');
          const recovered = Notenblick.N.upgrade({...found.data,...(found.workspace?{workspace:found.workspace}:{})});
          Notenblick.confirmRestore(recovered,null,'Ungespeicherte Änderungen wiederherstellen','Die Arbeitskopie ersetzt deinen aktuellen Datenstand. Notenblick sichert deine bisherigen Daten vorher zusätzlich.');
          break;
        }
      case 'regenerate':
        {Notenblick.feedback('status','');const result=await Notenblick.refreshTextLists(false);if(result)Notenblick.feedback('status',result.written?'Automatische Notenlisten aktualisiert. Fehlende oder veraltete Dateien wurden erneuert.':'Automatische Notenlisten geprüft. Alle Dateien sind aktuell.');}
        break;
      case 'undo':
        {
          if (!Notenblick.undo.length) return;
          const old = Notenblick.undo.pop(),
            meta = {
              revision: Notenblick.data.revision,
              commitId: Notenblick.data.commitId,
              updatedAt: Notenblick.data.updatedAt
            };
          Notenblick.data = Notenblick.N.upgrade(old);
          Object.assign(Notenblick.data, meta);
          Notenblick.rendered = {};
          Notenblick.mark();
          Notenblick.refreshCurrent();
          if(Notenblick.ui.main==='backup'){const control=Notenblick.$('#backup-undo');(control&&!control.disabled?control:Notenblick.$('#backupTabs [aria-selected=true]'))?.focus();}
          Notenblick.announce('Die letzte Änderung wurde zurückgenommen.');
          break;
        }
      case 'oral-record-export':{const aid=id;if(Notenblick.readonly()||Notenblick.$('#oralEditFields')?.hidden)Notenblick.closeModal({submitted:true});else await Notenblick.submitModal('export');if(!Notenblick.$('#dialog').open){const record=Notenblick.data.assessments.find(x=>x.id===aid);Notenblick.output('oral',Notenblick.singleAssessmentContext(record));}break;}
      case 'assessment-export':{const record=Notenblick.data.assessments.find(x=>x.id===id);Notenblick.output(record.kind,Notenblick.singleAssessmentContext(record));break;}
      case 'point-key':Notenblick.showPointKey(Notenblick.data.assessments.find(x=>x.id===id));break;
      case 'point-key-pdf':{const r=Notenblick.pointKeyReport(Notenblick.data.assessments.find(x=>x.id===id));await Notenblick.exportFile({}, {}, 'pdf',r);break;}
      case 'point-manual':Notenblick.manualPointGrade(Notenblick.data.assessments.find(x=>x.id===id),el.dataset.student);break;
      case 'output':
        Notenblick.output(kind);
        break;
      case 'print-list':
        Notenblick.closeModal();
        Notenblick.printList(kind);
        break;
      case 'export-text':
      case 'export-table':
        Notenblick.closeModal();
        await Notenblick.tableExport(kind, a === 'export-text');
        break;
    }
  };
})(globalThis.Notenblick = globalThis.Notenblick || {});
