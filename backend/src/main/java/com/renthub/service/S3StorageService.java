package com.renthub.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.URI;

@Slf4j
@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String region;
    private final String endpoint;

    public S3StorageService(
            S3Client s3Client,
            @Value("${app.aws.bucket}") String bucketName,
            @Value("${app.aws.region}") String region,
            @Value("${app.aws.endpoint:}") String endpoint
    ) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.region = region;
        this.endpoint = endpoint;
    }

    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("File is null or empty");
            throw new IllegalArgumentException("File cannot be empty");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + "_" + originalFilename;
        
        log.info("Starting S3 upload: fileName={}, bucket={}, region={}", fileName, bucketName, region);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            PutObjectResponse response = s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("S3 upload successful: fileName={}, etag={}", fileName, response.eTag());
            
        } catch (IOException e) {
            log.error("IO error during S3 upload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload image to S3: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during S3 upload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload image to S3: " + e.getMessage(), e);
        }

        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        String imageUrl = endpoint.isBlank()
            ? "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + encodedFileName
            : URI.create(endpoint).toString().replaceAll("/$", "") + "/" + bucketName + "/" + encodedFileName;
        log.info("Generated image URL: {}", imageUrl);
        return imageUrl;

    }

    public List<String> uploadFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            log.warn("No files provided for upload");
            return new ArrayList<>();
        }

        log.info("Uploading {} files to S3", files.length);
        List<String> uploadedUrls = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                try {
                    String url = uploadFile(file);
                    uploadedUrls.add(url);
                    log.info("File uploaded successfully: {}", file.getOriginalFilename());
                } catch (Exception e) {
                    log.error("Failed to upload file {}: {}", file.getOriginalFilename(), e.getMessage());
                    // Continue with other files even if one fails
                }
            }
        }
        
        log.info("Completed batch upload: {} files uploaded out of {}", uploadedUrls.size(), files.length);
        return uploadedUrls;
    }
}
