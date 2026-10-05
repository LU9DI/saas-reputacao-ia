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
  type    = string
  default = "https://saas-reputacao-q0poey5um-lu9di.vercel.app"
}

variable "fallback_origin" {
  type    = string
  default = "https://filtra-ai-fallback.example.workers.dev"
}

variable "worker_name" {
  type    = string
  default = "filtra-ai-failover"
}
