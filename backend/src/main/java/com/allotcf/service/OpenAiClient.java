package com.allotcf.service;

import com.allotcf.entity.AiApiKey;
import com.allotcf.repository.AiApiKeyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class OpenAiClient {

    private static final String RESPONSES_URL = "https://api.openai.com/v1/responses";

    private final AiApiKeyRepository aiApiKeyRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public OpenAiClient(AiApiKeyRepository aiApiKeyRepository, ObjectMapper objectMapper) {
        this.aiApiKeyRepository = aiApiKeyRepository;
        this.objectMapper = objectMapper;
    }

    public String createTextResponse(String prompt, String imageUrl) {
        AiApiKey apiKey = aiApiKeyRepository
            .findFirstByProviderIgnoreCaseAndEnabledTrueOrderByIdDesc("OPENAI")
            .orElseThrow(() -> new IllegalStateException("暂未配置 AI Key，请先由系统管理员录入后再使用看图说话。"));

        try {
            List<Map<String, String>> content = new ArrayList<>();
            content.add(Map.of("type", "input_text", "text", prompt));
            if (imageUrl != null && imageUrl.startsWith("http")) {
                content.add(Map.of("type", "input_image", "image_url", imageUrl, "detail", "low"));
            }

            Map<String, Object> body = Map.of(
                "model", apiKey.getModel(),
                "input", List.of(Map.of("role", "user", "content", content))
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESPONSES_URL))
                .header("Authorization", "Bearer " + apiKey.getApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI 服务调用失败，请检查 API Key 或稍后重试。");
            }

            return extractOutputText(response.body());
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("AI 服务暂时不可用，请稍后重试。", exception);
        }
    }

    private String extractOutputText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode output = root.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (!content.isArray()) {
                    continue;
                }
                for (JsonNode contentItem : content) {
                    String text = contentItem.path("text").asText("");
                    if (!text.isBlank()) {
                        return text;
                    }
                }
            }
        }

        String directText = root.path("output_text").asText("");
        if (!directText.isBlank()) {
            return directText;
        }

        throw new IllegalStateException("AI 服务返回为空，请稍后重试。");
    }
}
