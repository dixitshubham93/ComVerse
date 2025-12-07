package com.projectF.ComVerse.service;


import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    // userId -> number of active WS connections
    private final ConcurrentHashMap<Long, Integer> activeConnections = new ConcurrentHashMap<>();

    // global set of online users
    private final Set<Long> onlineUsers = ConcurrentHashMap.newKeySet();

    public void userConnected(Long userId) {
        activeConnections.merge(userId, 1, Integer::sum);
        onlineUsers.add(userId);
    }

    public void userDisconnected(Long userId) {
        activeConnections.merge(userId, -1, Integer::sum);

        if (activeConnections.get(userId) <= 0) {
            activeConnections.remove(userId);
            onlineUsers.remove(userId);
        }
    }

    public boolean isOnline(Long userId) {
        return onlineUsers.contains(userId);
    }

    public int getTotalOnlineUsers() {
        return onlineUsers.size();
    }

    public Set<Long> getOnlineUsersList() {
        return onlineUsers;
    }
}
