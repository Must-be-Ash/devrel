import * as dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface ToolkitConfig {
  didApiKey: string | undefined;
  browserUseApiKey: string | undefined;
}

/**
 * Loads configuration from environment variables, falling back to .env.local
 * in the current working directory.
 */
export function loadConfig(): ToolkitConfig {
  // Try loading .env.local from the user's project directory
  const envLocalPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }

  // Also try .env as a fallback
  const envPath = resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  return {
    didApiKey: process.env.DID_API_KEY,
    browserUseApiKey: process.env.BROWSER_USE_API_KEY,
  };
}

/**
 * Returns the D-ID API key or throws with a helpful error message.
 */
export function requireDidApiKey(): string {
  const config = loadConfig();
  if (!config.didApiKey) {
    throw new Error(
      "DID_API_KEY not found. Set it as an environment variable or in your project's .env.local file."
    );
  }
  return config.didApiKey;
}
