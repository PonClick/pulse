# Pulse - Comprehensive Test Plan

## Test Environment
- **URL:** http://localhost:3200
- **Docker Containers:** pulse, pulse-db, pulse-cron
- **Test Tool:** Playwright MCP

---

## 1. Dashboard Tests

### 1.1 Dashboard Load
- [ ] Navigate to dashboard (`/`)
- [ ] Verify page title is "Pulse - Server Monitor"
- [ ] Verify header shows "Dashboard" heading
- [ ] Verify sidebar navigation is visible
- [ ] Verify "Add Service" button is present
- [ ] Verify "Refresh" button is present

### 1.2 Service Display
- [ ] Verify service cards display correctly
- [ ] Verify service status badge (Operational/Down/Pending)
- [ ] Verify sparkline chart renders
- [ ] Verify response time is shown
- [ ] Verify uptime percentage is shown
- [ ] Verify clicking service card navigates to detail page

### 1.3 Navigation
- [ ] Click "Dashboard" in sidebar - stays on dashboard
- [ ] Click "Alerts" in sidebar - navigates to /alerts
- [ ] Click "Settings" in sidebar - navigates to /settings
- [ ] Click "Pulse" logo - navigates to dashboard

---

## 2. Service Management Tests

### 2.1 Add HTTP Service
- [ ] Click "Add Service" button
- [ ] Verify modal opens
- [ ] Fill in service name: "Test HTTP Service"
- [ ] Select type: HTTP
- [ ] Fill in URL: https://httpstat.us/200
- [ ] Set interval: 60 seconds
- [ ] Set timeout: 10 seconds
- [ ] Click "Add Service" button
- [ ] Verify modal closes
- [ ] Verify new service appears in dashboard

### 2.2 Add TCP Service
- [ ] Click "Add Service" button
- [ ] Fill in service name: "Test TCP Service"
- [ ] Select type: TCP
- [ ] Fill in hostname: google.com
- [ ] Fill in port: 443
- [ ] Click "Add Service"
- [ ] Verify service is created

### 2.3 Add Ping Service
- [ ] Click "Add Service" button
- [ ] Fill in service name: "Test Ping Service"
- [ ] Select type: Ping
- [ ] Fill in hostname: 8.8.8.8
- [ ] Click "Add Service"
- [ ] Verify service is created

### 2.4 Add DNS Service
- [ ] Click "Add Service" button
- [ ] Fill in service name: "Test DNS Service"
- [ ] Select type: DNS
- [ ] Fill in hostname: google.com
- [ ] Select record type: A
- [ ] Click "Add Service"
- [ ] Verify service is created

### 2.5 Add Docker Service
- [ ] Click "Add Service" button
- [ ] Fill in service name: "Test Docker Service"
- [ ] Select type: Docker
- [ ] Fill in container name: pulse-db
- [ ] Fill in Docker host: http://host.docker.internal:2375
- [ ] Click "Add Service"
- [ ] Verify service is created

### 2.6 Add Heartbeat Service
- [ ] Click "Add Service" button
- [ ] Fill in service name: "Test Heartbeat Service"
- [ ] Select type: Heartbeat
- [ ] Click "Add Service"
- [ ] Verify service is created
- [ ] Note heartbeat URL for testing

---

## 3. Service Detail Page Tests

### 3.1 Navigation
- [ ] Click on a service card
- [ ] Verify navigates to /services/[id]
- [ ] Verify back button works

### 3.2 Service Information
- [ ] Verify service name is displayed
- [ ] Verify service type icon is correct
- [ ] Verify status badge is shown
- [ ] Verify URL/hostname is displayed

### 3.3 Statistics Cards
- [ ] Verify "Uptime (24h)" card shows percentage
- [ ] Verify "Avg Response" card shows milliseconds
- [ ] Verify "Check Interval" card shows seconds
- [ ] Verify "Total Checks" card shows count

### 3.4 Response Time Chart
- [ ] Verify chart renders (if data exists)
- [ ] Verify chart shows response times over time

### 3.5 Recent Checks List
- [ ] Verify list shows recent heartbeats
- [ ] Verify each item shows timestamp
- [ ] Verify each item shows response time
- [ ] Verify each item shows status (OK/Failed)

### 3.6 Actions
- [ ] Click "Refresh" button - data refreshes
- [ ] Click "Delete" button (trash icon)
- [ ] Verify confirmation dialog appears
- [ ] Cancel delete - service remains
- [ ] Confirm delete - service is removed, redirects to dashboard

---

## 4. Alerts Page Tests

### 4.1 Page Load
- [ ] Navigate to /alerts
- [ ] Verify "Alerts & Incidents" heading
- [ ] Verify "Refresh" button is present

### 4.2 Active Incidents Section
- [ ] Verify "Active Incidents" section exists
- [ ] If no incidents: shows "All systems operational"
- [ ] If incidents: shows incident cards with service name, duration, cause

### 4.3 Recent Incidents Section
- [ ] Verify "Recent Incidents" section exists
- [ ] If no incidents: shows "No incidents recorded"
- [ ] If incidents: shows resolved incident cards with duration

---

## 5. Settings Page Tests

### 5.1 Page Load
- [ ] Navigate to /settings
- [ ] Verify "Settings" heading
- [ ] Verify "Configure alert channels" description
- [ ] Verify "Add Channel" button is present

### 5.2 Add Webhook Channel
- [ ] Click "Add Channel" button
- [ ] Verify modal opens
- [ ] Fill in name: "Test Webhook"
- [ ] Select type: Webhook
- [ ] Fill in webhook URL: https://webhook.site/test
- [ ] Click "Add Channel"
- [ ] Verify channel appears in list
- [ ] Verify webhook icon is shown
- [ ] Verify "Active" badge is shown

### 5.3 Add Email Channel
- [ ] Click "Add Channel" button
- [ ] Fill in name: "Test Email"
- [ ] Select type: Email
- [ ] Fill in email address: test@example.com
- [ ] Click "Add Channel"
- [ ] Verify channel appears in list

### 5.4 Delete Channel
- [ ] Click delete button on a channel
- [ ] Verify channel is removed from list

---

## 6. Health Check Worker Tests

### 6.1 Manual Trigger
- [ ] Call GET /api/cron/check
- [ ] Verify response shows checked services
- [ ] Verify results include service status and response time

### 6.2 Service Status Updates
- [ ] Add a service that will fail (e.g., https://httpstat.us/500)
- [ ] Trigger health check
- [ ] Verify service shows as "Down"
- [ ] Verify incident is created (check /alerts)

### 6.3 Recovery Detection
- [ ] Update service to working URL
- [ ] Trigger health check
- [ ] Verify service shows as "Up"
- [ ] Verify incident is closed

---

## 7. API Endpoint Tests

### 7.1 Health Endpoint
- [ ] GET /api/health returns {"status":"healthy",...}

### 7.2 Services API
- [ ] GET /api/services - returns list
- [ ] POST /api/services - creates service
- [ ] GET /api/services/[id] - returns service
- [ ] PUT /api/services/[id] - updates service
- [ ] DELETE /api/services/[id] - deletes service

### 7.3 Heartbeats API
- [ ] GET /api/services/[id]/heartbeats - returns heartbeat history

### 7.4 Incidents API
- [ ] GET /api/incidents - returns incidents list

### 7.5 Alert Channels API
- [ ] GET /api/alert-channels - returns channels
- [ ] POST /api/alert-channels - creates channel
- [ ] DELETE /api/alert-channels/[id] - deletes channel

### 7.6 Cron API
- [ ] GET /api/cron/check - triggers health checks

---

## 8. UI Component Tests

### 8.1 Buttons
- [ ] Primary button style (Add Service)
- [ ] Secondary button style (Refresh)
- [ ] Ghost button style (navigation)
- [ ] Danger button style (Delete - red)

### 8.2 Badges
- [ ] Success badge (green - Operational)
- [ ] Error badge (red - Down)
- [ ] Default badge (gray - Pending)

### 8.3 Cards
- [ ] Service card hover effect
- [ ] Stats card layout
- [ ] Modal card styling

### 8.4 Forms
- [ ] Input field focus states
- [ ] Select dropdown functionality
- [ ] Form validation messages

### 8.5 Loading States
- [ ] Dashboard loading spinner
- [ ] Service detail loading spinner
- [ ] Button loading states

---

## 9. Error Handling Tests

### 9.1 404 Page
- [ ] Navigate to non-existent route
- [ ] Verify 404 page displays

### 9.2 Service Not Found
- [ ] Navigate to /services/invalid-uuid
- [ ] Verify error message displays
- [ ] Verify back button works

### 9.3 API Errors
- [ ] Create service with invalid data
- [ ] Verify error message displays

---

## 10. Responsive Design Tests

### 10.1 Desktop View (1920x1080)
- [ ] Sidebar is visible
- [ ] Service grid shows multiple columns

### 10.2 Tablet View (768x1024)
- [ ] Layout adjusts appropriately
- [ ] All content is accessible

### 10.3 Mobile View (375x667)
- [ ] Sidebar collapses
- [ ] Single column layout
- [ ] Touch-friendly buttons

---

## Test Execution Log

| Test | Status | Notes |
|------|--------|-------|
| Dashboard Load | PASSED | Page loads, title correct, all elements visible |
| Service Display | PASSED | Service cards with sparklines, status badges |
| Add HTTP Service | PASSED | Modal works, form validation, service created |
| Service Detail | PASSED | Stats, chart, recent checks all display |
| Alerts Page | PASSED | Active/Recent incidents sections work |
| Settings Page | PASSED | Alert channels list displayed |
| Add Alert Channel | PASSED | Webhook channel created successfully |
| Delete Service | PASSED | Confirmation dialog, service removed |
| Health Check API | PASSED | Returns healthy status |
| Cron Check API | PASSED | Checks services, returns results |

---

## Screenshots Captured

1. `test-01-dashboard.png` - Dashboard with service card
2. `test-02-add-service-modal.png` - Service type selection
3. `test-03-http-form-filled.png` - HTTP form with data
4. `test-04-service-created.png` - New service in dashboard
5. `test-05-service-detail.png` - Service detail page
6. `test-06-alerts-page.png` - Alerts & Incidents page
7. `test-07-settings-page.png` - Settings with channels
8. `test-08-add-channel-modal.png` - Add channel form
9. `test-09-channel-created.png` - Two channels listed
10. `test-10-service-deleted.png` - Dashboard after delete

---

## Issues Found

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| httpstat.us unreachable from container | Low | Known | External service issue, not Pulse bug |
| Chart width warning in console | Low | Cosmetic | Recharts rendering during resize |

---

## Test Summary

- **Total Tests:** 10 core scenarios
- **Passed:** 10
- **Failed:** 0
- **Blocked:** 0

**Test Environment:** Docker (port 3200) + Local Supabase (port 54321)

**Last Updated:** 2025-12-12
