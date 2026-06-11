package com.example.outletmanagement.payload;

public class ApiResponse {
    private int httpStatus;
    private String message;
    private Object data;

    public ApiResponse() {
    }

    public ApiResponse(int httpStatus, String message, Object data) {
        this.httpStatus = httpStatus;
        this.message = message;
        this.data = data;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(int httpStatus) {
        this.httpStatus = httpStatus;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public static ApiResponseBuilder builder() {
        return new ApiResponseBuilder();
    }

    public static class ApiResponseBuilder {
        private int httpStatus;
        private String message;
        private Object data;

        public ApiResponseBuilder httpStatus(int httpStatus) {
            this.httpStatus = httpStatus;
            return this;
        }

        public ApiResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ApiResponseBuilder data(Object data) {
            this.data = data;
            return this;
        }

        public ApiResponse build() {
            return new ApiResponse(httpStatus, message, data);
        }
    }
}
