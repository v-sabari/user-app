package com.example.day4;

public class TopActionResponse {

    private String action;
    private Long count;

    public TopActionResponse(String action, Long count) {
        this.action = action;
        this.count = count;
    }

    public String getAction() {
        return action;
    }

    public Long getCount() {
        return count;
    }
}