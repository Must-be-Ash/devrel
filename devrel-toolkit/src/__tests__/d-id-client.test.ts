import { describe, it, expect, vi, beforeEach } from "vitest";
import { DIDClient } from "../d-id/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("DIDClient", () => {
  let client: DIDClient;

  beforeEach(() => {
    client = new DIDClient("test-api-key");
    mockFetch.mockReset();
  });

  describe("listAvatars", () => {
    it("returns avatars from API", async () => {
      const avatars = [
        { id: "avt_1", name: "Amber", sentiments: [{ id: "snt_1", name: "Professional" }] },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ avatars }),
      });

      const result = await client.listAvatars();
      expect(result).toEqual(avatars);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.d-id.com/expressives/avatars",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Basic test-api-key",
          }),
        })
      );
    });
  });

  describe("createVideo", () => {
    it("sends correct payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "exp_123", status: "created" }),
      });

      const result = await client.createVideo({
        avatarId: "avt_1",
        sentimentId: "snt_1",
        script: "Hello world",
        config: { result_format: "mp4", output_resolution: 1080 },
        background: { type: "color", value: "#1a1a1a" },
      });

      expect(result.id).toBe("exp_123");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.avatar_id).toBe("avt_1");
      expect(body.sentiment_id).toBe("snt_1");
      expect(body.script.type).toBe("text");
      expect(body.script.input).toBe("Hello world");
    });

    it("throws on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ kind: "AuthorizationError", description: "unauthenticated" }),
      });

      await expect(
        client.createVideo({ avatarId: "avt_1", script: "test" })
      ).rejects.toThrow("authentication failed");
    });

    it("throws on 402", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ kind: "InsufficientCreditsError", description: "no credits" }),
      });

      await expect(
        client.createVideo({ avatarId: "avt_1", script: "test" })
      ).rejects.toThrow("insufficient credits");
    });
  });

  describe("getVideo", () => {
    it("returns video status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "exp_123",
            status: "done",
            result_url: "https://result.d-id.com/video.mp4",
            duration: 4.5,
          }),
      });

      const result = await client.getVideo("exp_123");
      expect(result.status).toBe("done");
      expect(result.result_url).toBe("https://result.d-id.com/video.mp4");
    });
  });

  describe("pollUntilDone", () => {
    it("polls until status is done", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: "exp_123", status: "started" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "exp_123",
              status: "done",
              result_url: "https://result.d-id.com/video.mp4",
              duration: 3,
            }),
        });

      const result = await client.pollUntilDone("exp_123", { interval: 10 });
      expect(result.status).toBe("done");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws on error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "exp_123",
            status: "error",
            error: { kind: "Error", description: "generation failed" },
          }),
      });

      await expect(
        client.pollUntilDone("exp_123", { interval: 10 })
      ).rejects.toThrow("generation failed");
    });
  });
});
