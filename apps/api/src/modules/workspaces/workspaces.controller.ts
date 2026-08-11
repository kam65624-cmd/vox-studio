import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CreateWorkspaceSchema } from "@vox/contracts";

@ApiTags("Workspaces")
@Controller("workspaces")
export class WorkspacesController {
  @Get()
  @ApiOperation({ summary: "List all workspaces" })
  listWorkspaces() {
    return [
      {
        id: "ws-1",
        name: "VIXOR Studio",
        slug: "vixor",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create a new workspace" })
  createWorkspace(@Body() body: unknown) {
    const validated = CreateWorkspaceSchema.parse(body);
    return {
      id: "ws-2",
      ...validated,
      createdAt: new Date().toISOString(),
    };
  }
}
