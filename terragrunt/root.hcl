# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT CONFIGURATION
# Terragrunt is a thin wrapper for Terraform/OpenTofu that provides extra tools for working with multiple modules,
# remote state, and locking: https://github.com/gruntwork-io/terragrunt
# ---------------------------------------------------------------------------------------------------------------------

locals {
  # Automatically load region-level variables
  region_vars  = read_terragrunt_config(find_in_parent_folders("region.hcl"))
  tags_vars    = read_terragrunt_config(find_in_parent_folders("tags.hcl"))
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  # Extract the variables we need for easy access
  environment = local.account_vars.locals.environment
  aws_region  = local.region_vars.locals.aws_region
  common_tags = local.tags_vars.locals.common_tags
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"
  config = {
    encrypt        = true
    bucket         = "${get_env("TG_BUCKET_PREFIX", "")}terragrunt-projecthub-tf-state-${local.environment}-${local.aws_region}"
    key            = "${path_relative_to_include()}/tf.tfstate"
    region         = local.aws_region
    dynamodb_table = "terragrunt-projecthub-tf-locks"
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# GLOBAL PARAMETERS
# These variables apply to all configurations in this subfolder. These are automatically merged into the child
# `terragrunt.hcl` config via the include block.
# ---------------------------------------------------------------------------------------------------------------------

# Configure root level variables that all resources can inherit. This is especially helpful with multi-account configs
# where terraform_remote_state data sources are placed directly into the modules.
inputs = merge(
  local.region_vars.locals,
  local.tags_vars.locals,
  local.account_vars.locals,
)
