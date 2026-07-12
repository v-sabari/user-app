package com.example.day4;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class BulkActionRequest {

    // ✅ List of user IDs to apply the action to
    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;

    // ✅ Action: ACTIVATE | DEACTIVATE | LOCK | DELETE
    @NotBlank(message = "Action is required")
    private String action;

    public BulkActionRequest() {
    }

    public BulkActionRequest(List<Long> userIds, String action) {
        this.userIds = userIds;
        this.action = action;
    }

    public List<Long> getUserIds() {
        return userIds;
    }

    public void setUserIds(List<Long> userIds) {
        this.userIds = userIds;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}