# Team C Presentation

## Slide 1 — Problem

Manual deployments introduce inconsistent steps, human error and slow feedback.

## Slide 2 — Architecture

Show the GitHub → CI → Docker Hub → EC2 → monitoring flow.

## Slide 3 — CI

Show a pull request and successful:

- lint
- tests
- dependency scan
- Trivy
- Docker build

## Slide 4 — CD

Show merge to main and automatic staging deployment.

## Slide 5 — Production gate

Show the GitHub Environment approval request.

## Slide 6 — Observability

Open Grafana and show:

- CPU
- memory
- request rate
- 5xx error rate
- latency
- backend availability

## Slide 7 — Failure demo

Stop the backend:

```bash
sudo docker compose -f docker-compose.prod.yml stop backend
```

Wait for the alert.

Then restore:

```bash
sudo docker compose -f docker-compose.prod.yml start backend
```

For the stronger rollback demo, deploy a deliberately broken image tag and run the rollback procedure.

## Slide 8 — Lessons

- automation reduces deployment risk
- immutable image tags improve traceability
- security scanning should happen before deployment
- staging protects production
- monitoring turns failures into actionable signals
- rollback must be rehearsed, not just documented
