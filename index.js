const dbuild = require('./dbuild');
const program = require('commander');

var openManifest = function(){
    var path = process.cwd();
    var fname = path + '\\dbuild.json';
    try {
        var dbj = require(fname);
    } catch (e) {
        console.log('Error: dbuild.json not found');
    }
    return dbj;
}

program
  .version('0.0.1')
  .description('Docker based build system for linux binary installers')
  .option('-p, --platform <platform>', 'Build for a specific platform')
  .parse(process.argv);

var dbj = openManifest();
if(dbj){
    if(program.platform) dbuild.buildPlatform(program.platform,dbj);
    else dbuild.build(dbj);
} 

/*program
  .command('*')
  .description('Build for all platforms')
  .action(() => {
    var dbj = openManifest();
    if(dbj) dbuild.build(dbj);
  });

program
  .command('build <platform>')
  .alias('bp')
  .description('Build for a specific platform')
  .action((platform) => {
    var dbj = openManifest();
    if(dbj) dbuild.buildPlatform(platform,dbj);
  });

program.parse(process.argv);*/