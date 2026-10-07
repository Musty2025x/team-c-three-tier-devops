terraform {
  backend "s3" {
    bucket  = "team-c-s3-strorage-bucket"
    key     = "team-c/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
