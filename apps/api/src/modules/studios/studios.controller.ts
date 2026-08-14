import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Studios")
@Controller("studios")
export class StudiosController {
  @Get()
  @ApiOperation({ summary: "List studios" })
  listStudios() {
    return [
      {
        id: "tradeo-editorial-study",
        name: "Tradeo Editorial Study",
        slug: "tradeo-editorial-study",
        description: "Warm dark editorial study/podcast environment",
        isCanonical: true,
        elements: [
          "wood desk", "black microphone", "black mug", "notebook", "papers",
          "pen", "books", "warm desk lamp", "shelves", "bronze bull", "globe/decor",
          "pinned charts", "world map", "question mark paper", "red-string board",
          "plant", "chart monitor"
        ],
        lighting: "Warm, dramatic editorial",
        cameraPositions: ["WIDE", "MEDIUM", "CLOSE", "OVER_SHOULDER"],
        backgroundElements: ["Shelves with books", "World map with red string", "Pinned market charts"],
        compatibleStyleIds: ["vox-editorial-style"],
        compatibleCharacterIds: ["char-prof-tradeo"],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create studio" })
  createStudio(@Body() body: unknown) {
    return {
      id: "std-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get studio by ID" })
  getStudio(@Param("id") id: string) {
    return {
      id,
      name: "Tradeo Editorial Study",
      slug: "tradeo-editorial-study",
      description: "Warm dark editorial study/podcast environment",
      isCanonical: true,
      elements: ["wood desk", "black microphone", "black mug", "books", "globe"],
      lighting: "Warm, dramatic editorial",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update studio" })
  updateStudio(@Param("id") id: string, @Body() body: unknown) {
    return {
      id,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create studio version" })
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ver-std-new",
      studioId: id,
      version: 2,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }
}
