terraform {
  source = "git::https://github.com/intersective/devops-infrastructure-common.git//modules/aws_ec2_bastion/?ref=v0.0.1"
}

include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  region_vars  = read_terragrunt_config(find_in_parent_folders("region.hcl"))
  tags_vars    = read_terragrunt_config(find_in_parent_folders("tags.hcl"))
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  # Read all SSH public keys dynamically
  ssh_keys_combined = join("\n", [
    for pub_file in fileset("${get_terragrunt_dir()}/key", "*.pub") :
    file("${get_terragrunt_dir()}/key/${pub_file}")
  ])

  # Read the base user data script and substitute placeholders
  user_data_template  = file("${get_terragrunt_dir()}/bastion_user_data.sh")
  user_data_with_keys = replace(local.user_data_template, "SSH_KEYS_PLACEHOLDER", local.ssh_keys_combined)
  user_data_with_env  = replace(local.user_data_with_keys, "ENV_CONTENT_PLACEHOLDER", file("${get_terragrunt_dir()}/files/.env"))
  user_data_final     = replace(local.user_data_with_env, "PGPASS_CONTENT_PLACEHOLDER", file("${get_terragrunt_dir()}/files/.pgpass"))
}

inputs = {
  environment                 = local.account_vars.locals.environment
  aws_region                  = local.region_vars.locals.aws_region
  stack_name                  = local.account_vars.locals.stack_name
  tags                        = local.tags_vars.locals.common_tags
  ami_name                    = "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
  ami_owners                  = "099720109477"
  instance_type               = "t2.micro"
  user_data_script            = local.user_data_final
  vpc_name                    = "${local.account_vars.locals.stack_name}-vpc-${local.account_vars.locals.environment}"
  public_subnet_name_wildcard = "*public*"
  db_server_sg_name           = "${local.account_vars.locals.stack_name}-DBServerSecurityGroup-${local.account_vars.locals.environment}"
  bastion_sg_name             = "${local.account_vars.locals.stack_name}-ProjectHubBastion-${local.account_vars.locals.environment}"
  sg_inbound_ports            = [5432]
}
