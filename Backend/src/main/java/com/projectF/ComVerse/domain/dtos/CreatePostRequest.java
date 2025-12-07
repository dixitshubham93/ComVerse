package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.PostType;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreatePostRequest {

    private Long userId;
    private Long roomId;

    private MultipartFile media; // file upload (image/video)
    private PostType type;       // IMAGE or VIDEO
}
