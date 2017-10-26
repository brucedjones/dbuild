var Ajv = require('ajv');
const schema = require('./schema.json');

var manifest = {}

var validateManifest = (dbj)=>{
    var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
    var validate = ajv.compile(schema);
    var valid = validate(dbj);
    if (!valid) throw(validate.errors);
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
    return dbj;
}
module.exports = manifest;