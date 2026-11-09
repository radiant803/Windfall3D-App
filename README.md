# Windfall3D

**Describe the part. Get CAD that has been measured.**

Windfall3D gives your AI assistant real CAD tools. You describe a part in plain language to
Claude or ChatGPT; Windfall3D builds it as editable CAD, measures it, checks it against every
requirement, and tells you whether it can be made. A window on your computer shows each model as
it is built, with its verdict and every check.

Website: **https://windfall3d.vercel.app**

> **Public beta.** Windfall3D 0.2.2 is open for anyone to download and try. It is a beta: expect rough
> edges, and please [report what you find](#reporting-a-problem). The installers are not code-signed
> yet, so your computer will ask you to confirm before installing; [here is why](#why-windows-and-macos-warn-you).

## Download

| Your computer | Download |
| --- | --- |
| **Windows 10 or 11** (64-bit) | [Windfall3D-0.2.2-windows-x64-setup.exe](https://github.com/radiant803/Windfall3D-App/releases/download/v0.2.2/Windfall3D-0.2.2-windows-x64-setup.exe) (176 MB) |
| **Mac with Apple silicon** (M1 or later) | [Windfall3D-0.2.2-macos-arm64.pkg](https://github.com/radiant803/Windfall3D-App/releases/download/v0.2.2/Windfall3D-0.2.2-macos-arm64.pkg) (213 MB) |

All files, including the Claude Desktop extensions and checksums, are on the
[release page](https://github.com/radiant803/Windfall3D-App/releases/latest). Older versions are
under [Releases](https://github.com/radiant803/Windfall3D-App/releases).

## Why Windows and macOS warn you

Windows SmartScreen says *"Windows protected your PC"*, and macOS says it *cannot check the
installer for malicious software*. Both warnings mean the same thing: **the installer is not
code-signed**. They are about the missing signature, not about anything found in Windfall3D.

Signing needs a paid certificate on each platform: a code-signing certificate from a certificate
authority for Windows, and a paid Apple Developer Program membership to sign and notarise for
macOS. Both have to be renewed every year, and for a beta that cost is not feasible yet, so
Windfall3D is distributed unsigned for now.

What you can check instead:

- **Virus scans.** VirusTotal checked both installers' download links against 93 security
  vendors, and none flagged them: [Windows installer](https://www.virustotal.com/gui/url/c54d01c8e87cf8e9abc03387130947e132ffd9f0064630174678bf64e90458ad)
  and [Mac installer](https://www.virustotal.com/gui/url/bf166465708bbcd234d96281ca7c7a41f477d70e1436138ec7301e5cae094339)
  (0 of 93 each, 9 November 2026).
- **Checksums.** Every release lists the SHA-256 of each file in `SHA256SUMS.txt`, so you can
  confirm your download is exactly the file published here ([how](#check-the-download-optional)).
- **Built and tested automatically.** The Windows installer is built on a clean Windows machine
  and installed, opened and uninstalled there by automated tests before each release.
- **It stays on your computer.** Windfall3D runs locally and does not send your models anywhere
  ([details](#your-data)).

To open it anyway, follow the [install steps](#install) for your computer.

## What you need

- A Mac with Apple silicon, or a 64-bit Windows 10 or 11 PC
- About 500 MB of free disk space
- One of these assistants:
  - **Claude Desktop**
  - **Claude Code**
  - **The ChatGPT desktop app, in Work mode** (ChatGPT's Chat mode and the website cannot use it)

## Install

### Windows

1. Download the `.exe` above and open it.
2. Windows may say **"Windows protected your PC"**, because the beta installer is not yet signed.
   Click **More info**, then **Run anyway**.
3. Follow the installer. It installs for your user only and does not ask for an administrator
   password. Leave **Create a desktop shortcut** ticked if you want one, and at the end leave
   **Open Windfall3D** ticked.

Windfall3D appears in the Start menu (search for *Windfall3D*), where you can pin it to Start or
the taskbar. If a browser tab opens instead of the Windfall3D window, the
Microsoft Edge WebView2 Runtime is missing; Windfall3D still works in the browser, and installing
the runtime from Microsoft gives you the window.

### Mac

1. Download the `.pkg` above and open it.
2. macOS will say it cannot check the installer for malicious software, because the beta is not yet
   signed. Click **Done** (not Move to Bin).
3. Open **System Settings → Privacy & Security**, scroll down to **Security**, and click
   **Open Anyway** beside the message about the Windfall3D installer. Confirm with your password or
   Touch ID.
4. Follow the installer: **Continue**, **Agree** to the licence, **Install**, and enter your password.

This adds **Windfall3D** and **Uninstall Windfall3D** to Applications, and a `windfall` command for
the terminal. The first time you open the app, macOS may take a minute to check the new files.

### Check the download (optional)

Each release has a `SHA256SUMS.txt`. Compare it with:

- Mac (Terminal): `shasum -a 256 Windfall3D-0.2.2-macos-arm64.pkg`
- Windows (PowerShell): `Get-FileHash Windfall3D-0.2.2-windows-x64-setup.exe`

## Connect your assistant

Open Windfall3D. In the panel on the right, under **Connect your agent**, press **Connect** beside
the assistant you use. Windfall3D adds itself to that assistant's settings, saving a backup of
them first. **Remove** takes it out again.

- **Claude Desktop:** quit Claude first (**Cmd+Q** on a Mac, or right-click the Claude icon in the
  Windows system tray and choose **Exit**). While Claude Desktop is open it overwrites its own
  settings, so Connect waits until it is closed. Press Connect, then open Claude and start a new chat.
- **ChatGPT desktop app:** press Connect, then switch ChatGPT to **Work** and start a new chat.
- **Claude Code:** press Connect, then start a new Claude Code session.

Assistants only load their tools when a chat or session starts, so a chat that was already open
will not see Windfall3D.

**Check it works:** in the new chat, ask *"Which Windfall tools do you have?"*

## Your first design

Keep the Windfall3D window open and ask your assistant for a part, for example:

> Design a snap-fit case for an ESP32 DevKit V1 and verify it for 3D printing.

The model appears in the window as it is built. The panel shows the verdict, the size, volume and
mass, the requirements, and each check with its measured result. Ask for changes in the chat.

**Files:** there is no Export button. Ask your assistant for the files, for example *"Export it as
STEP and 3MF"*. It can export STEP, STL, 3MF, OBJ, GLB and DXF, and tells you where they are.

**Pointing at things:** click a face or edge in the window to select it. Your assistant can read
the selection, so you can say *"make this face 2 mm thicker"*. **Capture** sends the current view
to your assistant, so it sees exactly what you see.

The **Help** button in the app covers all of this in more detail, including what to try if your
assistant will not connect.

## Update

Download the new installer and run it, the same way as the first time. It closes Windfall3D if it
is running, and keeps your models and settings. Afterwards, start a new chat in your assistant.

## Uninstall

- **Windows:** Settings → Apps → Installed apps → Windfall3D → Uninstall. It asks whether to delete
  your models and settings too; the answer is No unless you choose otherwise.
- **Mac:** open **Uninstall Windfall3D** in Applications. It asks whether to keep your models and
  settings, and for your password.

Before uninstalling, press **Remove** beside each connected assistant in the app, so their settings
no longer mention Windfall3D.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| The assistant does not see Windfall3D | Start a **new** chat or session after connecting. For ChatGPT, make sure you are in **Work** mode. For Claude Desktop, fully quit and reopen it. |
| Connect for Claude Desktop says to quit Claude first | Quit Claude Desktop completely (closing its window is not enough), then press Connect again. |
| Windows shows "Windows protected your PC" | Click **More info**, then **Run anyway**. The beta is not yet signed. |
| macOS will not open the installer | Use **Open Anyway** in System Settings → Privacy & Security, as in the [Mac install steps](#mac). |
| The window opens but shows nothing | Ask for a part in your assistant; the window shows models as they are built. If the status line says the 3D view could not start, close and reopen Windfall3D. |
| A build takes a long time | Large assemblies can take a few minutes, especially the first time after starting the app. |

Still stuck? Open a [Help issue](https://github.com/radiant803/Windfall3D-App/issues/new?template=3-help.yml).

## Your data

Windfall3D runs on your computer. Your models and settings are kept in a `.windfall` folder in your
home folder, and Windfall3D itself does not send them anywhere. Your conversation with your
assistant goes to its provider (Anthropic or OpenAI) as it always does.

## Reporting a problem

Please use the [issue forms](https://github.com/radiant803/Windfall3D-App/issues/new/choose):
**Bug report**, **Feature request** or **Help**.

Issues are screened before they reach us:

1. **Automatic check.** A new issue is checked for the details we need: the version, your
   operating system, what happened and how to make it happen again. If something is missing, the
   issue is closed with a comment listing exactly what to add. **Edit the issue** to add it, and it
   reopens by itself.
2. **Review.** An issue that passes is labelled **pending review** until a maintainer looks at it,
   and is then labelled **approved** or **rejected**.

Reports from older versions are asked to update first, and duplicates are pointed at the existing
issue. Security problems should be reported privately; see [SECURITY.md](SECURITY.md).

## About this repository

This repository holds the Windfall3D installers, this guide and the issue tracker. Windfall3D is
proprietary software, distributed in compiled form only; see [LICENSE](LICENSE). It includes
open-source components under their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
What changed in each version is in [CHANGELOG.md](CHANGELOG.md).

Designs that Windfall3D produces should be checked by a competent person before they are made or
relied on.
