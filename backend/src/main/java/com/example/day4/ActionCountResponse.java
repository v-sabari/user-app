package com.example.day4;

public class ActionCountResponse {

    private String action;
    private long count;

    public ActionCountResponse() {
    }

    public ActionCountResponse(String action, long count) {
        this.action = action;
        this.count = count;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}