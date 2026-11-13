package com.renthub.ai.exception;

public class AiProviderUnavailableException extends RuntimeException {

    public AiProviderUnavailableException(Throwable cause) {
        super("The configured AI provider is unavailable.", cause);
    }

    public AiProviderUnavailableException() {
        super("The configured AI provider returned an empty response.");
    }
}
