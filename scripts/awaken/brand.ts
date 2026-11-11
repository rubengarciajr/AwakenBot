/**
 * AwakenBot's brand settings: the one place for the name, identity and colors.
 * After changing anything here, run: bun scripts/awaken/apply.ts
 * (The logo is brand/logo.png; after changing it run scripts/awaken-brand-icons.sh.)
 */
export const BRAND = {
  productName: "AwakenBot",
  /** macOS bundle id. Changing it after people install makes macOS treat it as a different app. */
  bundleIdentifier: "org.awakenbot.desktop",
  publisher: "AwakenBot",
  copyright: "AwakenBot. Built on CopilotKit/OpenBot (MIT License).",
  shortDescription: "Run AwakenBot on your own computer",
  longDescription:
    "AwakenBot Desktop installs the container engine, raises the stack, and keeps it running.",
  /** Off-black and off-white: every color in the app is mixed from these two. */
  ink: "#1b1a18",
  paper: "#f6f4ef",
  /** Where releases, images and updates come from. */
  repository: "rubengarciajr/AwakenBot",
} as const;
