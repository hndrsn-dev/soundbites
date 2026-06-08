# Call Audio Setup — Hear Soundbites on Zoom / Teams

SNDBTS can route soundbites into your video call so everyone hears them **without screen-sharing audio**. This uses [BlackHole](https://existential.audio/blackhole/), a free macOS virtual audio driver.

## How it works

1. **SNDBTS** plays soundbites to **BlackHole** (when Call mode is on).
2. **Your microphone** and **BlackHole** are combined in an **Aggregate Device**.
3. **Zoom / Teams** uses that Aggregate Device as its microphone input.

Your voice and soundbites are both sent to the call.

## One-time macOS setup

### 1. Install BlackHole

Download and install [BlackHole 2ch](https://existential.audio/blackhole/) (free). Restart SNDBTS after installing.

### 2. Create an Aggregate Device

1. Open **Audio MIDI Setup** (Applications → Utilities, or Spotlight: “Audio MIDI Setup”).
2. Click **+** (bottom left) → **Create Aggregate Device**.
3. Check **Built-in Microphone** (or your preferred mic) **and** **BlackHole 2ch**.
4. Optionally rename the device (e.g. “Mic + SNDBTS”).

### 3. Configure Zoom or Teams

**Zoom**

- Settings → Audio → Microphone: select your **Aggregate Device**.
- Turn off **Automatically adjust microphone volume**.
- Optional: enable **Original Sound for musicians** for cleaner effects.

**Microsoft Teams**

- Settings → Devices → Microphone: select your **Aggregate Device**.
- Turn off automatic volume adjustment if available.

### 4. Enable Call mode in SNDBTS

1. Open SNDBTS (Option+Space).
2. Click the **call** icon in the header (or tray menu → **Call Audio Setup**).
3. Turn on **Call mode**.
4. Confirm **BlackHole 2ch** is selected as the output device.
5. Click **Test soundbite** while in a Zoom test meeting to verify others hear it.

## Hearing soundbites locally

When only SNDBTS routes to BlackHole, other apps use your normal speakers. You will **not** hear soundbites in your headphones unless you also route them there.

**Option A — Monitor via conferencing app**  
Use Zoom/Teams speaker test or stay unmuted and listen through the call (not ideal).

**Option B — Multi-Output Device (recommended for frequent use)**  
In Audio MIDI Setup, create a **Multi-Output Device** with **BlackHole 2ch** + your headphones. Set macOS **Sound Output** to that Multi-Output Device when on calls. SNDBTS Call mode still targets BlackHole via `setSinkId`; the Multi-Output lets you hear the same signal in headphones.

## Validation checklist

Use this to confirm everything works before an important call:

- [ ] BlackHole 2ch appears in SNDBTS Call Audio setup (green status).
- [ ] Aggregate Device includes mic + BlackHole 2ch.
- [ ] Zoom/Teams microphone is set to the Aggregate Device.
- [ ] Call mode is **on** in SNDBTS with BlackHole selected.
- [ ] Join a **Zoom test meeting** (zoom.us/test).
- [ ] Unmute; speak — you hear yourself / see mic level move.
- [ ] Play a soundbite from SNDBTS — other participants (or test recording) hear it.
- [ ] Toggle Call mode **off** — soundbites play only to your default output again.

## Troubleshooting

| Problem | Fix |
|--------|-----|
| “BlackHole not found” | Install BlackHole 2ch and restart SNDBTS. |
| Others hear soundbites but not your voice | Aggregate Device is missing your real microphone. |
| Others hear your voice but not soundbites | Call mode off, wrong output device, or Zoom mic not set to Aggregate Device. |
| Soundbites are quiet | Raise input level in Zoom/Teams; disable auto gain. |
| Echo / feedback | Use headphones; avoid speakers in the same room as the mic. |

## Technical note

Call mode uses the browser `setSinkId` API to send SNDBTS playback only to BlackHole. Your normal system output is unchanged, unlike routing the entire Mac through a Multi-Output Device.
