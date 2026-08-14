import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check system health status" })
  checkHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "vox-studio-api",
      version: "1.0.0",
    };
  }
}
