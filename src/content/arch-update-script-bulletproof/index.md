---
date: 2025-10-11T14:30:00
tags: arch-linux, bash, automation, system-maintenance, scripting, pacman, yay
---

# 🔄🛡️ Building a Bulletproof Arch Update Script: Because "yay -Syu" Isn't Always Enough

If you've been running Arch Linux for more than a week, you know the drill: `sudo pacman -Syu`, wait, reboot if needed, done. But what about the times when:

- The update hangs and you're not sure if it's frozen or just slow
- You forgot to check if the kernel was updated (spoiler: it was, and now things are weird)
- A systemd service fails silently after an update
- Your package cache grows to consume half your SSD
- You have no idea what actually got updated

This is the story of how I built a comprehensive system update script that handles all of this—and then some.

## The Problem with Manual Updates

For months, I was running updates the "traditional" way:

```bash
sudo pacman -Syu
yay -Sua
sudo pacman -Sc
```

Simple enough, right? Except when:

1. **Updates would hang** with no indication if it was actually working
2. **No logging** meant I couldn't track what changed when things broke
3. **No reboot warnings** for kernel updates led to mysterious issues
4. **Failed services** went unnoticed until something stopped working
5. **Package cache** grew without bounds

I needed something smarter.

## Enter: The Final Update Script

After several iterations (and a few broken systems), I built `updatesystem_final.sh`—a comprehensive Arch Linux update script that actually cares about your system's health.

### Key Features

#### 🔒 Robust Error Handling

- Handles stale pacman lock files automatically
- Timeout protection (no more infinite hangs)
- Graceful failure recovery with detailed logging

#### 📊 Comprehensive Logging

- Every update is logged with timestamps
- Automatic log rotation (keeps logs under 1MB)
- Old logs automatically cleaned up after 30 days

#### 🚨 Critical Package Detection

- Tracks kernel, firmware, and system package updates
- Warns when a reboot is needed
- Distinguishes between "should reboot" and "MUST reboot"

#### 🧹 Intelligent Cache Management

- Uses `paccache` when available (keeps last 2 versions)
- Cleans uninstalled package cache
- Removes temporary download files

#### 🔍 System Health Checks

- Scans for failed systemd services
- Reviews system journal for recent errors
- Provides actionable recommendations

## Breaking Down the Script

### Configuration and Safety

```bash
set -euo pipefail

readonly LOG_DIR="$HOME/logs"
readonly LOG_FILE="$LOG_DIR/system_update.log"
readonly MAX_LOG_SIZE_KB=1024
readonly UPDATE_TIMEOUT=300  # 5 minutes
```

The `set -euo pipefail` is crucial—it makes the script fail fast instead of continuing after errors. The timeout prevents infinite hangs during updates.

### Critical Package Tracking

```bash
readonly CRITICAL_PACKAGES=(
    # Kernel and firmware
    linux linux-lts linux-zen linux-hardened linux-firmware mkinitcpio
    # Core system
    coreutils util-linux filesystem systemd glibc bash pacman sudo
    # Graphics and display
    libglvnd mesa xorg-server xorg-init xorg-xrandr wayland
    # Network
    wpa_supplicant networkmanager openssh
    # Desktop environment
    i3-wm dmenu rofi wezterm fish
    # Boot and drivers
    grub nvidia nvidia-lts amd-ucode intel-ucode
)
```

The script knows which packages are critical. If any of these update, you get a clear warning about whether a reboot is recommended or required.

### Smart Package Update Logging

```bash
log_updates() {
    local manager="$1"
    local output_file="$2"
    local update_count=0
    
    while IFS= read -r line; do
        if [[ $line =~ ([a-zA-Z0-9_.-]+)\ \(([0-9a-z:.-]+)\ \-\>\ ([0-9a-z:.-]+)\) ]]; then
            local pkg="${BASH_REMATCH[1]}"
            local old_ver="${BASH_REMATCH[2]}"
            local new_ver="${BASH_REMATCH[3]}"
            
            log "$(date '+%F %T'), $manager, $pkg, $old_ver -> $new_ver"
            ((update_count++))
            
            ALL_UPDATES+=("$pkg|$old_ver|$new_ver|$manager")
            
            # Check if this is a critical package
            for critical in "${CRITICAL_PACKAGES[@]}"; do
                if [[ $pkg == "$critical" || $pkg == "$critical-"* ]]; then
                    CRITICAL_UPDATES+=("$pkg ($old_ver -> $new_ver)")
                    [[ $pkg == linux* ]] && KERNEL_UPDATED=true
                    break
                fi
            done
        fi
    done < "$output_file"
}
```

This parses the output of `pacman` and `yay`, extracting package names and versions. It builds a complete table of what changed and flags critical updates.

### Automatic Log Rotation

```bash
rotate_logs() {
    if [[ -f "$LOG_FILE" && $(du -k "$LOG_FILE" | cut -f1) -gt $MAX_LOG_SIZE_KB ]]; then
        log "📁 Log file exceeds ${MAX_LOG_SIZE_KB}KB, rotating..."
        
        for i in $(seq $((MAX_LOG_FILES-1)) -1 1); do
            [[ -f "${LOG_FILE}.$i" ]] && mv "${LOG_FILE}.$i" "${LOG_FILE}.$((i+1))"
        done
        
        mv "$LOG_FILE" "${LOG_FILE}.1"
    fi
    
    find "$LOG_DIR" -name "system_update.log.*" -type f -mtime +$MAX_LOG_AGE_DAYS -delete
}
```

Logs don't grow forever. When they exceed 1MB, they rotate. Logs older than 30 days get deleted automatically.

### Handling Stale Locks

```bash
handle_pacman_lock() {
    if [[ -f "/var/lib/pacman/db.lck" ]]; then
        log "🔓 Removing stale pacman lock file..."
        sudo rm -f /var/lib/pacman/db.lck || {
            log "❌ Failed to remove pacman lock file. Manual intervention required."
            return 1
        }
    fi
}
```

We've all seen the dreaded "unable to lock database" error. This checks for and removes stale lock files before attempting updates.

### System Health Checks

```bash
check_failed_services() {
    local failed_services=$(systemctl --failed --no-legend --no-pager 2>/dev/null || true)
    
    if [[ -n "$failed_services" ]]; then
        log "⚠️  Failed systemd services detected:"
        echo "$failed_services" | while IFS= read -r line; do
            log "  ❌ $line"
        done
    else
        log "✅ No failed systemd services detected"
    fi
}
```

After updates, the script checks if any systemd services failed. This catches issues early before they become problems.

### The Update Summary

The script generates a comprehensive summary table:

```bash
📋 DETAILED PACKAGE UPDATES:
Package                        | Old Version          | New Version          | Manager
------------------------------------------------------------------------------------------------
linux                          | 6.10.9-arch1-2       | 6.10.10-arch1-1      | pacman
mesa                           | 24.2.3-1             | 24.2.4-1             | pacman
nvidia                         | 560.35.03-4          | 565.57.01-1          | pacman

🚨 CRITICAL PACKAGE UPDATES DETECTED:
  🔴 linux (6.10.9-arch1-2 -> 6.10.10-arch1-1)
  🔴 nvidia (560.35.03-4 -> 565.57.01-1)

⚠️  KERNEL UPDATE DETECTED!
🔄 A system reboot is STRONGLY RECOMMENDED to apply kernel changes.
```

You know exactly what changed and whether you need to reboot.

## How to Use It

### Installation

```bash
# Create scripts directory if it doesn't exist
mkdir -p ~/scripts

# Download the script
curl -o ~/scripts/updatesystem_final.sh https://raw.githubusercontent.com/yourusername/scripts/main/updatesystem_final.sh

# Make it executable
chmod +x ~/scripts/updatesystem_final.sh

# Optional: Create an alias
echo 'alias update="~/scripts/updatesystem_final.sh"' >> ~/.bashrc
```

### Running Updates

```bash
# Just run it
~/scripts/updatesystem_final.sh

# Or if you set up the alias
update
```

### Checking Logs

```bash
# View recent updates
cat ~/logs/system_update.log

# View rotated logs
cat ~/logs/system_update.log.1

# Search for specific package updates
grep "package-name" ~/logs/system_update.log
```

## The Six-Step Update Process

1. **Update system packages with pacman** - Full system sync with timeout protection
2. **Clean package cache** - Intelligent cache management with paccache
3. **Update AUR packages with yay** - If installed, updates AUR packages
4. **Check systemd service health** - Detects failed services
5. **Check system journal** - Scans for recent critical errors
6. **Generate summary** - Detailed report with reboot recommendations

## Real-World Example Output

```bash
========================================
[1/6] Updating system packages with pacman
========================================
🔄 Running pacman system update (timeout: 300s)...
📦 pacman: 23 packages updated
✅ Pacman update completed successfully

========================================
[2/6] Cleaning package cache
========================================
🧹 Cleaning package cache to free disk space...
📚 Using paccache to keep 2 most recent versions
✅ paccache cleaning completed

========================================
[3/6] Updating AUR packages with yay
========================================
🔄 Running AUR package updates...
📦 yay: 5 packages updated
✅ AUR updates completed successfully

========================================
[4/6] Checking systemd service health
========================================
🔍 Checking for failed systemd services...
✅ No failed systemd services detected

========================================
[5/6] Checking system journal for errors
========================================
🔍 Scanning system journal for recent errors...
✅ No recent critical errors in system journal

========================================
[6/6] Generating update summary
========================================

🎯 UPDATE SUMMARY
==================
📊 Total packages updated: 28
📅 Update completed: 2025-10-11 14:30:45

🚨 CRITICAL PACKAGE UPDATES DETECTED:
  🔴 linux (6.10.9-arch1-2 -> 6.10.10-arch1-1)

⚠️  KERNEL UPDATE DETECTED!
🔄 A system reboot is STRONGLY RECOMMENDED to apply kernel changes.
💡 To reboot now: sudo reboot
```

## Lessons Learned

### 1. Always Log Everything

When something breaks after an update, logs are your best friend. Timestamped entries showing exactly what changed are invaluable.

### 2. Timeouts Save Lives

A hanging update that you can't interrupt is worse than a failed update. The 5-minute timeout has saved me multiple times.

### 3. Critical Package Tracking Matters

Not all updates require a reboot. But when the kernel updates? You want to know immediately.

### 4. Automation Requires Intelligence

A dumb update script that runs `pacman -Syu` in a loop isn't helpful. Smart checks and health monitoring make automation trustworthy.

### 5. Clean Up After Yourself

Log rotation and cache cleaning prevent disk space surprises six months later.

## Future Improvements

Some ideas I'm considering:

- **Email notifications** for critical updates (if running on a server)
- **Backup creation** before major updates
- **Rollback capability** using pacman's package cache
- **Web dashboard** for viewing update history
- **Integration with system monitoring** tools

## The Takeaway

System updates shouldn't be anxiety-inducing. With proper logging, error handling, and health checks, you can confidently keep your Arch system up-to-date without surprises.

Is this overkill for a simple `pacman -Syu`? Maybe. But I'd rather have the information and not need it than need it and not have it.

Plus, there's something deeply satisfying about watching a well-designed script methodically update your system while telling you exactly what it's doing.

Until next time,  
*Reboot Therapy: Where even system updates get therapy.*
