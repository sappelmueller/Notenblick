'use strict';
exports.get=function(name){try{return require(name);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;return require('/tmp/notenblick-test-deps/node_modules/'+name);}};
