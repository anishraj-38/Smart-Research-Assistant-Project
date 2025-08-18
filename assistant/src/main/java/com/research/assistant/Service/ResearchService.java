package com.research.assistant.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.Objects;

@Service
public class ResearchService {

    @Value("${gemini.api.key}")
    private String apiKey;
    @Value("${gemini.api.url}")
    private final String API_URL = "https://api.openai.com/v1/chat/completions";

    private final WebClient webClient;

    public ResearchService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String processContent(ResearchRequest request) {
        String prompt = buildPrompt(request);
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );
        String response = webClient.post()
                .uri(API_URL,apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        return extractTextFromResponse(response);
    }

    private String extractTextFromResponse(String response){
        try{

        }
        catch (Exception e){
            return "Error Parsing : "+e.getMessage();
        }
    }

    private String buildPrompt(ResearchRequest request){
        StringBuilder prompt = new StringBuilder();
        switch (request.getOperation())
        {
            case "summarize":
                prompt.append("Summarize the following text in a clear and concise way, highlighting only the main points:\n\n");
                break;
            case "suggest":
                prompt.append("Based on Following content : Suggest practical improvements or alternative approaches to strengthen this solution.\n\n");
                break;
            default:
                throw new IllegalArgumentException(("Unknown Operation : " +request.getOperation()));

        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}
