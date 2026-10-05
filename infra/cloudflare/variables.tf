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
  description = "Current production Vercel origin URL. Required; do not hardcode a deployment URL in Terraform."
}

variable "fallback_origin" {
  type        = string
  description = "Cloudflare fallback origin URL. Required; do not use a placeholder in staging or production."
}

variable "worker_name" {
  type    = string
  default = "filtra-ai-failover"
}
