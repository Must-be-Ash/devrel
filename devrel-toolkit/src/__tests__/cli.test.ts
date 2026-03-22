import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

const CLI = "node dist/cli/index.js";

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`${CLI} ${args}`, {
      encoding: "utf-8",
      cwd: "/Users/ashnouruzi/siwx/devrel/devrel-toolkit",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: e.stdout ?? "", exitCode: e.status ?? 1 };
  }
}

describe("CLI", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = run("--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("devrel-toolkit");
    expect(stdout).toContain("d-id");
    expect(stdout).toContain("render");
    expect(stdout).toContain("preview");
    expect(stdout).toContain("doctor");
    expect(stdout).toContain("setup");
  });

  it("shows version with --version", () => {
    const { stdout, exitCode } = run("--version");
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("render requires --props", () => {
    const { exitCode } = run("render");
    expect(exitCode).not.toBe(0);
  });

  it("d-id generate requires --script", () => {
    const { exitCode } = run("d-id generate");
    expect(exitCode).not.toBe(0);
  });

  it("preview requires --props", () => {
    const { exitCode } = run("preview");
    expect(exitCode).not.toBe(0);
  });
});
