---
date: 2025-10-09T10:32:00
tags: screenshots, flameshot, menyoki, i3, i3status, linux, rust
---

# 📸🌪️🌱 Screenshot Chaos: When Flameshot Misbehaves and Menyoki Saves the Day

There's a special kind of frustration that comes from a tool that *almost* works. That was my experience with Flameshot on my dual-monitor i3wm setup.

## The Flameshot Problem

Flameshot is great—until it isn't. On my system, something bizarre was happening: when I tried to capture a screenshot, my second display would partially bleed onto the first screen. The capture overlay was completely confused about where monitors began and ended.

### The Usual Suspects (That Didn't Work)

I found the typical StackOverflow incantations:

```bash
# Try #1: Force Qt platform and disable scaling
bindsym Print exec --no-startup-id env QT_QPA_PLATFORM=xcb QT_AUTO_SCREEN_SCALE_FACTOR=0 QT_SCALE_FACTOR=1 flameshot gui

# Try #2: Add GL integration workaround
bindsym Print exec --no-startup-id env \
  QT_AUTO_SCREEN_SCALE_FACTOR=0 \
  QT_SCALE_FACTOR=1 \
  QT_QPA_PLATFORM=xcb \
  QT_XCB_GL_INTEGRATION=none \
  flameshot gui
```

I even tried forcing consistent DPI in my i3 config:

```bash
exec_always --no-startup-id xrandr --dpi 96
```

**Result?** None of it worked on my machine. Classic.

## Enter Menyoki: The Rust Alternative

After enough frustration, I decided to try something different: [Menyoki](https://github.com/orhun/menyoki), a screenshot and screen recording tool written in Rust by [Orhun](https://github.com/orhun).

**What is Menyoki?**  
It's a lightweight, command-line focused screenshot and GIF recording tool that respects your terminal workflow. No GUI bloat, no Qt confusion—just straightforward capture commands that work.

### Setting It Up

First, I needed [slop](https://github.com/naelstrof/slop) for region selection (because clicking and dragging to select an area is non-negotiable):

```bash
sudo pacman -S slop  # or your distro's equivalent
sudo pacman -S menyoki
```

### My i3 Keybindings

I set up four capture modes in my i3 config:

```bash
# Capture the focused window
bindsym Shift+Print exec --no-startup-id menyoki capture -f

# Capture a selected region (uses slop)
bindsym Ctrl+Print exec --no-startup-id menyoki capture --root --size $(slop)

# Capture focused window and copy to clipboard
bindsym $mod+Shift+Print exec --no-startup-id bash -c 'menyoki capture -f && xclip -selection clipboard -t image/png -i ~/menyoki/cap.png'

# Capture selected region and copy to clipboard
bindsym $mod+Ctrl+Print exec --no-startup-id bash -c 'menyoki capture --root --size $(slop) && xclip -selection clipboard -t image/png -i ~/menyoki/cap.png'
```

**The workflow:**

- `Shift+Print`: Quick window capture
- `Ctrl+Print`: Select a region
- `$mod+Shift+Print`: Window to clipboard
- `$mod+Ctrl+Print`: Region to clipboard

No display confusion. No Qt quirks. It just works.

## Plot Twist: The Clipboard Status Script

Of course, nothing is ever *completely* smooth. My i3status clipboard indicator started throwing errors when images were copied to the clipboard.

### The Original Script (That Broke)

```bash
#!/bin/bash

while true; do
    clip=$(xclip -o -selection clipboard 2>/dev/null)

    maxlen=40
    if [[ -z "$clip" ]]; then
        echo "📋" > /tmp/clipboard_status
    else
        if (( ${#clip} > maxlen )); then
            clip="${clip:0:maxlen}..."
        fi

        clip="${clip//$'\n'/}"
        echo "📋 $clip" > "/tmp/clipboard_status"
    fi
    sleep 2
done
```

This worked fine for text, but choked on binary data (like PNG images).

### The Refactored Version

I rewrote it to detect clipboard content types:

```bash
#!/bin/bash
# filepath: /home/bedawang/.config/i3/scripts/i3status-clipboard.sh

readonly STATUS_FILE="/tmp/clipboard_status"
readonly MAX_LENGTH=40
readonly SLEEP_INTERVAL=2

get_clipboard_status() {
    local targets=$(xclip -selection clipboard -t TARGETS -o 2>/dev/null)
    
    case "$targets" in
        *image*) echo "📋 🖼️" ;;
        *application*) echo "📋 📎" ;;
        *)
            local clip=$(xclip -o -selection clipboard 2>/dev/null)
            [[ -z "$clip" ]] && echo "📋" && return
            
            clip="${clip//$'\n'/ }"
            echo "📋 ${clip:0:$MAX_LENGTH}$([[ ${#clip} -gt $MAX_LENGTH ]] && echo "...")"
            ;;
    esac
}

while get_clipboard_status > "$STATUS_FILE"; do sleep "$SLEEP_INTERVAL"; done
```

**What changed:**

- Checks `TARGETS` to identify content type (image, application, text)
- Shows 🖼️ for images, 📎 for files
- No more errors when binary data hits the clipboard
- Cleaner code with `readonly` constants and a proper function

## The Result

Now I have:

- ✅ Screenshot capturing that respects monitor boundaries
- ✅ Four different capture modes for different workflows
- ✅ Clipboard integration that doesn't crash
- ✅ A status indicator that knows what's on the clipboard

Sometimes the solution isn't fixing the tool—it's finding a better one.

---

**Lessons Learned:**

1. Qt environment variables are a dark art
2. Rust tools often "just work" where legacy tools struggle
3. Always handle binary data gracefully in your scripts
4. `slop` is the unsung hero of region selection

## The Takeaway

Sometimes the fix isn't wrestling with environment variables and Qt quirks—it's admitting defeat and switching to a tool that just works. Menyoki respects my dual monitors, my clipboard doesn't crash, and my i3 keybindings and scripts are cleaner than ever.

Until next time,  
*Reboot Therapy: Where Ctrl+C Ctrl+V actually works.*
