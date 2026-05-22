package com.example.outletmanagement.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class SpaRedirectController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, HttpServletResponse response) {
        // If it's a 404 Not Found, redirect to SPA index.html
        if (response.getStatus() == 404) {
            String path = (String) request.getAttribute("jakarta.servlet.error.request_uri");
            if (path != null && !path.startsWith("/api") && !path.startsWith("/ws")) {
                response.setStatus(200); // Reset to 200 for SPA routing
                return "forward:/index.html";
            }
        }
        // Otherwise, let default error view handle it (or return empty)
        return null; 
    }
}
