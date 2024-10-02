FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu20.04

WORKDIR /jup

ADD requirements.txt requirements.txt

# setup python
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update \
    && apt remove -y python3.8 python3.8-venv python3.8-dev python3-pip \
    && apt autoremove -y

# Install software-properties-common and add deadsnakes PPA
RUN apt install -y software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa -y

# Install Python 3.10 and pip for Python 3.10
RUN apt update \
    && apt install -y python3.10 python3.10-venv python3.10-dev \
    libgl1-mesa-glx libffi-dev libssl-dev \
    curl git htop vim nano openssh-server

RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
    && python3.10 get-pip.py \
    && rm get-pip.py

RUN pip install -r requirements.txt -U

RUN jupyter notebook --generate-config \
    && echo "c.FileCheckpoints.checkpoint_dir = '/tmp/'" >> /root/.jupyter/jupyter_notebook_config.py

# setup sshd
RUN mkdir /var/run/sshd \
    && echo 'root:root' | chpasswd \
    && sed -i 's/#*PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config \
    && sed -i 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' /etc/pam.d/sshd \
    && echo "export VISIBLE=now" >> /etc/profile

EXPOSE 8888 22

ENTRYPOINT ["jupyter", "lab","--ip=0.0.0.0","--allow-root","--NotebookApp.token=''","--NotebookApp.password=''"]