locals {
  ssh_keys = [
    for f in fileset("${path.module}/key", "*.pub") :
    file("${path.module}/key/${f}")
  ]
  ssh_keys_combined = join("\n", local.ssh_keys)
}