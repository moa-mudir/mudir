#FROM nvidia/cuda:11.4.0-cudnn8-runtime-ubuntu20.04
FROM nvidia/cuda:11.6.1-cudnn8-devel-ubuntu20.04

WORKDIR /jup

ADD requirements.txt requirements.txt

# setup python
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update \
&& apt install software-properties-common -y \
&&  add-apt-repository ppa:deadsnakes/ppa -y

RUN apt update \
    && apt install -y python3.8 python3-pip \
	python3-dev libffi-dev libssl-dev \
	libgl1-mesa-glx curl openssh-server git htop vim \
    && /usr/bin/pip3 install -r requirements.txt -U \
    && jupyter notebook --generate-config \
    && echo "c.FileCheckpoints.checkpoint_dir = '/tmp/'" >> /root/.jupyter/jupyter_notebook_config.py

# setup sshd
RUN mkdir /var/run/sshd \
    && echo 'root:root' | chpasswd \
    && sed -i 's/#*PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config \
    && sed -i 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' /etc/pam.d/sshd \
    && echo "export VISIBLE=now" >> /etc/profile 

EXPOSE 8888 22

ENTRYPOINT ["jupyter", "lab","--ip=0.0.0.0","--allow-root","--NotebookApp.token=''","--NotebookApp.password=''"]
