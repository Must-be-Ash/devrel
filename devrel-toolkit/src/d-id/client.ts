import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const BASE_URL = "https://api.d-id.com";

export interface DIDAvatar {
  id: string;
  presenter_id?: string;
  name: string;
  gender?: string;
  sentiments?: { id: string; name: string }[];
}

export interface CreateVideoOptions {
  avatarId: string;
  sentimentId?: string;
  voiceId?: string;
  script: string;
  config?: {
    result_format?: "mp4" | "mov" | "webm";
    output_resolution?: 480 | 720 | 1080;
  };
  background?: {
    type: "color";
    value: string;
  };
}

export interface VideoStatus {
  id: string;
  status: "created" | "started" | "done" | "error" | "rejected";
  result_url?: string;
  duration?: number;
  error?: { kind: string; description: string };
}

export interface PollOptions {
  interval?: number;
  timeout?: number;
}

export class DIDClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Basic ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`${BASE_URL}${path}`, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;

        if (response.status === 401) {
          throw new Error(
            "D-ID authentication failed (401). Check your DID_API_KEY."
          );
        }
        if (response.status === 402) {
          throw new Error(
            "D-ID insufficient credits (402). Top up your D-ID account to continue."
          );
        }

        // Don't retry client errors (4xx) other than rate limits
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(
            `D-ID API error ${response.status}: ${(errorBody as Record<string, string>).description || JSON.stringify(errorBody)}`
          );
        }

        lastError = new Error(
          `D-ID API error ${response.status}: ${(errorBody as Record<string, string>).description || "unknown error"}`
        );
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("401") ||
            err.message.includes("402") ||
            err.message.includes("D-ID API error 4"))
        ) {
          throw err;
        }
        lastError = err as Error;
      }

      // Exponential backoff before retry
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError ?? new Error("D-ID API request failed after retries");
  }

  async listAvatars(): Promise<DIDAvatar[]> {
    // /clips/presenters returns pre-built presenters available on all paid plans
    const data = await this.request<{ presenters: DIDAvatar[] }>(
      "GET",
      "/clips/presenters"
    );
    return data.presenters ?? (data as unknown as DIDAvatar[]);
  }

  async createVideo(options: CreateVideoOptions): Promise<{ id: string; status: string }> {
    const scriptPayload: Record<string, unknown> = {
      type: "text",
      input: options.script,
    };

    // Default to male voice (en-US-GuyNeural) to match default male presenter (Adam)
    scriptPayload.provider = {
      type: "microsoft",
      voice_id: options.voiceId ?? "en-US-GuyNeural",
    };

    const body: Record<string, unknown> = {
      presenter_id: options.avatarId,
      script: scriptPayload,
    };
    if (options.config) {
      body.config = options.config;
    }
    if (options.background) {
      body.background = options.background;
    }

    return this.request<{ id: string; status: string }>("POST", "/clips", body);
  }

  async getVideo(id: string): Promise<VideoStatus> {
    return this.request<VideoStatus>("GET", `/clips/${id}`, undefined, 1);
  }

  async pollUntilDone(
    id: string,
    options: PollOptions = {}
  ): Promise<VideoStatus> {
    const interval = options.interval ?? 5000;
    const timeout = options.timeout ?? 600000; // 10 minutes
    const startTime = Date.now();

    while (true) {
      const video = await this.getVideo(id);

      if (video.status === "done") {
        return video;
      }

      if (video.status === "error" || video.status === "rejected") {
        throw new Error(
          `D-ID video generation failed: ${video.error?.description ?? video.status}`
        );
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(
          `D-ID video generation timed out after ${timeout / 1000}s (status: ${video.status})`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  async downloadVideo(resultUrl: string, outputPath: string): Promise<void> {
    const response = await fetch(resultUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const fileStream = createWriteStream(outputPath);
    await pipeline(Readable.fromWeb(response.body as never), fileStream);
  }
}
