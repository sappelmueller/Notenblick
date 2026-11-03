// Controlled bridge only; never contacts GitHub or starts an installer.
module.exports=function(){
 const original={available:NRDesktop.available,call:NRDesktop.call};
 const host=globalThis.updateTestHost={calls:[],state:{enabled:false,hiddenVersion:'',offer:null},offer:{version:'1.25.0',notes:['Notenblick startet jetzt maximiert.','Tastenkombinationen werden zuverlässiger angesagt.','Neue Versionen lassen sich direkt im Programm installieren.']},offline:false,prepareMode:'ready',handedOff:false};
 const copy=v=>JSON.parse(JSON.stringify(v));
 NRDesktop.available=true;NRDesktop.call=async(op,args={},progress)=>{
  host.calls.push({op,args:copy(args)});
  switch(op){
   case 'update-state':return copy(host.state);
   case 'update-check':if(host.offline)throw Error('Controlled offline');host.state.offer=copy(host.offer);return{...copy(host.state),checked:true};
   case 'update-preferences':Object.assign(host.state,args);return copy(host.state);
   case 'update-prepare':progress?.('downloading:0');progress?.('downloading:40');if(host.prepareMode==='fail')throw Error('Die Aktualisierung konnte nicht abgeschlossen werden. Deine Noten sind unverändert.');if(host.prepareMode==='wait')return new Promise((resolve,reject)=>{host.resolvePrepare=()=>{progress?.('checking');resolve('synthetic-prepared-token');};host.rejectPrepare=reject;});progress?.('checking');return'synthetic-prepared-token';
   case 'update-cancel':if(host.rejectPrepare){const e=Error('Cancelled');e.name='AbortError';host.rejectPrepare(e);host.rejectPrepare=null;}return true;
   case 'update-install':host.handedOff=true;return true;
   default:return original.call(op,args,progress);
  }
 };
 host.restore=()=>{NRDesktop.available=original.available;NRDesktop.call=original.call;};return host;
};
