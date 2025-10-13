output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.bastion.public_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i key/<your-private-key> ubuntu@${aws_instance.bastion.public_ip}"
}
