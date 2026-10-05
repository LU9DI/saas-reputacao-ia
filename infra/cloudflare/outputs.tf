output "failover_kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.failover_origin.id
}

output "worker_name" {
  value = cloudflare_workers_script.failover.script_name
}

output "route_id" {
  value = cloudflare_workers_route.production.id
}
