import { getPushRange, git, tryGit } from "./git-utils.mjs";

const range = getPushRange();
const status = tryGit(["status", "--short"]);
const commits = tryGit(["log", "--oneline", "--decorate", range]);
const stats = tryGit(["diff", "--stat", range]);

console.log("\n当前 Git 状态:");
console.log(status || "工作区干净，没有未提交改动。");

console.log("\n本次将推送的提交:");
console.log(commits || "当前没有领先远端的新提交。");

console.log("\n本次将推送的文件统计:");
console.log(stats || "没有可显示的文件统计。");

console.log("\n远端地址:");
console.log(git(["remote", "-v"]) || "尚未配置 remote。");
