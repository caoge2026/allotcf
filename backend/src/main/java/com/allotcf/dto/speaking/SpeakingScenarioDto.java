package com.allotcf.dto.speaking;

public class SpeakingScenarioDto {

    private final Long id;
    private final String title;
    private final String category;
    private final String imageUrl;
    private final String prompt;
    private final boolean hasStandardAnswer;

    public SpeakingScenarioDto(
        Long id,
        String title,
        String category,
        String imageUrl,
        String prompt,
        boolean hasStandardAnswer
    ) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.imageUrl = imageUrl;
        this.prompt = prompt;
        this.hasStandardAnswer = hasStandardAnswer;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getPrompt() {
        return prompt;
    }

    public boolean isHasStandardAnswer() {
        return hasStandardAnswer;
    }
}
