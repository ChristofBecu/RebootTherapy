
# i3lock and the Password That Never Was

There’s nothing quite like confidently locking your screen, walking away, and coming back only to discover that your password doesn’t work.

No typos. No caps lock. Just rejection. Cold, emotionless, *rootless* rejection.

## The Symptom

I had i3lock set up, the keybinding worked, the screen locked…  
But when I entered my password, it just blinked and stayed locked.

No error. No unlock. No mercy.

## First Suspects: PAM, Ghosts, Aliens

I did the obvious:

- Checked PAM configs in `/etc/pam.d/i3lock` — looked normal.
- Tried different keyboards — not it.
- Tried different passwords — same.
- Screamed into the void — somewhat helpful.

Google led me down rabbit holes involving PAM misconfiguration, kernel modules, gremlins living in `/usr/bin`.

## The Real Culprit: Permissions

After hours of messing around, I checked the permissions on `/usr/bin/i3lock`:

```bash
ls -l /usr/bin/i3lock
```

It didn’t have the **setuid** bit. i3lock needs to run as root *briefly* to verify your password.

Without the correct permissions, it's like asking a bouncer to let you in without a guest list.

## The Fix

This one-liner saved my sanity:

```bash
sudo chown root:root /usr/bin/i3lock && sudo chmod 4755 /usr/bin/i3lock
```

### What it does

- `chown root:root`: Ensures the binary is owned by root.
- `chmod 4755`: Adds the setuid bit (`4`) so it can momentarily escalate privileges.

After that, i3lock could finally check my password and unlock the screen like a good little program.

## The Takeaway

If i3lock doesn’t accept your password, check its permissions before rewriting PAM, replacing your keyboard, or performing an exorcism. Sometimes, all it wants is to feel a little root.

Until next time,  
*Reboot Therapy remains locked, but willingly.*
