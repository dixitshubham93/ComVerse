package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.CommentDto;
import com.projectF.ComVerse.domain.dtos.CreateCommentRequest;
import com.projectF.ComVerse.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping("/create")
    public CommentDto create(@RequestBody CreateCommentRequest request) {
        return commentService.addComment(request);
    }

    @GetMapping("/post/{postId}")
    public List<CommentDto> getComments(@PathVariable Long postId) {
        return commentService.getPostComments(postId);
    }
}
