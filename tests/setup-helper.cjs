'use strict';
// Drive the public four-step form, keeping test fixtures out of product code.
exports.simple=async function(A,document,{year='2026/27',className='6a',subject='Deutsch'}={}){
 A.setup();document.getElementById('setup-year').value=year;document.querySelector('[id^=setup-class-]').value=className;
 await A.submitModal();if(!document.getElementById('dialogError').hidden)throw Error(document.getElementById('dialogError').textContent);
 document.querySelector('[id^=setup-subject-]').value=subject;await A.submitModal();await A.submitModal();await A.submitModal();
 if(!document.getElementById('dialogError').hidden)throw Error(document.getElementById('dialogError').textContent);
};
