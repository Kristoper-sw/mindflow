package com.mindflow.api.controller;

import com.mindflow.api.dto.LoginRequest;
import com.mindflow.api.dto.LoginResponse;
import com.mindflow.api.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // 简单的认证逻辑，实际应该从数据库验证
        if ("admin".equals(request.getUsername()) && "admin123".equals(request.getPassword())) {
            String token = jwtService.generateToken(request.getUsername());
            return ResponseEntity.ok(new LoginResponse(token, "登录成功"));
        }
        return ResponseEntity.badRequest().body(new LoginResponse(null, "用户名或密码错误"));
    }
}

