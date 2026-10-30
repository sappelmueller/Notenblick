globalThis.NRVersion=require('../package.json').version;
// Node test adapter. Not needed by the browser edition.
for(const name of ['constants','arithmetic','points','names','records','migrations','transfers','evaluation','finals','oral','weighting','text-lists'])require('./domain/'+name+'.js');
module.exports=globalThis.NR;
module.exports.demo=require('../tests/fixtures.cjs')(module.exports);
