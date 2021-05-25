# Mudir
## _Your laboratory's GPU workspace cluster manager tool_

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![Made withJupyter](https://img.shields.io/badge/Made%20with-Jupyter-orange?style=for-the-badge&logo=Jupyter)](https://jupyter.org/try)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

_Mudir_ is a GPU workspace management tool, user-friendly, to protect your teams' research

<img src="https://github.com/moa-mudir/mudir/blob/main/assets/Logo3.png" width="400" height="400">

## Features

- Works with a cluster of GPU Servers
- Two clicks to run your personal workspace
- Jupyter environment support
- A safe setup for experiments and datasets

## System requirements

- Ubuntu18.04 on host server(s)
- [MySQL 8.0.24](https://dev.mysql.com/downloads/mysql/5.7.html) server
- NVIDIA GPU with installed [CUDA drivers >= 10.x](https://developer.nvidia.com/cuda-10.2-download-archive)
- Docker runtime 19.03.12
- nodejs 12.20.1
- ** Optional FTP server
- ** docker-compose 1.29.0

## Setup 
- Clone this repo
- ```docker build -t <your-build-tag> .```
- ```cp default.env .env```
- modify .env according to your preferences, you can change the host, password and image name you've just tagged
to start

.env file
| Plugin | Description | values (default)|
| ------ | ------ |------|
| DATABASE_HOST |  <ip> of mysql database| localhost 
| DATABASE_USER | <username> of mysql database| root
| DATABASE_PASSWORD |  <password> of mysql database| issd2009
| DATABASE_PORT | <port> of database| 3306
| DATABASE_NAME |  <name> of database| containers
| BASE_DOCKER_IMAGE |  <tag> of image| jupyterlab:1.0
| DATASET_URI  | root folder of your dataset | /mnt/dataset 
| TEMP_URI  | tmp folder of your experiment | /mnt/exp
| SHARED_GPU | Shared memory by GPU | 4
| UID | linux host user id | 1000
| GID | linux host group id | 1000
| DATA_VOLUME | (Optional) mounting database folder | /mnt/db

After configuring the system, you can test it by running ```node src/app.js```

if it successfully runs you can set it as a service to run on system up:
- edit _gpu-manager.service_ modify the _EnvironmentFile_ _WorkingDirectory_ to point to the _.env_ and root folder of the app correspondingly
- ```sudo cp gpu-manager.service /etc/systemd/system/```
- ```sudo systemctl daemon-reload```
- ```sudo systemctl start gpu-manager.service```
- ```sudo systemct status gpu-manager.service``` to check the status
- ** If you want to host the mysql on the same machine, you can run ```docker-compose up``` to spin a database server

## Usage
- After successfully running the service, from your browser open ```<host-ip>:3000```.
- Login with ```admin/admin``` credentials
- Navigate to _workspaces_ to create/delete a workspace of a given name with description
  ![workspaces](https://github.com/moa-mudir/mudir/blob/main/assets/ws1.png)
  ![workspace delete](https://github.com/moa-mudir/mudir/blob/main/assets/ws3.png)
  
- A workspace will have 2 ports, 1 for http jupyter and 1 for custom usage
   ![workspaces](https://github.com/moa-mudir/mudir/blob/main/assets/ws2.png)

- The name given to the workspace will create a directory on the filesystem (maybe mounted fileserver) to host the assets
of experiment. Though allowing you to mount it over FTP and have persistent protected assets
- Navigate to _Edit users_ to add/delete a user
    ![User add/delete](https://github.com/moa-mudir/mudir/blob/main/assets/ws4.png)

- Clicking a workspace button when it is green it will redirect you to a jupyter environment
![Jupyter environment](https://github.com/moa-mudir/mudir/blob/main/assets/ws5.png)
  
## Contributing
- TBA
