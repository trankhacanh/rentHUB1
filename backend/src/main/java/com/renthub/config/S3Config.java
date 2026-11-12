package com.renthub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client(
            @Value("${app.aws.region}") String region,
            @Value("${app.aws.endpoint:}") String endpoint,
            @Value("${app.aws.access-key:}") String accessKey,
            @Value("${app.aws.secret-key:}") String secretKey,
            @Value("${app.aws.path-style-access:false}") boolean pathStyleAccess
    ) {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .forcePathStyle(pathStyleAccess);

        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey)));
        } else {
            // Keep the existing AWS credential-chain behavior for real S3.
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        return builder.build();
    }
}
