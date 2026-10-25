'use strict';
const fs=require('node:fs'),path=require('node:path');
(async()=>{const ctx=await require('./load.cjs').load(),A=ctx.q;try{A.data=ctx.w.NR.upgrade(ctx.w.NR.demo());A.normalizeContext();A.refreshCurrent();const report=A.buildReport(A.exportContext('overview'),{scope:'all',remarks:true});for(const [ext,value]of [['docx',A.reportDocx(report)],['xlsx',A.reportXlsx(report)]])fs.writeFileSync(path.join(__dirname,'native/synthetic-export.'+ext),Buffer.from(value));}finally{await A.workspacePromise;ctx.w.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
