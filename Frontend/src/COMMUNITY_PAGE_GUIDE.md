# Community Page - Implementation Guide

## Overview
This document describes the new Community Page system with collapsible sidebar, stacked room cards, rocket cursor interactions, and owner dashboard.

## Pages Created

### 1. CommunityPage.tsx
- Main public community page accessible to all members and owners
- Opens when clicking "Open Community" button
- Features:
  - Collapsible sidebar navigation
  - Community banner header
  - 4 stacked room type sections
  - Different views based on user role (Owner vs Member)

### 2. CommunityHandle.tsx
- Owner-only dashboard for community management
- Accessible only to users with "Owner" role
- Features:
  - Room creation/editing/deletion
  - Member management
  - Analytics dashboard
  - Moderation tools
  - Admin menu sidebar

### 3. RoomPage.tsx
- Individual room view
- Opens after rocket cursor animation lands
- Features:
  - Real-time chat interface
  - Participant list sidebar
  - Voice call controls (for voice rooms)
  - Message input with emoji/attachment support

## Components Created

### 1. CommunitySidebar.tsx
- Collapsible icon-only sidebar (64px collapsed, 260px expanded)
- Smooth slide animation (220ms, easeOut)
- Features:
  - Community logo/avatar
  - User info with role badge (when expanded)
  - Navigation menu (Home, Rooms, Members, About, Settings)
  - "Manage Community" button (Owner only)
  - Leave Community option
- Visual: Glassmorphism with Aurora theme

### 2. StackedRoomCards.tsx
- 4 vertical stacks representing room types:
  1. Voice Call
  2. Memes & Posts
  3. General Chat
  4. Announcements
- Each stack shows 3-6 cards layered with offset
- Interactions:
  - Click stack → shuffle animation → expand to full view
  - Non-selected stacks blur (6px) and dim (50% opacity)
  - Expanded view shows all rooms in grid
  - Rocket cursor on room hover/click

## Animations & Timings

### Sidebar
- Slide: 220ms, easeOut
- Fade in/out: 200ms

### Stack Selection
- Shuffle: 360ms, spring easing
- Expand/zoom: 500-700ms, cubic-bezier(0.34, 1.56, 0.64, 1)
- Background blur/dim: 320ms

### Rocket Cursor
- Ignition: 280ms
- Flight path: 420ms, easeOutQuad
- Landing spark: 150-220ms
- Total animation: ~470ms

### Room Entry
- Fade/scale transition: 350-420ms

### Celestial Platform
- Floating motion: 3s ease-in-out infinite loop
- Hover scale: 300ms

## User Roles & Access

### Member
- Can view all public rooms
- Can access: Home, Rooms, Members, About, Settings
- Cannot see "Manage Community" button
- Cannot access Community Handle page

### Admin
- Same as Member
- Additional moderation capabilities (planned)

### Owner
- Full access to all features
- Can see "Manage Community" button in sidebar
- Can access Community Handle dashboard
- Can create/edit/delete rooms
- Can manage members and settings

## Accessibility Features

### Keyboard Navigation
- Tab to focus stacks and room cards
- Enter to select (skips rocket animation)
- Escape to close expanded views
- Arrow keys for navigation

### Reduced Motion
- Set `isMotionReduced` prop to disable animations
- Uses simple fade/scale transitions
- Skips rocket cursor flight
- Skips stack shuffle effects

### Screen Readers
- Proper ARIA labels on all interactive elements
- Role announcements for user status
- Focus management on view changes

### Contrast & Readability
- WCAG AA compliant text contrast
- All text meets 4.5:1 ratio
- Aurora color palette maintained throughout

## Design System

### Colors (Aurora Palette)
- Neon Aurora Green: `#04ad7b`
- Deep Cosmic Teal: `#04372f`
- Bright Aqua Glow: `#28f5cc`
- Cool Gray: `#747c88`
- Dark Space Slate: `#2a3444`

### Glassmorphism Style
```css
background: rgba(4, 55, 47, 0.2);
backdrop-filter: blur(10px);
border: 1px solid rgba(40, 245, 204, 0.2);
```

### Card Sizes
- Stacked card: 320px × 180px (desktop)
- Expanded room card: Responsive grid (1-3 columns)
- Sidebar collapsed: 64px
- Sidebar expanded: 260px

## Integration Points

### From Home Page
- Clicking "Open Community" → CommunityPage (Owner role)
- All existing Home/Space/3D interactions unchanged

### From User Space
- Clicking "Open Community" → CommunityPage (Member role)
- All existing UserSpace interactions unchanged

### Navigation Flow
```
Home → CommunityPage (Owner)
  ├─ Manage Community → CommunityHandle
  ├─ Select Stack → Expanded Rooms
  └─ Click Room → RoomPage

UserSpace → CommunityPage (Member)
  ├─ Select Stack → Expanded Rooms
  └─ Click Room → RoomPage
```

## DO NOT CHANGE
- Home page
- User Space page
- User Profile page
- Community Detail page (kept for backward compatibility)
- Planet interactions
- 3D universe canvas
- Navigation header
- Search functionality
- Aurora background effects

## Testing Checklist

- [ ] Sidebar collapses/expands smoothly
- [ ] Owner sees "Manage Community" button
- [ ] Member does not see "Manage Community" button
- [ ] Stacks shuffle and expand correctly
- [ ] Rocket cursor appears on room hover
- [ ] Rocket animation plays on room click
- [ ] Room page opens after animation
- [ ] Community Handle accessible only to owners
- [ ] Room creation/deletion works
- [ ] Keyboard navigation functional
- [ ] Reduced motion mode works
- [ ] All colors match Aurora palette
- [ ] Responsive design works on mobile

## Future Enhancements
- Real-time member updates
- Voice chat WebRTC integration
- Rich media uploads
- Advanced moderation tools
- Analytics dashboard expansion
- Custom room permissions
- Role-based access control refinements
