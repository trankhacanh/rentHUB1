output "s3_bucket_name" {
  description = "Name of the S3 bucket used for asset storage"
  value       = aws_s3_bucket.assets.bucket
}

output "cloudfront_domain_name" {
  description = "CloudFront domain used to serve uploaded images"
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "cloudfront_url" {
  description = "Public HTTPS URL for the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.assets.domain_name}"
}
