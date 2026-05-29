# VDI (Virtual Desktop Infrastructure) Troubleshooting Workflow

## Overview
This guide covers common VDI issues for Discount Tire store associates. Follow each step carefully before escalating.

---

## Step 1: Identify the Issue
Ask the associate what specific problem they are experiencing:
- Cannot connect to VDI
- VDI session is slow/lagging
- Applications not loading within VDI
- VDI disconnects frequently
- Black screen on VDI login

---

## Step 2: Cannot Connect to VDI

### 2a. Check Network Connectivity
1. Verify the store's internet connection is active (check router lights).
2. Try opening a web browser and navigating to an external site.
3. If no internet: escalate to network team.

### 2b. Check VDI Client
1. Confirm the Citrix Workspace or VMware Horizon client is installed and up to date.
2. Restart the VDI client application.
3. If the client fails to launch: reinstall using the Software Center.

### 2c. Check Credentials
1. Confirm the associate is using their **network credentials** (not store login).
2. Verify CapsLock is off.
3. If locked out: use the Self-Service Password Reset portal or call the Help Desk.

---

## Step 3: VDI Session is Slow

1. Check network bandwidth: run a speed test at the store level.
2. Close unnecessary applications running inside the VDI session.
3. Log off and reconnect: click **Start > Log Off** (do NOT just close the window).
4. If latency > 100ms consistently: document and escalate to network team.

---

## Step 4: Applications Not Loading Inside VDI

1. Check if the specific application is published to the associate's profile.
2. Log off VDI completely and log back in to refresh the profile.
3. Clear the application cache:
   - Navigate to `%AppData%\Local\Temp` within the VDI session
   - Delete temp files older than 7 days
4. If still failing: collect the application name and error message, then escalate.

---

## Step 5: Frequent Disconnections

1. Test network stability: ping 8.8.8.8 continuously for 60 seconds. Any drops indicate network instability.
2. Check for physical cable issues (if wired connection).
3. Switch to a wired connection if on WiFi.
4. If disconnections persist on wired: escalate to network team with ping results.

---

## Step 6: Black Screen on VDI Login

1. Wait 60 seconds — sometimes the profile takes time to load.
2. Press **Ctrl+Alt+Delete** inside the VDI session to refresh.
3. Log off and attempt reconnection.
4. If black screen persists after 3 attempts: escalate to VDI team with associate's username and time of occurrence.

---

## Escalation Criteria
Escalate when:
- Issue persists after all troubleshooting steps
- Network-level issue suspected
- Profile corruption suspected
- Multiple associates affected simultaneously

**Support Group:** VDI Infrastructure Team  
**Priority:** Medium (single user) | High (multiple users)
