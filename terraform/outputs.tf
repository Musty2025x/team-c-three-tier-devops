output "staging_public_ip" {
  value = aws_instance.app["staging"].public_ip
}

output "production_public_ip" {
  value = aws_instance.app["production"].public_ip
}

output "staging_url" {
  value = "http://${aws_instance.app["staging"].public_ip}"
}

output "production_url" {
  value = "http://${aws_instance.app["production"].public_ip}"
}
