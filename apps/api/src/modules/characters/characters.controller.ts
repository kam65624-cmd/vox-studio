import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Characters")
@Controller("characters")
export class CharactersController {
  @Get()
  @ApiOperation({ summary: "List characters" })
  listCharacters() {
    return [
      {
        id: "char-prof-tradeo",
        name: "Prof. Tradeo",
        slug: "prof-tradeo",
        description: "Smart, sarcastic, curious market-analysis host",
        isCanonical: true,
        identity: "Felt/puppet editorial character with white wild hair, bushy eyebrows, and red bow tie.",
        personality: "Educational depth. Smart sarcasm. Rich visuals. Reliable information.",
        expressions: ["Happy", "Surprised", "Thinking", "Sarcastic", "Angry", "Shocked", "Hesitant", "Confident"],
        gestures: ["Adjust glasses", "Point to chart", "Sip coffee", "Shrug"],
        allowedStyleIds: ["vox-editorial-style"],
        allowedStudioIds: ["tradeo-editorial-study"],
        allowedVoiceIds: ["tradeo-ar-voice"],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create character" })
  createCharacter(@Body() body: unknown) {
    return {
      id: "char-new",
      ...(body as object),
      isCanonical: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get character by ID" })
  getCharacter(@Param("id") id: string) {
    return {
      id,
      name: "Prof. Tradeo",
      slug: "prof-tradeo",
      description: "Smart, sarcastic, curious market-analysis host",
      isCanonical: true,
      identity: "Felt/puppet editorial character with white wild hair, bushy eyebrows, and red bow tie.",
      personality: "Educational depth. Smart sarcasm. Rich visuals. Reliable information.",
      expressions: ["Happy", "Surprised", "Thinking", "Sarcastic", "Angry", "Shocked", "Hesitant", "Confident"],
      gestures: ["Adjust glasses", "Point to chart", "Sip coffee", "Shrug"],
      allowedStyleIds: ["vox-editorial-style"],
      allowedStudioIds: ["tradeo-editorial-study"],
      allowedVoiceIds: ["tradeo-ar-voice"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update character" })
  updateCharacter(@Param("id") id: string, @Body() body: unknown) {
    return {
      id,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create character version" })
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ver-new",
      characterId: id,
      version: 2,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }

  @Post(":id/canonical")
  @ApiOperation({ summary: "Set character version as canonical" })
  setCanonical(@Param("id") id: string) {
    return {
      characterId: id,
      isCanonical: true,
      updatedAt: new Date().toISOString(),
    };
  }
}
