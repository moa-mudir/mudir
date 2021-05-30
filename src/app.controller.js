var cmd = require('child_process').execSync;
var model = require("./app.model");

const BASE_DOCKER_IMAGE = process.env.BASE_DOCKER_IMAGE;
const DATASET_URI = process.env.DATASET_URI;
const TEMP_URI = process.env.TEMP_URI;
const SHARED_GPU = process.env.SHARED_GPU;

forbiddenChars = ['!', '\"', '#', '$', '%', '&', '\\', '\'', '(', ')', '*', '+', ',', '/', ':', ';', '<', '=', '>', '?', '[', ']', '^', '\`', '{', '|', '}', '~'];

String.prototype.format = function() {
    var formatted = this;
    for (var arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};

function generatePort() {
    var portInUse = false;
    var port = -1;

    do {
        port = ~~(1024 + Math.random() * 50000);
        try {
            portInUse = cmd("ss -tulpn | grep :" + String(port)).toString().length > 0;
        } catch (ex) {
            portInUse = false;
        }
    } while (portInUse);
    return port;
}

function editName(containerName) {
    var nameArray = containerName.split('');
    for (var i = 0; i < nameArray.length; i++) {
        if (nameArray[i] == ' ') {
            nameArray[i] = '_';
        } else if (forbiddenChars.includes(nameArray[i])) {
            nameArray.splice(i, 1);
        }
    }
    return nameArray.join('');
}

module.exports = {
    createdb: function() {
        model.createdb();
    },
    containersJSON: function(callback) {
        rows = model.getAllContainers(function(rows) {
            var containers = { "names": [], "http_ports": [], "ssh_ports": [], "descriptions": [], "creators": [], "gpu_address": [], "running": [] };
            for (var row of rows) {
                containers.names.push(row.name);
                containers.http_ports.push(row.http_port);
                containers.ssh_ports.push(row.ssh_port);
                containers.descriptions.push(row.description);
                containers.creators.push(row.creator);
                containers.gpu_address.push(row.gpu_address);
                containers.running.push(row.on_off);
                try {
                    portInUse = cmd("ss -tulpn | grep :" + String(row.http_port)).toString();
                } catch (ex) {
                    portInUse = "";
                }
                if (row.on_off && portInUse == "") {
                    commandName = editName(row.name);
                    cmd("docker start " + commandName);
                }
                else if (!(row.on_off) && portInUse != "") {
                    commandName = editName(row.name);
                    cmd("docker stop " + commandName);
                }
            }
            return callback(containers);
        });
    },
    auth: function(username, password, callback) {
        var wrongUserPass = false;
        var adminLoggedIn = false;
        model.getUser(username, function(user) {
            if (user && user.password == password) {
                wrongUserPass = false;
                if (user.admin) {
                    adminLoggedIn = true;
                } else {
                    adminLoggedIn = false;
                }
            } else {
                wrongUserPass = true;
                adminLoggedIn = false;
            }
            return callback({ wrongUserPass: wrongUserPass, adminLoggedIn: adminLoggedIn });
        });
    },

    deleteUser: function(username, password) {
        model.getUser(username, function(user) {
            if (user && user.password == password && !(user.admin)) {
                model.deleteUser(username);
            }
        });
    },
    createUser: function(username, password) {
        model.getUser(username, function(user) {
            if (!user) {
                model.addUser(username, password);
            }
        });
    },
    generateContainer: function(params) {
        http_port = generatePort();
        ssh_port = generatePort();
        commandName = editName(params.containerName);
        var workspace_assets = "{0}/{1}".format(TEMP_URI, commandName);
        cmd("mkdir -p {0}".format(workspace_assets));
        console.log(workspace_assets);
        var command = "docker run -d --shm-size={0}g -v {1}:/jup/tmp -v {2}:/jup/datasets --gpus all --name {3} -p {4}:8888 -p {5}:22 {6}".
        format(SHARED_GPU, workspace_assets, DATASET_URI, commandName, String(http_port), String(ssh_port), BASE_DOCKER_IMAGE);
        if (params.gpu_cpu != "GPU") {
            command = command.replace("--gpus all", "");
        }
        console.log(command);
        try {
            cmd(command);
        } catch (ex) {
            return false;
        }

        model.addContainer({
            http_port: http_port,
            ssh_port: ssh_port,
            containerName: params.containerName,
            containerDes: params.containerDes,
            username: params.username,
            gpu_address: params.gpu_address,
            on_off: 1
        });
        return true;
    },
    deleteContainer: function(containerName) {
        commandName = editName(containerName);
        model.getContainer(containerName, function(query) {
            if (query) {
                cmd("docker stop " + commandName);
                cmd("docker rm " + commandName);
                model.deleteContainer(containerName);
            }
        });
    },
    stContainer: function(containerName, gpu) {
        commandName = editName(containerName);
        model.getContainer(containerName, function(query) {
            if (query) {
                try {
                    portInUse = cmd("ss -tulpn | grep :" + String(query.http_port)).toString();
                } catch (ex) {
                    portInUse = "";
                }
                if (!(query.on_off) && portInUse) {
                    cmd("docker stop " + commandName);
                    model.setContainerOff(containerName, gpu);
                } else if (query.on_off && portInUse == "") {
                    cmd("docker start " + commandName);
                    model.setContainerOn(containerName, gpu)
                }
            }
        });
    }
};
