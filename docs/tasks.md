# Repository Audit Tasks

This backlog cross-checks the repository against the supplied project brief.
Checked items are present in the repository; unchecked items are actionable
gaps or improvements.

## Brief Coverage

- [x] Containerized frontend and API, PostgreSQL service, and local Docker
  Compose setup are present. PostgreSQL uses the upstream image and
  `database/init.sql` rather than a custom database Dockerfile.
- [x] GitHub Actions runs linting, backend tests, dependency audits, Trivy
  filesystem/image scans, and image builds on pull requests. Successful pushes
  to `main` publish Git-SHA-tagged images to Docker Hub.
- [x] Terraform provisions AWS EC2 environments and configures an S3 remote
  state backend.
- [x] Successful `main` CI runs trigger staging deployment. Production has a
  manually dispatched workflow with a `production` environment approval gate
  when required reviewers are configured.
- [x] Prometheus and Grafana configuration includes CPU, memory, request-rate,
  and 5xx-rate dashboard panels; a backend-down alert is routed to Slack.
- [x] README, architecture, setup checklist, deployment-failure runbook, and
  presentation outline are present.
- [ ] See tasks below for quality gaps, workflow mismatches, missing proof, and
  improvements needed to make the brief's end-to-end demo dependable.

## P0 - Deployment Blockers

- [ ] **TASK-01: Reconcile deployment secret names.** Workflows use
  `STAGING_USER`, `PRODUCTION_USER`, and `GRAFANA_ADMIN_PASSWORD`, while the
  README and setup checklist document `STAGING_SSH_USER`,
  `PRODUCTION_SSH_USER`, and `STAGING_GRAFANA_PASSWORD`. Choose canonical names,
  update workflow references and setup docs together, and add a preflight check
  that reports missing required secrets without printing values.
  Evidence: `.github/workflows/staging.yml`,
  `.github/workflows/production.yml`, `README.md`, `docs/setup-checklist.md`.

- [ ] **TASK-02: Make production release files complete.** Production Compose
  mounts `./nginx/nginx.conf`, but the production workflow only copies
  `docker-compose.prod.yml` into the release directory. Package and transfer
  the Nginx config (and any other required runtime config) with the Compose
  file, then validate the mounted file and run a production-like Compose config
  check before deployment.
  Evidence: `docker-compose.prod.yml`, `.github/workflows/production.yml`.

- [ ] **TASK-03: Repair rollback release discovery.** `rollback.sh` searches
  `releases/*.env`, while deployments store environment files at
  `releases/<image-tag>/.env`; as written, the script will not find those
  releases. Define how the active and previous release are recorded, update
  rollback to select the previous successful release, and test rollback plus
  health verification.
  Evidence: `scripts/rollback.sh`, `.github/workflows/staging.yml`,
  `.github/workflows/production.yml`.

## P1 - Security and Reliability

- [ ] **TASK-04: Remove hard-coded database credentials.** The local, staging,
  and production Compose definitions use the same `teamc` password in
  `POSTGRES_PASSWORD` and `DATABASE_URL`. Supply credentials through required
  environment/secrets, keep local-only defaults out of production, and ensure
  the production deployment provisions the matching database URL securely.
  Evidence: `docker-compose.yml`, `docker-compose.prod.yml`,
  `deploy/staging/docker-compose.yml`.

- [ ] **TASK-05: Replace the placeholder backend test with behavioral tests.**
  The current test asserts properties of a locally constructed object and
  never starts the Express app or exercises the database. Add tests for health
  success/failure and task create/list/update/delete behavior, including invalid
  input and missing IDs, using an isolated test database or a controlled pool.
  Evidence: `backend/test/server.test.js`, `backend/src/server.js`.

- [ ] **TASK-06: Add API input and error handling.** Validate that task titles
  are strings of an allowed length and validate task IDs before querying.
  Return consistent client errors for invalid input and controlled server
  errors for database failures, with tests for each response.
  Evidence: `backend/src/server.js`.

- [ ] **TASK-07: Add deployment rollback protection.** Production currently
  waits a fixed 20 seconds and checks the backend only after bringing up the
  new release; it does not restore the previous known-good release on a failed
  check. Add readiness-based verification, preserve the last successful
  release, and automatically roll back on failed health checks.
  Evidence: `.github/workflows/production.yml`, `scripts/rollback.sh`.

- [ ] **TASK-08: Promote only a staging-verified image.** Production accepts
  any manually entered image tag and does not verify that the tag passed CI and
  staging. Record the successful staging artifact and constrain production
  deployment to that immutable tag, while retaining the required manual
  approval gate.
  Evidence: `.github/workflows/staging.yml`,
  `.github/workflows/production.yml`.

- [ ] **TASK-09: Validate cloud-init and remote deployment as one contract.**
  Terraform user data creates the `deployer` account and grants Docker access,
  while staging also assumes passwordless sudo and a particular SSH account.
  Document and test the exact provisioned-user/sudo contract for both
  environments so a fresh instance can deploy without manual repair.
  Evidence: `terraform/user_data.sh.tftpl`, `.github/workflows/staging.yml`,
  `.github/workflows/production.yml`, `docs/setup-checklist.md`.

## P2 - CI, Infrastructure, and Documentation

- [ ] **TASK-10: Make Terraform backend setup portable.** The S3 backend
  hard-codes a bucket name and region, while setup documentation instructs
  users to copy `terraform.tfvars.example` and the README describes
  `backend.tf.example`; neither example file exists in the repository. Add
  accurate backend/bootstrap instructions and safe example configuration, and
  verify a clean `terraform init`/`plan` workflow.
  Evidence: `terraform/backend.tf`, `docs/setup-checklist.md`, `README.md`.

- [ ] **TASK-11: Reconcile deployment documentation with implementation.**
  Update the README architecture, CI/CD sequence, required secrets, local
  environment setup, and Terraform instructions to match current workflow names
  and actual Compose/deployment behavior. Remove references to nonexistent
  example files or add the referenced files.
  Evidence: `README.md`, `docs/architecture.md`, `docs/setup-checklist.md`.

- [ ] **TASK-12: Add automated deployment configuration checks.** CI currently
  lints/tests the app and builds/scans images, but does not validate Compose,
  Terraform formatting/validation, Prometheus rules, or Alertmanager config.
  Add non-deploying checks for these configuration files and run them on pull
  requests.
  Evidence: `.github/workflows/ci.yml`, Compose, Terraform, and monitoring
  configuration files.

- [ ] **TASK-13: Pin workflow actions and define update policy.** Third-party
  workflow actions are referenced by movable version tags. Pin actions to
  immutable commit SHAs, retain readable version comments, and document a
  routine update process.
  Evidence: `.github/workflows/ci.yml`, `.github/workflows/staging.yml`,
  `.github/workflows/production.yml`.

- [ ] **TASK-14: Document the image publication boundary.** Pull requests
  build and scan images but do not publish them; successful pushes to `main`
  publish Git-SHA tags. Document this trust boundary in the README and
  presentation, and verify the demo uses the published SHA rather than a
  mutable tag.
  Evidence: `.github/workflows/ci.yml`, `README.md`,
  `docs/presentation.md`.

- [ ] **TASK-15: Add frontend test coverage.** The frontend package has no test
  script or test suite, despite the brief requiring tests in CI. Add focused
  tests for task loading, creation, completion, deletion, and API failure
  states, and run them on pull requests.
  Evidence: `frontend/package.json`, `frontend/src/main.jsx`,
  `.github/workflows/ci.yml`.

- [ ] **TASK-16: Verify and document use of an existing sample app.** The
  README says the project follows the architecture of an open-source sample,
  but does not identify reused application code or explain its adaptation.
  Document the upstream project, license, and adapted components, and confirm
  the application is based on an existing sample as required (rather than
  presenting a newly authored demo app as the sample).
  Evidence: `README.md`, `frontend/src/main.jsx`, `backend/src/server.js`,
  `LICENSE`.

- [ ] **TASK-17: Exercise the required failure and rollback demo.** Add a
  repeatable staging exercise that causes an observable outage, confirms the
  Slack alert, performs rollback, and verifies recovery. Record commands and
  expected results in the runbook/presentation notes.
  Evidence: `docs/runbook.md`, `docs/presentation.md`,
  `docs/setup-checklist.md`, `scripts/rollback.sh`.

- [ ] **TASK-18: Establish one source of truth for alert rules.** The active
  Prometheus alert file defines backend, Prometheus, Alertmanager, and error
  rate alerts, while a second file under Terraform contains only the error-rate
  rule. Remove the unused copy or generate both from one maintained source and
  add a consistency check.
  Evidence: `monitoring/prometheus/alerts.yml`,
  `terraform/monitoring/prometheus/alerts.yml`.

- [ ] **TASK-19: Plan the presentation to the required duration.** Add timings
  for the brief's six presentation sections and confirm the complete demo fits
  the 15–20 minute target, including the live deploy and failure/rollback
  walkthrough.
  Evidence: `docs/presentation.md` and the supplied project brief.

- [ ] **TASK-20: Reconcile production monitoring claims.** The architecture
  documentation describes Prometheus, Grafana, and Alertmanager on production,
  but `docker-compose.prod.yml` deploys only the application and database.
  Either deploy and verify production monitoring or explicitly scope monitoring
  to staging and update architecture docs and unused security-group rules.
  Evidence: `README.md`, `docs/architecture.md`,
  `docker-compose.prod.yml`, `terraform/main.tf`.