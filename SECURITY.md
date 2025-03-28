# STL (School Tool Launcher) Security Policy

**Effective Date:** January 2025

A1dos Creations prioritizes the security and privacy of STL (School Tool Launcher) users. This document outlines the security measures, data practices, and user protections implemented in STL.

## Permissions and Data Storage

STL utilizes the Chrome Extension `storage` permission solely for storing optional user data, such as:

- Theme preferences.
- Liked or favorited buttons.
- Tasks created in the Task Manager.
- Pomodoro Timer settings and progress.

Additionally, STL uses the following permissions to enable its features:

### Alarm Permission
- The `alarms` permission is used to implement the Pomodoro Timer feature. This permission allows STL to schedule alarms for timing Pomodoro sessions, breaks, and task intervals.
- These alarms are triggered locally on the user’s device and do not require or rely on internet access.
- STL uses this permission to provide accurate and timely notifications when the timer completes, ensuring a seamless user experience without compromising security.

### Scripting Permission
- The `scripting` permission is used to manage and interact with the DOM dynamically for features like the Pomodoro Timer interface.
- This permission enables STL to inject scripts safely into the extension's own context to:
  - Update the timer display in real-time.
  - Control start, pause, resume, and stop functionalities for the timer.
- All scripts are strictly scoped to STL and operate only within its predefined boundaries, ensuring no unauthorized access to external or sensitive content.

### Data Storage Details
- All stored data is kept locally within the user’s Chrome profile.
- STL does not access or transmit stored data to any external servers or third-party services.

## Privacy Policy

STL is committed to protecting user privacy and adheres to the following principles:

1. **No Data Collection:** STL does not collect, store, or sell any user data. All user information remains on the user's device.

2. **No Internet Access:** STL operates entirely client-side and does not require or utilize internet access, except for linking fonts from Google Fonts.

3. **No Access to Private Information:** STL cannot access personal identifiable information (PII) or private information on the user’s device.

4. **No Third-Party Integrations:** STL does not use third-party analytics, trackers, or external APIs beyond the font links mentioned above.

## Security Features

- **Client-Side Operations:** STL’s architecture ensures that all features run locally on the user’s device, preventing potential external security vulnerabilities.
- **Content Security Policy (CSP) Compliance:** STL adheres to Chrome Extension security guidelines and implements a robust Content Security Policy to prevent malicious code execution.
- **No Inline Scripts:** To mitigate injection risks, STL avoids inline scripts and adheres to secure coding practices.

## User Responsibility

While STL implements strong security measures, users should:
- Keep their Chrome browser updated to the latest version.
- Review and manage extension permissions periodically.
- Report any suspicious activity related to STL to A1dos Creations.

## Contact for Security Issues

If you identify a security vulnerability or have concerns about STL’s security, please contact A1dos Creations at:
- **Email:** rbentertainmentinfo@gmail.com
- **Official Website:** [https://www.a1doscreations.com](https://www.a1doscreations.com)
- **GitHub Repository:** [https://github.com/A1dosCreations/STL](https://github.com/A1dosCreations/STL)
- **Github Issues Tab:** [https://github.com/A1dos-Creations/STL/issues...](https://github.com/A1dos-Creations/STL/issues/new/choose)

## Commitment to Transparency

A1dos Creations is dedicated to maintaining STL as a secure, private, and user-focused tool. Security policies will be reviewed and updated as needed to ensure ongoing compliance and user trust.

**Last Updated:** January 2025
