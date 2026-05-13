package com.allotcf.service;

import com.allotcf.dto.speaking.SpeakingAttemptFeedbackDto;
import com.allotcf.dto.speaking.SpeakingScenarioDto;
import com.allotcf.entity.SpeakingAttempt;
import com.allotcf.entity.SpeakingScenario;
import com.allotcf.entity.User;
import com.allotcf.repository.SpeakingAttemptRepository;
import com.allotcf.repository.SpeakingScenarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpeakingService {

    private final SpeakingScenarioRepository speakingScenarioRepository;
    private final SpeakingAttemptRepository speakingAttemptRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    public SpeakingService(
        SpeakingScenarioRepository speakingScenarioRepository,
        SpeakingAttemptRepository speakingAttemptRepository,
        OpenAiClient openAiClient,
        ObjectMapper objectMapper
    ) {
        this.speakingScenarioRepository = speakingScenarioRepository;
        this.speakingAttemptRepository = speakingAttemptRepository;
        this.openAiClient = openAiClient;
        this.objectMapper = objectMapper;
    }

    public List<SpeakingScenarioDto> listScenarios() {
        return speakingScenarioRepository.findAllByOrderByIdAsc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public String getOrCreateStandardAnswer(Long scenarioId) {
        SpeakingScenario scenario = findScenario(scenarioId);
        if (scenario.getStandardAnswer() != null && !scenario.getStandardAnswer().isBlank()) {
            return scenario.getStandardAnswer();
        }

        String answer = openAiClient.createTextResponse(
            """
            你是 TCF/法语口语教练。请根据场景图片和任务提示，写一段适合 A2-B1 学习者模仿的法语口语参考答案。
            要求：
            1. 只输出法语答案。
            2. 4 到 6 句。
            3. 表达自然、具体，适合口语。
            任务提示：%s
            """.formatted(scenario.getPrompt()),
            scenario.getImageUrl()
        );
        scenario.setStandardAnswer(answer);
        return answer;
    }

    @Transactional
    public SpeakingAttemptFeedbackDto submitAttempt(Long scenarioId, String answer, User user) {
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("请输入你的场景答案");
        }

        SpeakingScenario scenario = findScenario(scenarioId);
        String referenceAnswer = getOrCreateStandardAnswer(scenarioId);
        String aiFeedback = openAiClient.createTextResponse(
            """
            你是 TCF/法语口语评分老师。请对比用户答案和参考答案，给出中文反馈。
            必须返回 JSON，不要使用 Markdown。格式：
            {
              "score": 0-100,
              "summary": "一句中文总结",
              "strengths": ["优点1", "优点2"],
              "improvements": ["改进1", "改进2"],
              "referenceAnswer": "参考答案"
            }
            场景任务：%s
            参考答案：%s
            用户答案：%s
            """.formatted(scenario.getPrompt(), referenceAnswer, answer),
            scenario.getImageUrl()
        );

        SpeakingAttemptFeedbackDto feedback = parseFeedback(aiFeedback, referenceAnswer, null);
        SpeakingAttempt attempt = new SpeakingAttempt();
        attempt.setUser(user);
        attempt.setScenario(scenario);
        attempt.setUserAnswer(answer);
        attempt.setScore(feedback.getScore());
        attempt.setFeedbackJson(aiFeedback);
        SpeakingAttempt savedAttempt = speakingAttemptRepository.save(attempt);

        return parseFeedback(aiFeedback, referenceAnswer, savedAttempt.getId());
    }

    private SpeakingScenario findScenario(Long scenarioId) {
        return speakingScenarioRepository.findById(scenarioId)
            .orElseThrow(() -> new IllegalArgumentException("场景不存在"));
    }

    private SpeakingScenarioDto toDto(SpeakingScenario scenario) {
        boolean hasStandardAnswer = scenario.getStandardAnswer() != null && !scenario.getStandardAnswer().isBlank();
        return new SpeakingScenarioDto(
            scenario.getId(),
            scenario.getTitle(),
            scenario.getCategory(),
            scenario.getImageUrl(),
            scenario.getPrompt(),
            hasStandardAnswer
        );
    }

    private SpeakingAttemptFeedbackDto parseFeedback(String rawJson, String referenceAnswer, Long attemptId) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            int score = Math.max(0, Math.min(100, root.path("score").asInt(0)));
            String summary = root.path("summary").asText("已完成对比，请查看参考答案继续练习。");
            List<String> strengths = readStringArray(root.path("strengths"));
            List<String> improvements = readStringArray(root.path("improvements"));
            String returnedReferenceAnswer = root.path("referenceAnswer").asText(referenceAnswer);

            return new SpeakingAttemptFeedbackDto(
                attemptId,
                score,
                summary,
                strengths,
                improvements,
                returnedReferenceAnswer
            );
        } catch (Exception exception) {
            return new SpeakingAttemptFeedbackDto(
                attemptId,
                0,
                rawJson,
                List.of(),
                List.of("AI 返回格式暂时不稳定，请参考总结内容继续修改。"),
                referenceAnswer
            );
        }
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> {
                String value = item.asText("");
                if (!value.isBlank()) {
                    values.add(value);
                }
            });
        }
        return values;
    }
}
