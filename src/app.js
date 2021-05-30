require('dotenv').config();
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var path = require("path");
var http = require('http');
var ip = require("ip");
var controller = require("./app.controller");
var __const = require("./constants");

var app = express();
controller.createdb();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(session({
    secret: "SIGNINpageSECRET",
    resave: true,
    saveUninitialized: true
}));

app.get('/', function(req, res) {
    if (req.session.loggedin) {
        res.redirect("/sysInfo");
    } else {
        res.render("signin", { wrongUserPass: req.session.wrongUserPass, app_version: __const.APP_VERSION });
    }
});

app.get('/sysInfo', function(req, res) {
    req.session.contGenerated = true;
    if (req.session.loggedin) {
        res.render("sysInfo", { admin: req.session.adminLoggedIn, username: req.session.username, ip: ip.address() });
    } else {
        res.redirect("/");
    }
});

app.get("/editUsers", function(req, res) {
    req.session.contGenerated = true;
    if (req.session.loggedin && req.session.adminLoggedIn) {
        res.render("editUser", { admin: req.session.adminLoggedIn, username: req.session.username });
    } else {
        res.redirect("/");
    }
});

app.get('/workspaces', function(req, res) {
    if (req.session.loggedin) {
        res.redirect("/workspaces/" + req.session.currGPU);
    } else {
        res.redirect("/");
    }
});

app.post("/changeGPU", function(req, res) {
    req.session.currGPU = req.body.GPU_SELECT;
    req.session.GPUs.splice(req.session.GPUs.indexOf(req.session.currGPU), 1);
    req.session.GPUs.unshift(req.session.currGPU);
    res.redirect("/workspaces/" + req.session.currGPU);
});

app.get('/workspaces/:currGPU', function(req, res) {
    if (req.session.loggedin) {
        controller.containersJSON(function(wsInfo) {
            res.render("workspaces", { workspaces: wsInfo, admin: req.session.adminLoggedIn,
                                       username: req.session.username, ip: req.session.currGPU,
                                       GPUs: req.session.GPUs, contGenerated: req.session.contGenerated });
        });
    } else {
        res.redirect("/");
    }
});

app.get('/signout', function(req, res) {
    req.session.loggedin = false;
    res.redirect("/");
});

app.post("/auth", function(req, res) {
    controller.containersJSON(function(wsInfo) {
        req.session.GPUs = wsInfo["gpu_address"].filter((x, i) => i === wsInfo["gpu_address"].indexOf(x));
        if (req.session.GPUs) {
            req.session.currGPU = req.session.GPUs[0];
        }
        else {
            req.session.currGPU = ip.address();
        }
    });
    req.session.username = req.body.username;
    var password = req.body.password;
    controller.auth(req.session.username, password, function(loggedin) {
        req.session.wrongUserPass = loggedin.wrongUserPass;
        req.session.adminLoggedIn = loggedin.adminLoggedIn;
        req.session.loggedin = !req.session.wrongUserPass;
        if (req.session.loggedin) {
            res.redirect("/sysInfo");
        } else {
            res.redirect("/");
        }
    });
});

app.post("/deleteUser", function(req, res) {
    var userToDelete = req.body.username;
    var password = req.body.password;
    controller.deleteUser(userToDelete, password);
    res.redirect("/editUsers");
});

app.post("/createUser", function(req, res) {
    var newUser = req.body.username;
    var password = req.body.password;
    controller.createUser(newUser, password);
    res.redirect("/editUsers");
});

app.post("/generateContainer", function(req, res) {
    var containerName = req.body.workspaceName1;
    var containerDes = req.body.workspaceDescription;
    var gpu_cpu = req.body.GPU_CPU;
    req.session.contGenerated = controller.generateContainer({
        containerName: containerName,
        containerDes: containerDes,
        gpu_cpu: gpu_cpu,
        username: req.session.username,
        gpu_address: ip.address()
    });
    res.redirect("/workspaces/" + req.session.currGPU);
});

app.post("/deleteWorkspace", function(req, res) {
    var containerToDelete = req.body.workspaceName;
    controller.deleteContainer(containerToDelete);
    res.redirect("/workspaces/" + req.session.currGPU);
});

app.post("/stWorkspace", function(req, res) {
    var containerToSt = req.body.workspaceName;
    controller.stContainer(containerToSt, req.session.currGPU);
    res.redirect("/workspaces/" + req.session.currGPU);
});
app.listen(3000);
