'use strict';
// Compare readable content independently of the renderer, including every list item/cell.
module.exports=(assert,root,section)=>{
 const clean=s=>s.replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
 const blocks=Array.from(section.paragraphs),expected=blocks.flatMap(block=>block.split('\n').filter(line=>!/^\|[ :|\-]+\|$/.test(line)).flatMap(line=>line.startsWith('|')?line.slice(1,-1).split('|').map(clean):[clean(line.replace(/^(?:\d+\. |\- )/,''))]));
 const actual=Array.from(root.querySelectorAll('p,li,th,td')).filter(el=>!el.closest('button')).map(el=>clean(el.textContent));
 assert.deepEqual(actual,expected,section.id);
 assert.equal(root.querySelectorAll('ol').length,blocks.filter(b=>/^1\. /.test(b)).length,section.id+' ordered steps');
 assert.equal(root.querySelectorAll('ul').length,blocks.filter(b=>b.startsWith('- ')).length,section.id+' bullet lists');
 assert.equal(root.querySelectorAll('table').length,blocks.filter(b=>b.startsWith('|')).length,section.id+' tables');
 assert.equal(root.querySelectorAll('table th:not([scope=col])').length,0);
};
