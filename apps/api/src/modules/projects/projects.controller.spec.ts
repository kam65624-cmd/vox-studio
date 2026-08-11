import { describe, it, expect, beforeEach } from "vitest";
import { ProjectsController } from "./projects.controller";
import { BadRequestException } from "@nestjs/common";

describe("ProjectsController", () => {
  let controller: ProjectsController;

  beforeEach(() => {
    controller = new ProjectsController();
  });

  it("should list projects including default seed project", () => {
    const list = controller.listProjects();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].name).toBe("بودكاست تحليلات الأسواق");
  });

  it("should create an Arabic project", () => {
    const project = controller.createProject({
      name: "تقرير السوق السعودي",
      language: "ar",
      productionType: "News / Market Analysis",
    });
    expect(project.id).toBeDefined();
    expect(project.name).toBe("تقرير السوق السعودي");
    expect(project.language).toBe("ar");
    expect(project.episodes).toEqual([]);
  });

  it("should create an English project", () => {
    const project = controller.createProject({
      name: "Global Macro Outlook",
      language: "en",
      productionType: "Documentary",
    });
    expect(project.name).toBe("Global Macro Outlook");
    expect(project.language).toBe("en");
    expect(project.episodes).toEqual([]);
  });

  it("should create a Bilingual project", () => {
    const project = controller.createProject({
      name: "FinTech Innovations 2026",
      language: "ar-en",
      productionType: "Explainer",
    });
    expect(project.language).toBe("ar-en");
  });

  it("should create a project with recipe", () => {
    const project = controller.createProject({
      name: "Tradeo Daily Brief",
      language: "ar",
      productionRecipeId: "recipe-vox-financial-podcast",
    });
    expect(project.recipe).toBeDefined();
    expect(project.recipe?.character).toBe("Prof. Tradeo");
    expect(project.recipe?.studio).toBe("Tradeo Editorial Study");
  });

  it("should create a project without recipe when omitted or none", () => {
    const project = controller.createProject({
      name: "Custom Raw Project",
      language: "ar",
    });
    expect(project.name).toBe("Custom Raw Project");
  });

  it("should reject project creation with empty name", () => {
    expect(() =>
      controller.createProject({
        name: "",
        language: "ar",
      })
    ).toThrow(BadRequestException);
  });

  it("should reject invalid recipe", () => {
    expect(() =>
      controller.createProject({
        name: "Test Project",
        language: "ar",
        productionRecipeId: "invalid-recipe",
      })
    ).toThrow(BadRequestException);
  });

  it("should retrieve created project by ID", () => {
    const created = controller.createProject({
      name: "Project To Get",
      language: "ar",
    });
    const fetched = controller.getProject(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe("Project To Get");
  });

  it("should get and update Creative DNA for a project", () => {
    const project = controller.createProject({
      name: "Creative DNA Test Project",
      language: "ar",
    });

    const dna = controller.getCreativeDNA(project.id);
    expect(dna.projectId).toBe(project.id);
    expect(dna.styleName).toBe("VOX Mixed Media Editorial");

    const updated = controller.updateCreativeDNA(project.id, {
      styleName: "VOX Cinematic Paper Diorama",
      accentColor: "#E65100",
    });

    expect(updated.styleName).toBe("VOX Cinematic Paper Diorama");
    expect(updated.accentColor).toBe("#E65100");
    expect(updated.version).toBe(2);
  });
});
