package com.example.day4;

import java.util.List;

public class BulkActionResult {

    private int successCount;
    private int failedCount;
    private List<String> successEmails;
    private List<String> failedEmails;

    public BulkActionResult() {
    }

    public BulkActionResult(
            int successCount,
            int failedCount,
            List<String> successEmails,
            List<String> failedEmails
    ) {
        this.successCount = successCount;
        this.failedCount = failedCount;
        this.successEmails = successEmails;
        this.failedEmails = failedEmails;
    }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailedCount() { return failedCount; }
    public void setFailedCount(int failedCount) { this.failedCount = failedCount; }

    public List<String> getSuccessEmails() { return successEmails; }
    public void setSuccessEmails(List<String> successEmails) { this.successEmails = successEmails; }

    public List<String> getFailedEmails() { return failedEmails; }
    public void setFailedEmails(List<String> failedEmails) { this.failedEmails = failedEmails; }
}