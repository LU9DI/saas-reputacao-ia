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

variable "worker_name" {
  type    = string
  default = "filtra-ai-failover"
}
