var fs = require('fs');
var Ajv = require('ajv');
const schema = require('./schema.json');

var manifest = {}

var validateManifest = (dbj)=>{
    var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
    var validate = ajv.compile(schema);
    var valid = validate(dbj);
    if (!valid) throw(validate.errors);
}

var validateDirectoryStructure = (dbj)=>{
    var path = process.cwd();
    var srcDir = path+'\\'+dbj.directories.src;
    var logDir = path+'\\'+dbj.directories.log;
    var buildsDir = path+'\\'+dbj.directories.builds;
    var buildScript = path+'\\dbuild.sh';

    if(!fs.existsSync(logDir)) {
        console.log("Warning: Log directory doesn't exist, creating...")
        fs.mkdirSync(logDir);
    }
    if(!fs.existsSync(buildsDir)) {
        console.log("Warning: Builds directory doesn't exist, creating...")
        fs.mkdirSync(buildsDir);
    }

    if(!fs.existsSync(srcDir)) throw("Error: Source directory does not exist");
    if(!fs.existsSync(buildScript)) throw("Error: Build script does not exist");
}

manifest.get = () => {
    var path = process.cwd();
    var fname = path + '\\dbuild.json';
    try {
        var dbj = require(fname);
    } catch (e) {
        console.log('Error: dbuild.json not found');
        return;
    }
    try {
        validateManifest(dbj)
    } catch(e) {
        console.log("Error: dbuild.json is invalid")
        console.log(e);
        return;
    }
    try{
        validateDirectoryStructure(dbj)
    } catch(e) {
        console.log(e);
        return
    }
    return dbj;
}
module.exports = manifest;