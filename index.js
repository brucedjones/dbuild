#! /usr/bin/env node

const dbuild = require('./dbuild');
const manifest = require('./manifest');
const program = require('commander');

function collect(val, memo) {
    memo.push(val);
    return memo;
  }

program
  .version('0.0.1')
  .description('Docker based build system for linux binary installers')
  .option('-p, --platform <platform>', 'Build for specific platforms',collect,[])
  .parse(process.argv);

var dbj = manifest.get();
if(dbj){
    if(program.platform.length>0) dbuild.buildPlatforms(program.platform,dbj);
    else dbuild.build(dbj);
} 