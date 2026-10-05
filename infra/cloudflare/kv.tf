resource "cloudflare_workers_kv_namespace" "failover_origin" {
  account_id = var.account_id
  title      = "FAILOVER_ORIGIN"
}

resource "cloudflare_workers_kv" "active_origin" {
  account_id   = var.account_id
  namespace_id = cloudflare_workers_kv_namespace.failover_origin.id
  key_name     = "active_origin"
  value = jsonencode({
    origin      = "primary"
    changedAt   = 0
    reason      = "terraform-initial-state"
    nextProbeAt = 0
  })
}

resource "cloudflare_workers_script" "failover" {
  account_id      = var.account_id
  script_name     = var.worker_name
  content_file    = "${path.module}/worker.js"
  content_sha256  = filesha256("${path.module}/worker.js")
  main_module     = "worker.js"
  compatibility_date = "2026-10-05"

  bindings = [
    {
      type         = "kv_namespace"
      name         = "FAILOVER_ORIGIN"
      namespace_id = cloudflare_workers_kv_namespace.failover_origin.id
    },
    {
      type = "plain_text"
      name = "PRIMARY_ORIGIN"
      text = var.primary_origin
    },
    {
      type = "plain_text"
      name = "RECOVERY_PROBE_INTERVAL_MS"
      text = "300000"
    }
  ]
}

resource "cloudflare_workers_route" "production" {
  zone_id = var.zone_id
  pattern = "filtraai.com/*"
  script  = cloudflare_workers_script.failover.script_name
}
