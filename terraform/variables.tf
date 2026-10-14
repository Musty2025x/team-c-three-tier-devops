variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "team-c-three-tier"
}

variable "instance_types" {
  description = "EC2 instance type per environment"
  type        = map(string)

  default = {
    staging    = "t3.medium"
    production = "t3.micro"
  }
}

variable "public_key_location" {
  description = "Path to the public SSH key file"
  type        = string
}

variable "private_key_location" {
  description = "Path to the private SSH key file"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to EC2"
  type        = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.30.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.30.1.0/24"
}

variable "environment" {
  type    = string
  default = "team-c"
}