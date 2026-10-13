import { describe, expect, it } from "vitest";

import { projects } from "@/data/projects";

describe("projects", () => {
  it("highlights Skip The Trip as the first active project", () => {
    const activeProjects = projects.filter((project) => project.phase === "inProgress");

    expect(activeProjects[0]).toMatchObject({
      title: "Skip The Trip",
      status: "In progress",
      url: "https://skipthetrip.info",
    });
  });
});
