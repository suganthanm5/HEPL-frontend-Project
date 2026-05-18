package com.example.outletmanagement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class SpaRedirectController {

    @RequestMapping(value = {
        "/",
        "/{path:[^\\.]*}",
        "/*/{path:[^\\.]*}",
        "/**/{path:[^\\.]*}"
    })
    public String forward(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Do not forward API endpoints, swagger, or actuator
        if (path.startsWith("/api") || path.startsWith("/swagger") || path.startsWith("/v3/api-docs")) {
            return "forward:/error";
        }
        return "forward:/index.html";
    }
}
