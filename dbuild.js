var fs = require("fs");
var child_process = require('child_process');
var Docker = require('dockerode');
var docker = new Docker();

var dbuild = {};

dbuild.build = function(dbj){

    var genTask = function(platform,manager,extension) {
        child_process.execSync('docker pull '+platform, {stdio:[0,1,2]});

        var dependencies = dbj.dependencies.map((dep)=>{
            if(dep.hasOwnProperty(manager)) return dep[manager];
            else return dep.name;
        });
        
        build = dbj.build.slice();
        if(manager=='apt')
            build.unshift("apt-get -q update", "apt-get -q install -y " + dependencies.join(' '));
        else
            build.unshift("yum install -y -d1 " + dependencies.join(' '));

        build.push("mv $BUILDS_DIR/output."+extension.toLowerCase()+" $BUILDS_DIR/"+dbj.package.name+"-"+dbj.package.version+"-"+platform.replace(':','.')+"."+extension.toLowerCase());

        return {platform:platform, packageManager:manager, buildScript:build.join(' && '),dbj:dbj};
    }

    var aptTasks = dbj.platforms.apt.map((platform)=>{
        return genTask(platform,'apt','deb')
    });

    
    var yumTasks = dbj.platforms.yum.map((platform)=>{
        return genTask(platform,'yum','rpm')
    });

    tasks = aptTasks.concat(yumTasks);

    tasks.forEach(dbuild.runBuild);
    // dbuild.runBuild(tasks[0]);

}

dbuild.buildPlatform = function (platform,dbj){
  var platformFound = false;

  if(dbj.platforms.apt.indexOf(platform) >= 0){
    dbj.platforms.apt = [platform];
    dbj.platforms.yum = [];
    platformFound = true;
  }
  
  if(dbj.platforms.yum.indexOf(platform) >= 0){
    dbj.platforms.yum = [platform];
    dbj.platforms.apt = [];
    platformFound = true;
  }

  if(platformFound) dbuild.build(dbj);
  else console.log('Error: Platform ' + platform + ' not found. Check dbuild.json for available platforms')
}

dbuild.runBuild = function(task){
    var dbj = task.dbj;
    var path = process.cwd();
    var package_type = task.packageManager == 'apt' ? 'DEB' : 'RPM';
    
    docker.createContainer({
        Image: task.platform,
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Hostconfig: {
            Binds: [path+":/home/shared/"],
        },
        
        Env: ['PACKAGE_TYPE='+package_type,
            'BUILDS_DIR=/home/shared/'+dbj.directories.builds,
            'SOURCE_DIR=/home/shared/'+dbj.directories.src,
            'LOG_DIR=/home/shared/'+dbj.directories.log],
            Cmd: ['/bin/bash', '-c', task.buildScript],
        OpenStdin: false,
        StdinOnce: false
      }).then(function(container) {
        container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
            
            stream.pipe(process.stdout);

            var log = fs.createWriteStream(dbj.directories.log + '/' + task.platform.replace(':','.') + '.log');
            stream.pipe(log);
          });
        return container.start();
      })/*.then(function(container) {
        return container.stop();
      }).then(function(container) {
        return container.remove();
      }).then(function(data) {
        console.log('container removed');
      })*/.catch(function(err) {
        console.log(err);
      });
}

module.exports = dbuild;