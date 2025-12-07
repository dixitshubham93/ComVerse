package com.projectF.ComVerse.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class MediaUploadService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "image",
                        "folder", "comverse/images"
                ));
        return uploadResult.get("secure_url").toString();
    }

    public String uploadVideo(MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "video",
                        "folder", "comverse/videos"
                ));
        return uploadResult.get("secure_url").toString();
    }

    // AUTO-DETECT (BEST FOR POSTS)
    public String uploadAuto(MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder", "comverse/media"
                ));
        return uploadResult.get("secure_url").toString();
    }
}
