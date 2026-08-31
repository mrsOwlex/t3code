import { describe, expect, it } from "vite-plus/test";

import {
  formatProviderSkillDisplayName,
  getProviderSlashCommandsForSlashMenu,
  getProviderSkillsForSlashMenu,
  resolveProviderSkillSourceKind,
  resolveProviderWorkspaceSkills,
} from "./providerSkills.ts";

const snapshotSkill = {
  name: "personal-review",
  path: "/Users/test/.agents/skills/personal-review/SKILL.md",
  enabled: true,
};
const workspaceSkill = {
  name: "project-review",
  path: "/workspace/.agents/skills/project-review/SKILL.md",
  enabled: true,
};

describe("resolveProviderWorkspaceSkills", () => {
  it("keeps snapshot skills before workspace discovery is requested", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: false,
        result: null,
        requestFailed: false,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([snapshotSkill]);
  });

  it("uses an empty list while workspace discovery is pending", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: true,
        result: null,
        requestFailed: false,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([]);
  });

  it("falls back to snapshot skills when workspace discovery fails", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: true,
        result: null,
        requestFailed: true,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([snapshotSkill]);
  });

  it("uses workspace skills when the provider returns them", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: true,
        result: { skills: [workspaceSkill] },
        requestFailed: false,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([workspaceSkill]);
  });

  it("preserves an intentionally empty workspace result", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: true,
        result: { skills: [] },
        requestFailed: false,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([]);
  });

  it("falls back when the provider does not support workspace discovery", () => {
    expect(
      resolveProviderWorkspaceSkills({
        requested: true,
        result: { skills: null },
        requestFailed: false,
        snapshotSkills: [snapshotSkill],
      }),
    ).toEqual([snapshotSkill]);
  });
});

describe("formatProviderSkillDisplayName", () => {
  it("prefers the provider display name", () => {
    expect(
      formatProviderSkillDisplayName({
        name: "review-follow-up",
        displayName: "Review Follow-up",
      }),
    ).toBe("Review Follow-up");
  });

  it("falls back to a title-cased skill name", () => {
    expect(
      formatProviderSkillDisplayName({
        name: "review-follow-up",
      }),
    ).toBe("Review Follow Up");
  });
});

describe("getProviderSkillsForSlashMenu", () => {
  it("keeps the skill alias when the provider also exposes it as a slash command", () => {
    const askMatt = {
      name: "ask-matt",
      path: "/Users/matt/.agents/skills/ask-matt/SKILL.md",
      enabled: true,
    };
    expect(getProviderSkillsForSlashMenu([askMatt], true).map((skill) => skill.name)).toEqual([
      "ask-matt",
    ]);
  });
});

describe("getProviderSlashCommandsForSlashMenu", () => {
  const commands = [
    { name: "ask-matt", description: "Ask which skill fits your situation." },
    { name: "compact", description: "Compact the conversation." },
  ];
  const skills = [
    {
      name: "ask-matt",
      path: "/Users/matt/.agents/skills/ask-matt/SKILL.md",
      enabled: true,
    },
  ];

  it("lets the skill alias win when a provider command has the same name", () => {
    expect(
      getProviderSlashCommandsForSlashMenu(commands, skills).map((command) => command.name),
    ).toEqual(["compact"]);
  });

  it("keeps the provider command when the matching skill alias is hidden", () => {
    const visibleSkills = getProviderSkillsForSlashMenu(skills, false);

    expect(
      getProviderSlashCommandsForSlashMenu(commands, visibleSkills).map((command) => command.name),
    ).toEqual(["ask-matt", "compact"]);
  });
});

describe("resolveProviderSkillSourceKind", () => {
  it("marks plugin-backed skills as app installs", () => {
    expect(
      resolveProviderSkillSourceKind({
        path: "/Users/julius/.codex/plugins/cache/openai-curated/github/skills/gh-fix-ci/SKILL.md",
        scope: "user",
      }),
    ).toBe("app");
  });

  it("maps standard scopes to source kinds", () => {
    expect(
      resolveProviderSkillSourceKind({
        path: "/workspace/.codex/skills/review-follow-up/SKILL.md",
        scope: "repo",
      }),
    ).toBe("repo");
    expect(
      resolveProviderSkillSourceKind({
        path: "/workspace/.codex/skills/review-follow-up/SKILL.md",
        scope: "project",
      }),
    ).toBe("project");
    expect(
      resolveProviderSkillSourceKind({
        path: "/Users/julius/.agents/skills/agent-browser/SKILL.md",
        scope: "user",
      }),
    ).toBe("personal");
    expect(
      resolveProviderSkillSourceKind({
        path: "/usr/local/share/codex/skills/imagegen/SKILL.md",
        scope: "system",
      }),
    ).toBe("system");
  });

  it("keeps unknown and missing scopes usable", () => {
    expect(
      resolveProviderSkillSourceKind({
        path: "/opt/skills/team-review/SKILL.md",
        scope: "team_shared",
      }),
    ).toBe("other");
    expect(
      resolveProviderSkillSourceKind({
        path: "/opt/skills/team-review/SKILL.md",
      }),
    ).toBe("other");
  });
});
