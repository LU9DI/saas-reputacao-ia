variable "account_id" {
  type = string
}

variable "zone_id" {
  type = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "primary_origin" {
  type        = string
  description = "Current production Vercel origin URL. Required."
}

variable "vercel_webhook_secret" {
  type        = string
  sensitive   = true
  description = "Vercel Spend Management webhook signing secret."
}

variable "failover_monitor_secret" {
  type        = string
  sensitive   = true
  description = "Signing secret for the internal 90 percent monitor."
}

variable "worker_name" {
  type    = string
  default = "filtra-ai-failover"
}
