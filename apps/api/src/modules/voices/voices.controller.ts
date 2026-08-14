import { Controller, Get, Post, Patch, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Voices")
@Controller("voices")
export class VoicesController {
  @Get()
  @ApiOperation({ summary: "List voices" })
  listVoices() {
    return [
      {
        id: "tradeo-ar-voice",
        name: "Prof. Tradeo (Arabic)",
        language: "ar",
        locale: "ar-SA",
        gender: "male",
        tone: "Smart, educational, witty",
        speed: 1.0,
        pitch: 1.0,
        provider: "elevenlabs",
        providerVoiceId: "eleven-ar-tradeo-001",
        sampleUrl: "http://localhost:9000/vox-studio/samples/tradeo-ar.mp3",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tradeo-en-voice",
        name: "Prof. Tradeo (English)",
        language: "en",
        locale: "en-US",
        gender: "male",
        tone: "Smart, educational, sarcastic",
        speed: 1.0,
        pitch: 1.0,
        provider: "elevenlabs",
        providerVoiceId: "eleven-en-tradeo-002",
        sampleUrl: "http://localhost:9000/vox-studio/samples/tradeo-en.mp3",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  @Post()
  @ApiOperation({ summary: "Create voice" })
  createVoice(@Body() body: unknown) {
    return {
      id: "v-new",
      ...(body as object),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update voice" })
  updateVoice(@Param("id") id: string, @Body() body: unknown) {
    return {
      id,
      ...(body as object),
      updatedAt: new Date().toISOString(),
    };
  }
}
