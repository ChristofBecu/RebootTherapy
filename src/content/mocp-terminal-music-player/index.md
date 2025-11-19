---
date: 2025-11-19T16:30:25
tags: linux, apps, survival, productivity, terminal, music, audio
---

# 🎶 Mocp — The Terminal Music Player That Knows My Soul

**[Mocp](https://github.com/jonsafari/mocp?tab=readme-ov-file)** is my refuge when the world gets too bright, too loud, or too GUI.  
It launches instantly, never crashes.
Playlists? Instant. Controls? Muscle memory. Interface? Pure ASCII therapy.  
It’s the kind of music player that doesn’t just play songs — it stabilizes my entire command-line existence.

Even better: with a tiny custom script, my i3status bar finally updates reliably again. No more wrestling with **spotifycli**, which kept ghosting dunst and **spotify** eating RAM for breakfast anyway.

You can inspect the full configuration in all its minimal glory  👉 [right here](https://github.com/ChristofBecu/yadm-dotfiles/commit/04469a832697664a3868085b0599fbeb104477a8)

The core of it is a simple bash script that monitors mocp’s state and writes the relevant info to a log file that i3status reads from:

```bash
#!/usr/bin/env bash

logfile=~/logs/mocp.log

format_output() {
    local artist="$1"
    local song="$2"
    local current="$3"
    local left="$4"
    local icon="$5"
    echo "${artist} - ${song} [${current}/-${left}]${icon}"
}

while true; do
    if ! pgrep -x "mocp" > /dev/null; then
        echo " MOCP  ✖ " > "$logfile"
    else
        state=$(mocp -Q %state 2>/dev/null)
        case "$state" in
            PLAY)
                icon="   ▶ "
                ;;
            PAUSE)
                icon="  ▮▮ "
                ;;
            *)
                echo " MOCP  ✖ " > "$logfile"
                sleep 1
                continue
                ;;
        esac
        artist=$(mocp -Q %artist 2>/dev/null)
        song=$(mocp -Q %song 2>/dev/null)
        current=$(mocp -Q %ct 2>/dev/null)
        left=$(mocp -Q %tl 2>/dev/null)
        format_output "$artist" "$song" "$current" "$left" "$icon" > "$logfile"
    fi
    sleep 1
done
```

And yes — the corresponding systemd service is stupidly simple as running the mocp-monitor script on startup:

```bash
# .config/systemd/user/mocp-monitor.service
[Unit]
Description=MOC Player Status Monitor
After=graphical-session.target

[Service]
Type=simple
ExecStart=/home/bedawang/.config/i3/scripts/mocp-monitor.sh
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Now look at this beauty:

![Screenshot of the statusbar with mocp info](./image.png)

Gone are the days of bloated cloud players. I’ve returned to the basics — my unapologetically massive offline music library, a simple application that does what needs to be done and the sweet, sweet sound of regained sanity.
