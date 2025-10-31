#!/bin/bash

# Add team SSH keys to ubuntu user
mkdir -p /home/ubuntu/.ssh

# Add SSH keys - these will be replaced by template substitution
cat >> /home/ubuntu/.ssh/authorized_keys <<'KEYS'
SSH_KEYS_PLACEHOLDER
KEYS

chmod 700 /home/ubuntu/.ssh
chmod 600 /home/ubuntu/.ssh/authorized_keys
chown -R ubuntu:ubuntu /home/ubuntu/.ssh

apt-get update
apt-get install -y wget gnupg2 lsb-release curl

wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

apt-get update
apt-get install -y postgresql-client-15

psql --version

# Install NVM and Node.js 22 for ubuntu user
sudo -u ubuntu bash -c '
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="/home/ubuntu/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
  nvm install 22
  nvm use 22
  nvm alias default 22
  echo "export NVM_DIR=\"/home/ubuntu/.nvm\"" >> /home/ubuntu/.bashrc
  echo "[ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"" >> /home/ubuntu/.bashrc
  echo "[ -s \"\$NVM_DIR/bash_completion\" ] && \\. \"\$NVM_DIR/bash_completion\"" >> /home/ubuntu/.bashrc
'

mkdir -p /home/ubuntu/work
git clone https://github.com/intersective/projecthub.git /home/ubuntu/work/projecthub

# Create .env file
cat > /home/ubuntu/work/projecthub/src/.env << 'ENVFILE'
ENV_CONTENT_PLACEHOLDER
ENVFILE

# Create .pgpass file
cat > /home/ubuntu/.pgpass << 'PGPASSFILE'
PGPASS_CONTENT_PLACEHOLDER
PGPASSFILE

chmod 600 /home/ubuntu/.pgpass
chown ubuntu:ubuntu /home/ubuntu/.pgpass

chown -R ubuntu:ubuntu /home/ubuntu/work