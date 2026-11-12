# RentHub Dev Infrastructure

This folder contains the Terraform configuration for the dev environment of RentHub image storage.

## What it creates

- S3 bucket for equipment images
- CloudFront distribution to serve the images
- Bucket policy so CloudFront can read objects securely

## Usage

1. Configure AWS credentials in your shell:

   ```bash
   export AWS_ACCESS_KEY_ID=YOUR_KEY
   export AWS_SECRET_ACCESS_KEY=YOUR_SECRET
   export AWS_DEFAULT_REGION=ap-southeast-1
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Review the plan:

   ```bash
   terraform plan
   ```

4. Apply the infrastructure:

   ```bash
   terraform apply
   ```

5. After apply, copy the CloudFront URL from the output and use it as your image base URL in Spring Boot config.

## Notes

This is a dev setup, not production hardened. For production, add:

- WAF
- stricter lifecycle rules
- separate environments
- IAM least-privilege policies
- TLS certificate and custom domain
