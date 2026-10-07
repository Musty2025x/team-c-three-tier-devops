# Setup Checklist

## 1. Fork the repository

Fork the project into your GitHub account and work from your own repository.

## 2. Docker Hub

Create:

- `team-c-backend`
- `team-c-frontend`

Create a Docker Hub access token and save it as `DOCKERHUB_TOKEN`.

## 3. SSH

Generate a dedicated deployment key:

```bash
ssh-keygen -t ed25519 -C "team-c-deploy"
```

Use the public key in Terraform:

```text
ssh_public_key = "ssh-ed25519 ..."
```

Store the private key as the matching GitHub secret.

## 4. AWS

Configure AWS credentials locally for Terraform:

```bash
aws configure
aws sts get-caller-identity
```

Create the S3 state bucket before `terraform init`.

## 5. Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Set:

- AWS region
- allowed SSH CIDR
- SSH public key

Then:

```bash
terraform init
terraform plan
terraform apply
```

## 6. GitHub Environments

Create:

- `staging`
- `production`

Add required reviewers to `production`.

## 7. GitHub secrets

Add:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN

STAGING_HOST
STAGING_SSH_KEY
STAGING_SSH_USER
STAGING_DB_PASSWORD
STAGING_GRAFANA_PASSWORD

PRODUCTION_HOST
PRODUCTION_SSH_KEY
PRODUCTION_SSH_USER
PRODUCTION_DB_PASSWORD
PRODUCTION_GRAFANA_PASSWORD

ALERTMANAGER_WEBHOOK_URL
```

For Ubuntu EC2, the SSH user is normally:

```text
ubuntu
```

## 8. First deployment

Push to `main`.

Expected flow:

```text
CI
 ↓
Docker Hub
 ↓
Staging
 ↓
Health check
 ↓
Production approval
 ↓
Production
```

## 9. Test monitoring

Open:

```text
http://STAGING_IP:3000
http://STAGING_IP:9090
```

Do not expose Grafana/Prometheus to the entire internet. Restrict their security-group ingress to your IP.

## 10. Test rollback

Before the presentation, perform a controlled rollback test and document the exact commands/results.
