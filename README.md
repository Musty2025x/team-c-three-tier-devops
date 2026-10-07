# Team C — Three-Tier Containerized App with Full CI/CD

A recruiter-ready DevOps project that takes a small React + Node/Express + PostgreSQL application from source code to AWS EC2 with automated CI/CD, security scanning, staging/production promotion, monitoring, alerting and rollback.

## Open-source application base

The application follows the architecture of the open-source project [dockerized-multi-service-app](https://github.com/Hacker3S/dockerized-multi-service-app), which demonstrates a React frontend, Node.js backend, PostgreSQL database and Nginx reverse proxy. This repository keeps the application intentionally small so the focus remains on the DevOps work.

## Architecture

```text
                         GitHub
                           |
                    Pull Request / Push
                           |
                           v
                 +---------------------+
                 |   GitHub Actions    |
                 |---------------------|
                 | Lint + Tests        |
                 | npm audit           |
                 | Trivy FS/Image scan |
                 | Docker build/push   |
                 +----------+----------+
                            |
                            v
                       Docker Hub
                            |
                    merge to main
                            |
                            v
                 +---------------------+
                 |    STAGING EC2      |
                 |---------------------|
                 | Nginx               |
                 | React frontend      |
                 | Node API            |
                 | PostgreSQL          |
                 | Prometheus          |
                 | Grafana             |
                 | Alertmanager        |
                 +----------+----------+
                            |
                     GitHub approval
                            |
                            v
                 +---------------------+
                 |  PRODUCTION EC2     |
                 |---------------------|
                 | Nginx               |
                 | React frontend      |
                 | Node API            |
                 | PostgreSQL          |
                 | Prometheus          |
                 | Grafana             |
                 | Alertmanager        |
                 +----------+----------+
                            |
                            v
                     Discord / Slack
```

## Repository structure

```text
.
├── frontend/                     # React/Vite UI
├── backend/                      # Express API + Prometheus metrics
├── database/                     # PostgreSQL initialization
├── nginx/                        # Reverse proxy
├── monitoring/
│   ├── prometheus/
│   ├── alertmanager/
│   └── grafana/
├── scripts/
│   ├── deploy.sh
│   ├── rollback.sh
│   └── health-check.sh
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── user_data.sh.tftpl
│   └── backend.tf.example
├── .github/workflows/
│   ├── ci.yml
│   ├── staging.yml
│   └── production.yml
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Prerequisites

- AWS account
- Terraform >= 1.6
- Docker Desktop
- GitHub repository
- Docker Hub account
- SSH key pair for the EC2 instances
- Discord or Slack webhook for alerting

## Local development

```bash
cp .env.example .env
docker compose up --build
```

Open:

- App: http://localhost
- API health: http://localhost/api/health
- Metrics: http://localhost/api/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

Default local Grafana credentials:

```text
admin / admin
```

Change these for anything beyond local development.

## CI/CD flow

### Pull request

Every PR runs:

1. Backend lint
2. Frontend lint
3. Backend unit tests
4. Frontend build
5. Dependency vulnerability check
6. Docker image builds
7. Trivy filesystem scan
8. Trivy image scan

### Merge to main

A merge to `main`:

1. Builds the application images.
2. Pushes immutable Git-SHA tags to Docker Hub.
3. Deploys automatically to staging.
4. Runs a staging health check.
5. Waits for GitHub Environment approval.
6. Deploys the exact same image tags to production.

No manual SSH deployment is required.

## GitHub configuration

Create these repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN

STAGING_HOST
STAGING_SSH_KEY
STAGING_SSH_USER

PRODUCTION_HOST
PRODUCTION_SSH_KEY
PRODUCTION_SSH_USER

STAGING_DB_PASSWORD
STAGING_GRAFANA_PASSWORD
PRODUCTION_DB_PASSWORD
PRODUCTION_GRAFANA_PASSWORD
ALERTMANAGER_WEBHOOK_URL
```

Recommended GitHub Environments:

### staging

No required reviewers.

### production

Add one or more required reviewers under:

`Settings → Environments → production`

This creates the manual production approval gate.

## Docker Hub

Create repositories:

```text
<dockerhub-user>/team-c-frontend
<dockerhub-user>/team-c-backend
```

The workflows use:

```text
<dockerhub-user>/team-c-frontend:<git-sha>
<dockerhub-user>/team-c-backend:<git-sha>
```

Using the Git SHA makes rollback deterministic.

## AWS infrastructure

Terraform provisions:

- VPC
- Public subnet
- Internet gateway
- Route table
- Security group
- Staging EC2
- Production EC2
- IAM instance role/profile
- CloudWatch permissions
- User-data bootstrap

For a classroom/demo deployment, the default instance type is `t3.micro`. Check the current AWS Free Tier eligibility for your account/region before creating resources.

### Remote state

Create an S3 bucket first and use `terraform/backend.tf.example` as the starting point for the backend configuration.

Example:

```hcl
terraform {
  backend "s3" {
    bucket = "YOUR-UNIQUE-TERRAFORM-STATE-BUCKET"
    key    = "team-c/terraform.tfstate"
    region = "eu-west-1"
    encrypt = true
  }
}
```

Do not commit Terraform state or AWS credentials.

## Terraform

```bash
cd terraform

terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Get outputs:

```bash
terraform output
```

Destroy when finished:

```bash
terraform destroy
```

## Deployment

The deployment workflow copies the production compose files and environment file to EC2, then executes:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

The server stores the previous image tags in:

```text
/opt/team-c/releases/
```

This gives the project a simple, auditable rollback mechanism.

## Rollback

SSH to the affected server only for emergency investigation. Normal deployment is automated.

```bash
cd /opt/team-c
./rollback.sh
```

The script reads the last known-good release and redeploys those image tags.

## Monitoring

Prometheus scrapes:

- API request count
- API error count
- API request duration
- Node exporter CPU/memory/disk/network
- Prometheus itself

Grafana provides:

- CPU usage
- Memory usage
- Request rate
- Error rate
- API latency

Alertmanager sends a notification when:

```text
APIHealthDown
```

is firing.

## Failure demo

For the presentation:

1. Deploy a known-bad backend image to staging or production.
2. API health check fails.
3. Prometheus detects the failure.
4. Alertmanager sends Discord/Slack notification.
5. Run the rollback script.
6. Verify `/api/health` returns HTTP 200.
7. Show the dashboard recovering.

## Runbook — deployment failure

### 1. Check deployment

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 nginx
```

### 2. Check health

```bash
curl -f http://localhost/api/health
```

### 3. Check the image

```bash
docker images
docker inspect team-c-backend
```

### 4. Roll back

```bash
cd /opt/team-c
./rollback.sh
```

### 5. Verify

```bash
curl -f http://localhost/api/health
docker compose ps
```

### 6. Investigate before redeploying

Check:

- GitHub Actions logs
- Trivy findings
- container logs
- environment variables
- database connectivity
- disk space
- memory pressure
- Grafana/Prometheus

## 15–20 minute presentation

### 1. Problem — 2 minutes

Manual deployments are slow, inconsistent and easy to break.

### 2. Architecture — 3 minutes

Explain GitHub → CI → Docker Hub → staging → approval → production → monitoring.

### 3. Live demo — 7 minutes

Make a small UI change:

```text
git checkout -b feature/demo-change
git add .
git commit -m "feat: update dashboard message"
git push
```

Open the PR and show CI.

Merge it and show automatic staging deployment.

Approve production and show the same image SHA running in production.

Open Grafana.

### 4. Failure demo — 3 minutes

Break the backend.

Show:

```text
API DOWN
   ↓
Prometheus
   ↓
Alertmanager
   ↓
Discord/Slack
   ↓
Rollback
   ↓
API HEALTHY
```

### 5. Lessons — 3 minutes

Discuss:

- immutable image tags
- automated tests
- DevSecOps
- infrastructure as code
- environment promotion
- observability
- rollback
- secrets management

### 6. Q&A

## Portfolio talking points

Use these points on your CV/LinkedIn only after you have actually deployed and tested them:

- Built an end-to-end GitHub Actions CI/CD pipeline for a containerized three-tier application.
- Provisioned AWS infrastructure with Terraform and remote state in S3.
- Implemented Docker image vulnerability scanning with Trivy and dependency checks.
- Automated staging deployment and gated production promotion using GitHub Environments.
- Implemented Prometheus/Grafana observability for infrastructure and application metrics.
- Configured Alertmanager notifications for application downtime.
- Implemented Git-SHA image versioning and automated rollback to the last known-good release.

## Cleanup

Always destroy the infrastructure after a training/demo session if you do not need it running:

```bash
cd terraform
terraform destroy
```
