import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Assets")
@Controller("assets")
export class AssetsController {
  @Get()
  @ApiOperation({ summary: "List generic assets" })
  listAssets() {
    return [
      {
        id: "asset-001",
        type: "CHARACTER",
        name: "Prof. Tradeo",
        slug: "prof-tradeo",
        description: "Canonical editorial puppet character",
        isCanonical: true,
        versions: [
          {
            version: 1,
            storageKey: "assets/characters/tradeo-v1.png",
            previewUrl: "http://localhost:9000/vox-studio/assets/characters/tradeo-v1.png",
            isLatest: true,
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create asset metadata entry" })
  createAsset(@Body() body: unknown) {
    return {
      id: "ast-new",
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get asset details" })
  getAsset(@Param("id") id: string) {
    return {
      id,
      type: "CHARACTER",
      name: "Prof. Tradeo",
      slug: "prof-tradeo",
      isCanonical: true,
      createdAt: new Date().toISOString(),
    };
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Upload new asset version" })
  uploadVersion(@Param("id") id: string, @Body() body: unknown) {
    return {
      id: "ast-ver-new",
      assetId: id,
      version: 2,
      storageKey: "assets/uploads/file-v2.png",
      previewUrl: "http://localhost:9000/vox-studio/assets/uploads/file-v2.png",
      isLatest: true,
      createdAt: new Date().toISOString(),
    };
  }
}
