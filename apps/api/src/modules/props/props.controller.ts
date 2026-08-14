import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Props")
@Controller("props")
export class PropsController {
  @Get()
  @ApiOperation({ summary: "List props" })
  listProps() {
    return [
      {
        id: "prop-micro-black",
        name: "Black Studio Microphone",
        slug: "black-studio-microphone",
        category: "audio",
        description: "Classic broadcast condenser microphone on vintage desk arm",
        studioCompatibility: ["tradeo-editorial-study"],
        styleCompatibility: ["vox-editorial-style"],
        referenceImages: ["http://localhost:9000/vox-studio/props/mic.png"],
        isCanonical: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prop-mug-black",
        name: "Black Coffee Mug",
        slug: "black-coffee-mug",
        category: "desk",
        description: "Matte black ceramic coffee mug with Tradeo emblem",
        studioCompatibility: ["tradeo-editorial-study"],
        styleCompatibility: ["vox-editorial-style"],
        referenceImages: ["http://localhost:9000/vox-studio/props/mug.png"],
        isCanonical: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create prop" })
  createProp(@Body() body: unknown) {
    return {
      id: "prop-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create prop version" })
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ver-prop-new",
      propId: id,
      version: 2,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }
}
