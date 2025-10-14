terraform {
  backend "s3" {
    bucket = "dev-projecthub-infra-state"
    key    = "projecthub-bastion.tfstate"
    region = "ap-southeast-2"
  }
}