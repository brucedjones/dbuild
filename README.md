# dbuild
dbuild is a docker based build system to facilitate linux package generation.

### dbuild will:
* Create a docker container for each platform specified.
* Install specified dependency using the platforms package manager.
* Execute the user specified compilation and package generation script.
* Populate the builds directory with an installation package for each platform specified.

### dbuild will not:
* Solve dependency hell.

Disclaimer: Packages should be tested on target platform. Automated testing will be implemented in the future.

# Usage

A typical dbuild directory structure is as follows,

```code
project_root
    |
    |-- source_dir
    |      |- source files
    |-- log_dir *
    |      |- build log files
    |-- builds_dir *
    |      |- built packages
    |-- dbuild.json
    |-- dbuild.sh
```

(*) log and builds directories will be created automatically if they do not already exist

With such a structure dbuild may be invoked to build for all specified platforms by,

```bash
$ dbuild
```

or for a specific platform,

```bash
$ dbuild -p ubuntu:17.10
```

or for all  versions of the same platform (specified in dbuild.json)

```bash
$ dbuild -p ubuntu
```

or for multiple independent platforms,

```bash
$ dbuild -p ubuntu:17.10 -p centos:7
```


# Prerequisites
* Docker

## dbuild.json
The dbuild.json specifies,
* Package metadata
* Which platforms to build packages for
* The package dependencies (Note: name only, version is controlled by linux distribution)
* The relative path to source, log, and builds directories

Use the sample dbuild.json to get started,

```json
{
    "package":{"name":"myCode", "version":"0.0.1"},
    "platforms":{
        "apt":["ubuntu:17.10", "ubuntu:17.04", "ubuntu:16.04"],
        "yum":["centos:7","centos:6"]
    },
    "dependencies":[
        {"name":"python-dev","apt":"python-dev","yum":"python-devel"},
        {"name":"libz-dev","ubuntu":"libz-dev","centos":"zlib-devel"},
        {"name":"cmake"},
        {"name":"build-essential", "ubuntu":"build-essential", "centos":"make glibc-devel gcc gcc-c++ patch rpm-build"}
    ],
    "directories":{
        "src":"src",
        "builds":"builds",
        "log":"log"
    }
}
```
### Platforms
Platforms are specified according to whether they are apt or yum based. Support for other platforms may be added in future (Create an issue if you require other platforms)

Platform names are given corresponding to those available on [Docker Hub](https://hub.docker.com/).

### Dependencies
The dependencies array must give the name of a dependency at a minimum. If no other aliases are specified dbuild will attempt to install this dependency using this name. Package aliases may be specified either by package manager name, platform name, or platform name and version.

## dbuild.sh
This script should compile the source code and create the output package. The following environment variables may be used,

| Environment Variable | Description                       |
|----------------------|-----------------------------------|
| SOURCE_DIR           | Path to the source code directory |
| BUILDS_DIR           | Path to the builds directory      |
| LOG_DIR              | Path to the log directory         |
| PACKAGE_TYPE         | RPM or DEB depending on platform  |



## source_dir
This directory must be included and specified by the user.