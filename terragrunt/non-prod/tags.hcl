# Set tags variables. These are automatically pulled in to configure the remote state bucket in the root
# root.hcl configuration.
locals {
  common_tags = {
    Terragrunt = "true"
  }
}
