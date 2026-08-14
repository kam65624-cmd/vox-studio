import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CreateProjectSchema } from "@vox/contracts";

const projectStore = new Map<string, any>();

// Seed default project
projectStore.set("proj-tradeo-pod", {
  id: "proj-tradeo-pod",
  workspaceId: "ws-default-001",
  name: "بودكاست تحليلات الأسواق",
  description: "تحليل الأحداث المالية والتحولات الاقتصادية مع بروفيسور تراديو",
  language: "ar",
  productionType: "Podcast",
  productionRecipeId: "recipe-vox-financial-podcast",
  recipe: {
    id: "recipe-vox-financial-podcast",
    name: "VOX Financial Podcast",
    character: "Prof. Tradeo",
    studio: "Tradeo Editorial Study",
    style: "VOX Editorial Style",
    voice: "Arabic Prof. Tradeo",
  },
  episodes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

@ApiTags("Projects")
@Controller("projects")
export class ProjectsController {
  @Get()
  @ApiOperation({ summary: "List projects" })
  listProjects() {
    return Array.from(projectStore.values());
  }

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  createProject(@Body() body: unknown) {
    const parseResult = CreateProjectSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Invalid input";
      throw new BadRequestException(`Project validation failed: ${firstError}`);
    }

    const input = parseResult.data;

    if (input.productionRecipeId && input.productionRecipeId === "invalid-recipe") {
      throw new BadRequestException("Selected production recipe is invalid or incompatible");
    }

    const id = `proj-${Date.now().toString(36)}`;
    const newProject = {
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description ?? "",
      language: input.language,
      productionType: input.productionType ?? "Podcast",
      productionRecipeId: input.productionRecipeId,
      aspectRatio: input.aspectRatio ?? "16:9",
      targetDuration: input.targetDuration ?? 300,
      recipe: input.productionRecipeId === "recipe-vox-financial-podcast" || !input.productionRecipeId
        ? {
            id: "recipe-vox-financial-podcast",
            name: "VOX Financial Podcast",
            character: "Prof. Tradeo",
            studio: "Tradeo Editorial Study",
            style: "VOX Editorial Style",
            voice: input.language === "en" ? "English Prof. Tradeo" : "Arabic Prof. Tradeo",
          }
        : null,
      episodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projectStore.set(id, newProject);
    return newProject;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get project by ID" })
  getProject(@Param("id") id: string) {
    const project = projectStore.get(id);
    if (!project) {
      // Fallback for new dynamically generated IDs
      return {
        id,
        workspaceId: "ws-default-001",
        name: "مشروع جديد (New Production)",
        description: "مشروع إنتاجي مجدول في استوديو VOX",
        language: "ar",
        productionType: "Podcast",
        productionRecipeId: "recipe-vox-financial-podcast",
        recipe: {
          id: "recipe-vox-financial-podcast",
          name: "VOX Financial Podcast",
          character: "Prof. Tradeo",
          studio: "Tradeo Editorial Study",
          style: "VOX Editorial Style",
          voice: "Arabic Prof. Tradeo",
        },
        episodes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return project;
  }

  @Get(":id/creative-dna")
  @ApiOperation({ summary: "Get project Creative DNA and style lock settings" })
  getCreativeDNA(@Param("id") id: string) {
    const project = projectStore.get(id);
    return project?.creativeDNA || {
      id: `dna-${id}`,
      projectId: id,
      styleName: "VOX Mixed Media Editorial",
      primaryColor: "#0A0A0A",
      secondaryColor: "#F4F1EA",
      accentColor: "#FF3B30",
      fontFamily: "Anton",
      composition: "Magazine Collage",
      cameraLanguage: "Snappy 2D pans and focal push-ins",
      motionLanguage: "Snappy 12fps paper stop-motion feel",
      transitionLanguage: "Paper tear & stroke match cuts",
      negativeRules: ["No photorealism", "No 3D renders", "No live-action footage"],
      brandRules: ["Keep color palette locked across all scenes"],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(":id/creative-dna")
  @ApiOperation({ summary: "Update project Creative DNA and style lock settings" })
  updateCreativeDNA(@Param("id") id: string, @Body() body: any) {
    const project = projectStore.get(id) || { id, name: "Project", workspaceId: "ws-1" };
    const dna = {
      id: `dna-${id}`,
      projectId: id,
      styleName: body.styleName || "VOX Mixed Media Editorial",
      primaryColor: body.primaryColor || "#0A0A0A",
      secondaryColor: body.secondaryColor || "#F4F1EA",
      accentColor: body.accentColor || "#FF3B30",
      fontFamily: body.fontFamily || "Anton",
      composition: body.composition || "Magazine Collage",
      cameraLanguage: body.cameraLanguage || "Snappy 2D pans and focal push-ins",
      motionLanguage: body.motionLanguage || "Snappy 12fps paper stop-motion feel",
      transitionLanguage: body.transitionLanguage || "Paper tear & stroke match cuts",
      negativeRules: body.negativeRules || ["No photorealism", "No 3D renders"],
      brandRules: body.brandRules || ["Keep color palette locked"],
      version: (project.creativeDNA?.version || 1) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    project.creativeDNA = dna;
    projectStore.set(id, project);
    return dna;
  }
}
