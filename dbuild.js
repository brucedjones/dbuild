var fs = require("fs");
var child_process = require('child_process');
var Docker = require('dockerode');
var docker = new Docker();

var dbuild = {};

dbuild.build = function(dbj){

    var genTask = function(platform,manager,extension) {
        child_process.execSync('docker pull '+platform, {stdio:[0,1,2]});

        var build = []

        if(dbj.dependencies && dbj.dependencies.length>0)
        {
          var dependencies = dbj.dependencies.map((dep)=>{
            var basePlatform = platform.split(':')[0];
            if(dep.hasOwnProperty(basePlatform)) return dep[basePlatform];
            else if(dep.hasOwnProperty(platform)) return dep[platform];
            else if(dep.hasOwnProperty(manager)) return dep[manager];
            else return dep.name;
          });
        
          if(manager=='apt')
              build.push("apt-get -q update", "apt-get -q install -y " + dependencies.join(' '));
          else
              build.push("yum install -y -d1 " + dependencies.join(' '));
        }

        build.push("chmod -x /home/shared/dbuild.sh")
        build.push("/home/shared/dbuild.sh")

        build.push("mv $BUILDS_DIR/output."+extension.toLowerCase()+" $BUILDS_DIR/"+dbj.package.name+"-"+dbj.package.version+"-"+platform.replace(':','.')+"."+extension.toLowerCase());

        return {platform:platform, packageManager:manager, buildScript:build.join(' && '),dbj:dbj};
    }

    var tasks = [];
    if(dbj.platforms.hasOwnProperty('apt')){
      var aptTasks = dbj.platforms.apt.map((platform)=>{
          return genTask(platform,'apt','deb')
      });
      tasks = tasks.concat(aptTasks);
    }

    if(dbj.platforms.hasOwnProperty('yum')){
      var yumTasks = dbj.platforms.yum.map((platform)=>{
          return genTask(platform,'yum','rpm')
      });
      tasks = tasks.concat(yumTasks);
    }

    tasks.forEach(dbuild.runBuild);
}

dbuild.buildPlatform = function (platform,dbj){
  var platformFound = false;
  
  if(dbj.platforms.hasOwnProperty('apt')){
      var candidates = dbj.platforms.apt = dbj.platforms.apt.reduce((prev,curr)=>{
      var baseCurr = curr.split(':')[0];
      if(platform == curr) prev.push(curr);
      if(platform == baseCurr) prev.push(curr)
      return prev;
    },[]);

    if(candidates.length>0){
      dbj.platforms.apt = candidates
      dbj.platforms.yum = [];
      platformFound = true;
    }
  }
    
  if(dbj.platforms.hasOwnProperty('yum')){
      var candidates = dbj.platforms.yum.reduce((prev,curr)=>{
      var baseCurr = curr.split(':')[0];
      if(platform == curr) prev.push(curr);
      if(platform == baseCurr) prev.push(curr)
      return prev;
    },[]);
    
    if(candidates.length>0){
      dbj.platforms.yum = candidates
      dbj.platforms.apt = [];
      platformFound = true;
    }
  }

  console.log(platformFound)
  console.log(JSON.stringify(dbj.platforms))
  if(platformFound) dbuild.build(dbj);
  else console.log('Error: Platform ' + platform + ' not found. Check dbuild.json for available platforms')
}

dbuild.buildPlatforms = function(platforms,dbj){
  platforms.forEach((platform)=>{
    var tmpdbj = JSON.parse(JSON.stringify(dbj));
    dbuild.buildPlatform(platform,tmpdbj);
  });
}

dbuild.runBuild = function(task){
    console.log("Building for " + task.platform);
    var dbj = task.dbj;
    var path = process.cwd();
    var package_type = task.packageManager == 'apt' ? 'DEB' : 'RPM';
    
    var log = fs.createWriteStream(dbj.directories.log + '/' + task.platform.replace(':','.') + '.log');

    var options = {
      Hostconfig: {
          Binds: [path+":/home/shared/"],
      },
      
      Env: ['PACKAGE_TYPE='+package_type,
          'BUILDS_DIR=/home/shared/'+dbj.directories.builds,
          'SOURCE_DIR=/home/shared/'+dbj.directories.src,
          'LOG_DIR=/home/shared/'+dbj.directories.log],
    }

    docker.run(task.platform, ['bash', '-c', task.buildScript], log, options, function (err, data, container) {
      container.remove().then(()=>{
        console.log(task.platform + ' build finished');
      })
    });
}

module.exports = dbuild;