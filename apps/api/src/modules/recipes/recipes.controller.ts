import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Recipes")
@Controller("recipes")
export class RecipesController {
  @Get()
  @ApiOperation({ summary: "List Production Recipes" })
  listRecipes() {
    return [
      {
        id: "recipe-vox-financial-podcast",
        name: "VOX Financial Podcast",
        characterId: "char-prof-tradeo",
        studioId: "tradeo-editorial-study",
        styleId: "vox-editorial-style",
        voiceId: "tradeo-ar-voice",
        wardrobeId: "classic-tradeo-wardrobe",
        defaultTransitionLang: "Paper Tear",
        captionsEnabled: true,
        musicEnabled: false,
        sfxEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create Production Recipe" })
  createRecipe(@Body() body: unknown) {
    return {
      id: "rec-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get Production Recipe by ID" })
  getRecipe(@Param("id") id: string) {
    return {
      id,
      name: "VOX Financial Podcast",
      characterId: "char-prof-tradeo",
      studioId: "tradeo-editorial-study",
      styleId: "vox-editorial-style",
      voiceId: "tradeo-ar-voice",
      wardrobeId: "classic-tradeo-wardrobe",
      defaultTransitionLang: "Paper Tear",
      captionsEnabled: true,
      musicEnabled: false,
      sfxEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update Production Recipe" })
  updateRecipe(@Param("id") id: string, @Body() body: unknown) {
    return {
      id,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(":id/validate")
  @ApiOperation({ summary: "Validate Production Recipe compatibility stack" })
  validateRecipe(@Param("id") _id: string, @Body() body: unknown) {
    const input = body as { characterId?: string; studioId?: string; styleId?: string };
    const isCompatible = input.characterId && input.studioId && input.styleId;

    return {
      valid: Boolean(isCompatible),
      compatibility: isCompatible ? "COMPATIBLE" : "WARNING",
      issues: isCompatible ? [] : ["Some stack elements are incomplete"],
      warnings: [],
      details: ["Character + Studio: COMPATIBLE", "Character + Style: COMPATIBLE"],
    };
  }
}
