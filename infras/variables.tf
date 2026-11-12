variable "aws_region" {
  description = "AWS region for dev resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "bucket_name" {
  description = "S3 bucket name for equipment images"
  type        = string
  default     = "renthub-dev-assets"
}
