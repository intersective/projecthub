# Set account-wide variables. These are automatically pulled in to configure the remote state bucket in the root
# root.hcl configuration.
locals {
  stack_name  = "p2-sandbox"
  environment = "dev"
}
