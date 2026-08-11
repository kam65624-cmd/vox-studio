import { Module } from "@nestjs/common";
import { WardrobesController } from "./wardrobes.controller";

@Module({
  controllers: [WardrobesController],
})
export class WardrobesModule {}
