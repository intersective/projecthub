data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

data "aws_vpc" "vpc" {
  filter {
    name   = "tag:Name"
    values = ["p2-sandbox-vpc-dev"]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.vpc.id]
  }

  filter {
    name   = "tag:Name"
    values = ["*public*"] # Adjust pattern based on your naming convention
  }
}

resource "random_shuffle" "public_subnet" {
  input        = data.aws_subnets.public.ids
  result_count = 1
}


data "aws_subnet" "public" {
  id = random_shuffle.public_subnet.result[0]
}
  
data "aws_security_group" "db_server_sg" {
  filter {
    name   = "tag:Name"
    values = ["${var.stack_name}-DBServerSecurityGroup-${var.environment}"]
  }
}

resource "aws_security_group" "allow_ssh" {
  name        = "${var.stack_name}-ProjectHubBastion-${var.environment}"
  description = "Allow SSH inbound traffic"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Change to your IP for better security
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_security_group_rule" "db_inbound_rule" {
  type                     = "ingress"
  from_port                = 5432 # Example: PostgreSQL port
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.allow_ssh.id
  description              = "Allow PostgreSQL traffic from VPC"
  security_group_id        = data.aws_security_group.db_server_sg.id
}

# EC2 Instance
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  subnet_id              = data.aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.allow_ssh.id]

  tags = var.tags

  # User data to add all public keys to authorized_keys
  user_data = <<-EOF
              #!/bin/bash
              # Add team SSH keys to ubuntu user
              mkdir -p /home/ubuntu/.ssh
              cat >> /home/ubuntu/.ssh/authorized_keys <<'KEYS'
              ${local.ssh_keys_combined}
              KEYS
              chmod 700 /home/ubuntu/.ssh
              chmod 600 /home/ubuntu/.ssh/authorized_keys
              chown -R ubuntu:ubuntu /home/ubuntu/.ssh

              apt-get update
              apt-get install -y wget gnupg2 lsb-release

              wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
              echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
              
              apt-get update
              apt-get install -y postgresql-client-15
              
              psql --version

              mkdir -p /home/ubuntu/work
              git clone https://github.com/intersective/projecthub.git /home/ubuntu/work/projecthub
              
              EOF
}
