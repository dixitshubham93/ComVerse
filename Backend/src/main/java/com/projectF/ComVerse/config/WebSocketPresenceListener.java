package com.projectF.ComVerse.config;

import com.projectF.ComVerse.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener implements ApplicationListener<AbstractSubProtocolEvent> {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onApplicationEvent(AbstractSubProtocolEvent event) {

        if (event instanceof SessionConnectEvent connectEvent) {
            Long userId = extractUserId(connectEvent);
            if (userId != null) {
                presenceService.userConnected(userId);

                broadcastPresenceUpdate(userId, true);
            }
        }

        else if (event instanceof SessionDisconnectEvent disconnectEvent) {
            Long userId = extractUserId(disconnectEvent);
            if (userId != null) {
                presenceService.userDisconnected(userId);

                broadcastPresenceUpdate(userId, false);
            }
        }
    }

    private Long extractUserId(AbstractSubProtocolEvent event) {
        try {
            return Long.valueOf(event.getUser().getName()); // assuming userId = principal name
        } catch (Exception e) {
            return null;
        }
    }

    private void broadcastPresenceUpdate(Long userId, boolean online) {
        messagingTemplate.convertAndSend(
                "/topic/presence",
                new PresenceUpdate(userId, online)
        );
    }

    record PresenceUpdate(Long userId, boolean online) {}
}
