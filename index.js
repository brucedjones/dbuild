const dbuild = require('./dbuild');
const manifest = require('./manifest');
const program = require('commander');

program
  .version('0.0.1')
  .description('Docker based build system for linux binary installers')
  .option('-p, --platform <platform>', 'Build for a specific platform')
  .parse(process.argv);

var dbj = manifest.get();
if(dbj){
    if(program.platform) dbuild.buildPlatform(program.platform,dbj);
    else dbuild.build(dbj);
} 