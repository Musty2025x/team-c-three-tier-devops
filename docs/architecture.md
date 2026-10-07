# Architecture

```text
Developer
   |
   v
GitHub Pull Request
   |
   v
GitHub Actions
   |-- lint
   |-- tests
   |-- npm audit
   |-- Trivy
   |-- Docker build
   |
   v
Docker Hub
   |
   v
Staging EC2
   |
   |-- Nginx
   |-- React
   |-- Node/Express
   |-- PostgreSQL
   |-- Prometheus
   |-- Grafana
   `-- Alertmanager
   |
   v
Production approval
   |
   v
Production EC2
```

## Design decisions

- Docker Compose is used instead of Kubernetes because the assignment allows a VM and the objective is to demonstrate the complete DevOps lifecycle.
- Git SHA image tags provide immutable deployments.
- Production receives the exact image SHA that passed staging.
- Terraform owns infrastructure.
- Prometheus/Grafana provide application and host visibility.
- Alertmanager provides a single actionable downtime notification.
