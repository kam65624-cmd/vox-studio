import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Wardrobes")
@Controller("wardrobes")
export class WardrobesController {
  @Get()
  @ApiOperation({ summary: "List wardrobes" })
  listWardrobes() {
    return [
      {
        id: "classic-tradeo-wardrobe",
        name: "Classic Tradeo Suit",
        slug: "classic-tradeo-suit",
        description: "Dark green blazer, mustard vest, white shirt, red bow tie, pocket square, watch chain",
        characterId: "char-prof-tradeo",
        colorPalette: ["#0E5B56", "#D8AA45", "#F2EDE2", "#D94B3D"],
        accessories: ["Glasses", "Red bow tie", "Pocket square", "Watch chain"],
        styleCompatibility: ["vox-editorial-style"],
        referenceImages: ["http://localhost:9000/vox-studio/wardrobe-tradeo-01.png"],
        isCanonical: true,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create wardrobe" })
  createWardrobe(@Body() body: unknown) {
    return {
      id: "w-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create wardrobe version" })
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ver-w-new",
      wardrobeId: id,
      version: 2,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }
}
