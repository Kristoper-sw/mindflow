package com.mindflow.common.exception;

public class MindFlowException extends RuntimeException {
    private String code;
    private String message;

    public MindFlowException(String message) {
        super(message);
        this.message = message;
    }

    public MindFlowException(String code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    public MindFlowException(String message, Throwable cause) {
        super(message, cause);
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    @Override
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

