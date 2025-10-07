---
date: 2025-10-07T07:15:12
---

# Toggling the Laptop Panel in an i3 + Dual Monitor Setup

Sometimes I just want the external monitor and none of the glare, distraction, or pixel waste of the laptop panel. My setup: internal display (eDP) + external over HDMI. Goal: a single keypress that disables (or re‑enables) the laptop screen.

Here’s the small, satisfying solution I landed on.

## The Problem

Manually running `xrandr` commands gets old fast:

- Remember output names
- Type long commands
- Reposition screens when turning the panel back on

## The Commit (Origin Story)

I added a keybinding + script:

```text
feat(i3): add toggle for eDP monitor

Introduce a keybinding and script to toggle the eDP monitor on/off.
```

Files added:

- `~/.config/i3/keybindings/toggle-eDP-monitor.conf`
- `~/scripts/toggle-eDP-monitor.sh`

## The Keybinding

In (or included from) your i3 config:

```conf
bindsym $mod+Shift+m exec --no-startup-id ~/scripts/toggle-eDP-monitor.sh
```

Pick any binding you like; I chose `$mod+Shift+m` ("monitor").

## The Script (Minimal Toggle)

```bash
#!/bin/bash

MON=eDP          # internal panel output name (check with xrandr)
OTHER=HDMI-A-0   # external monitor output name

# Is the internal panel currently active?
if xrandr --listactivemonitors | grep -q "${MON}$"; then
    # Turn it off
    xrandr --output "$MON" --off
else
    # Turn it back on to the left of the external monitor
    xrandr --output "$MON" --auto --left-of "$OTHER"
fi
```

Make it executable:

```bash
chmod +x ~/scripts/toggle-eDP-monitor.sh
```

Reload i3:

```bash
i3-msg reload
```

Then hit your binding to toggle the internal display.

## How It Works

- `xrandr --listactivemonitors` lists only currently active outputs.
- If `eDP` is found → we switch it off.
- If not → we enable it again and place it relative to the external monitor.

## Finding Your Output Names

Names vary across GPUs / drivers:

```bash
xrandr | grep " connected"
```

Common patterns:

- `eDP`, `eDP-1`, `eDP-1-1` → internal panel
- `HDMI-A-0`, `HDMI-1`, `HDMI-0` → HDMI
- `DP-1`, `DisplayPort-0` → DisplayPort

Update the `MON` and `OTHER` variables accordingly.

## Optional Enhancements

1. Auto-detect external instead of hardcoding:

    ```bash
    OTHER=$(xrandr | awk '/ connected primary/ {print $1; exit}')
    [ -z "$OTHER" ] && OTHER=$(xrandr | awk '/ connected/ && !/eDP/ {print $1; exit}')
    ```

2. Preserve workspace layout: After toggling, you might want to move workspaces back with `i3-msg` commands.
3. Add notification feedback:

    ```bash
    notify-send "Display" "Internal panel: $( [ "$STATE" = off ] && echo Disabled || echo Enabled )"
    ```

4. Force DPI/scaling when re‑enabling:

    ```bash
    xrandr --output "$MON" --auto --scale 1x1 --left-of "$OTHER"
    ```

## Edge Cases

- Docking/undocking may rename or reorder outputs.
- Some GPUs expose the panel as inactive until opened (lid state). You can query `loginctl show-session $XDG_SESSION_ID -p Remote -p Active` or `cat /proc/acpi/button/lid/*/state` if needed.
- Compositors (picom) don’t usually care, but some panels flicker once after re‑enable.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Monitor flashes but stays black | Add `--primary` to the external when disabling eDP. |
| Output name not found | Run full `xrandr` without greps to inspect. |
| Workspaces move unpredictably | Use i3's `workspace ... output ...` rules. |
| Toggling from script works manually but not via keybinding | Ensure script is executable & path correct. |

## Takeaway

A 14-line script + one keybinding = frictionless focus. Internal screen disappears when you don’t need it, returns instantly when you do. Zero GUI clicks, no control panel hunting.

Until next hack,
*Reboot Therapy unplugs itself.*
<!-- Example: To add an image here, place it in this directory and use:\n![Screenshot](./screenshot.png)\n-->
