package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.service.MediaUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Autowired
    private MediaUploadService uploadService;

    @PostMapping("/upload")
    public String upload(@RequestParam MultipartFile file) throws IOException {
        return uploadService.uploadAuto(file);
    }
}
