# Deployment Failure Runbook

## Symptoms

- GitHub deployment job failed
- `/api/health` returns 5xx
- Grafana shows backend down
- Alertmanager reports `APIHealthDown`

## Triage

```bash
cd /opt/team-c
sudo docker compose -f docker-compose.prod.yml ps
sudo docker compose -f docker-compose.prod.yml logs --tail=100 backend
sudo docker compose -f docker-compose.prod.yml logs --tail=100 postgres
curl -i http://127.0.0.1/api/health
df -h
free -m
```

## Rollback

```bash
cd /opt/team-c
sudo ./scripts/rollback.sh
```

## Verify

```bash
curl -f http://127.0.0.1/api/health
sudo docker compose -f docker-compose.prod.yml ps
```

## Escalation checklist

1. Identify the failing Git SHA.
2. Check CI and Trivy results.
3. Check backend logs.
4. Check database health.
5. Roll back.
6. Open a bug/incident ticket.
7. Fix on a branch.
8. Re-run CI and staging before production.
