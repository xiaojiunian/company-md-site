import { execFileSync } from "node:child_process";

export function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

export function tryGit(args, fallback = "") {
  try {
    return git(args);
  } catch {
    return fallback;
  }
}

export function getUpstream() {
  return tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
}

export function getPushRange() {
  const upstream = getUpstream();
  return upstream ? `${upstream}..HEAD` : "HEAD~1..HEAD";
}

export function hasUncommittedChanges() {
  return Boolean(tryGit(["status", "--porcelain"]));
}
