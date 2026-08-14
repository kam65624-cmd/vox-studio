import { Controller, Get, Post, Param, Body, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ModelRegistry, ModelRouter, ProviderExecutionEngine } from "@vox/ai";
import { RouterSelectionRequestSchema } from "@vox/contracts";

const registry = new ModelRegistry();
const router = new ModelRouter(registry);

@ApiTags("Models")
@Controller("models")
export class ModelsController {
  @Get()
  @ApiOperation({ summary: "Get all registered AI models in the system" })
  getModels() {
    return {
      models: registry.listModels(),
      total: registry.listModels().length,
    };
  }

  @Get("providers")
  @ApiOperation({ summary: "Get all registered AI model providers" })
  getProviders() {
    return {
      providers: registry.getProviders(),
    };
  }

  @Get("providers/status")
  @ApiOperation({ summary: "Get operational and health status of AI providers" })
  getProvidersStatus() {
    const engine = new ProviderExecutionEngine(registry, router);
    return {
      providers: engine.getProvidersStatus(),
      runtimeMode: engine.getRuntimeMode(),
    };
  }

  @Get("capabilities")
  @ApiOperation({ summary: "Get available capability taxonomy" })
  getCapabilities() {
    return {
      capabilities: [
        "TEXT_GENERATION",
        "REASONING",
        "STRUCTURED_OUTPUT",
        "VISION",
        "IMAGE_GENERATION",
        "IMAGE_EDITING",
        "VIDEO_GENERATION",
        "VOICE_GENERATION",
        "VOICE_TRANSCRIPTION",
        "AUDIO_GENERATION",
        "EMBEDDINGS",
        "UNKNOWN",
      ],
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details for a specific AI model" })
  getModel(@Param("id") id: string) {
    const decodedId = decodeURIComponent(id);
    const model = registry.getModel(decodedId);
    if (!model) {
      throw new NotFoundException(`Model "${decodedId}" not found in registry`);
    }
    return model;
  }

  @Post("route")
  @ApiOperation({ summary: "Route a generation request to the optimal model and fallback chain" })
  routeRequest(@Body() body: unknown) {
    const request = RouterSelectionRequestSchema.parse(body);
    const response = router.selectModel(request);
    return response;
  }
}
