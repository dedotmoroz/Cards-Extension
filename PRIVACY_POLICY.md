# Privacy Policy for Cards Dictionary Helper

**Last Updated:** December 11, 2024

## Introduction

Cards Dictionary Helper ("we", "our", or "the extension") is a Chrome browser extension that helps users add selected words to their cards dictionary on kotcat.com. This Privacy Policy explains how we collect, use, and protect your information when you use our extension.

## Information We Collect

### 1. Locally Stored Data

The extension stores the following information locally on your device using Chrome's storage API:

- **API Token**: Your authentication token for kotcat.com API (stored in `chrome.storage.sync`)
- **Folder ID**: The ID of the folder where you want to save words (stored in `chrome.storage.sync`)
- **Extension Settings**: Your preference for enabling/disabling the extension (stored in `chrome.storage.sync`)

This data is stored locally on your device and is not transmitted to us or any third parties except as described below.

### 2. Data Sent to External Services

When you use the extension to add a word to your dictionary, the following information is sent to kotcat.com:

- **Selected Word**: The text you selected on a webpage
- **Source URL**: The URL of the webpage where you selected the text
- **API Token**: Used for authentication (sent as Authorization header)
- **Folder ID**: Used to identify which folder to save the word to

This data is sent directly to kotcat.com's API endpoint (`https://kotcat.com/api/ext/cards`) and is subject to kotcat.com's privacy policy.

### 3. Data We Do NOT Collect

We do NOT collect:
- Personal identification information (name, email, etc.)
- Browsing history
- Other website content
- Any data beyond what is necessary for the extension's functionality

## How We Use Your Information

The extension uses your information solely for the following purposes:

1. **To authenticate API requests** to kotcat.com using your API token
2. **To save selected words** to your specified folder on kotcat.com
3. **To store your preferences** locally for the extension's functionality
4. **To update the context menu** with the selected word for better user experience

## Data Storage and Security

- All local data is stored using Chrome's secure storage API (`chrome.storage.sync`)
- Your API token and folder ID are encrypted by Chrome's storage system
- Data transmission to kotcat.com uses HTTPS encryption
- We do not have access to your locally stored data

## Third-Party Services

This extension integrates with **kotcat.com**, an external service. When you use the extension:

- Your selected words and source URLs are sent to kotcat.com's servers
- Your API token is used to authenticate requests to kotcat.com
- kotcat.com's handling of your data is governed by their own privacy policy

We recommend reviewing kotcat.com's privacy policy to understand how they handle your data.

## Content Scripts

The extension uses content scripts that run on web pages you visit. These scripts:

- Monitor text selection on web pages
- Send selected text to the extension's background script
- Do NOT collect or store any data from web pages
- Do NOT modify web page content
- Only function when text is selected

## Permissions Explanation

The extension requires the following permissions:

- **contextMenus**: To add "Add to dictionary" option to the right-click menu
- **storage**: To save your API token, folder ID, and preferences locally
- **notifications**: To show confirmation messages when words are added
- **host_permissions** (localhost): For development purposes only

## Your Rights

You have the right to:

- **Access your data**: All data is stored locally and can be viewed in Chrome's extension settings
- **Delete your data**: You can remove the extension at any time, which will delete all locally stored data
- **Control data sharing**: You can disable the extension or clear stored data through Chrome's extension management
- **Opt-out**: Simply uninstall the extension to stop all data collection

## Data Retention

- **Local data**: Stored on your device until you uninstall the extension or clear Chrome's extension data
- **Data sent to kotcat.com**: Subject to kotcat.com's data retention policies

## Children's Privacy

This extension is not intended for children under 13 years of age. We do not knowingly collect personal information from children.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:

- Updating the "Last Updated" date at the top of this policy
- Posting a notice in the extension's update notes

Your continued use of the extension after any changes constitutes acceptance of the new Privacy Policy.

## Contact Us

If you have any questions about this Privacy Policy or the extension's data practices, please contact us through:

- **Website**: https://kotcat.com
- **Extension Support**: Through the Chrome Web Store support page

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) requirements

---

**Note**: This extension is a tool that facilitates communication between your browser and kotcat.com. We act as an intermediary and do not store or process your data on our own servers. All data processing occurs either locally on your device or on kotcat.com's servers.


