import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Styles")
@Controller("styles")
export class StylesController {
  @Get()
  @ApiOperation({ summary: "List styles" })
  listStyles() {
    return [
      {
        id: "vox-editorial-style",
        name: "VOX Editorial Style",
        slug: "vox-editorial-style",
        description: "Paper/collage editorial world — VOX mixed-media language with paper grain, halftone, ink edges.",
        isCanonical: true,
        palette: [
          { name: "PAPER", hex: "#F2EDE2" },
          { name: "INK NAVY", hex: "#111820" },
          { name: "VIXOR RED", hex: "#D94B3D" },
          { name: "MUSTARD", hex: "#D8AA45" },
          { name: "DEEP TEAL", hex: "#0E5B56" },
          { name: "WARM BROWN", hex: "#5B3A28" },
        ],
        texture: "Paper grain, halftone, ink edges, tape/stickers, rough tears, paper folds",
        composition: "Off-center host framing, multi-layered collage backgrounds, bold typography callouts",
        lighting: "Warm contrast editorial lighting",
        cameraLanguage: "Parallax, Dynamic Angle, Macro, Follow Action",
        motionLanguage: "Snappy paper cuts, 12fps stop-motion feel, organic bounce",
        transitionLanguage: "Page Flip, Chart Line, Marker Circle, Paper Tear, Match Cut, Push In/Out",
        graphicsLanguage: "Charts, arrows, circles, archival imagery, editorial typography",
        negativeRules: [
          "No generic motion graphics",
          "No rainbow colors",
          "No excessive glows",
          "No generic stock footage",
        ],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create style" })
  createStyle(@Body() body: unknown) {
    return {
      id: "sty-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get style by ID" })
  getStyle(@Param("id") id: string) {
    return {
      id,
      name: "VOX Editorial Style",
      slug: "vox-editorial-style",
      description: "Paper/collage editorial world — VOX mixed-media language",
      isCanonical: true,
      palette: [
        { name: "PAPER", hex: "#F2EDE2" },
        { name: "INK NAVY", hex: "#111820" },
        { name: "VIXOR RED", hex: "#D94B3D" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update style" })
  updateStyle(@Param("id") id: string, @Body() body: unknown) {
    return {
      id,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create style version" })
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ver-sty-new",
      styleId: id,
      version: 2,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }
}
