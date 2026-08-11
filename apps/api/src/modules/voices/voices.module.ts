import { Module } from "@nestjs/common";
import { VoicesController } from "./voices.controller";

@Module({
  controllers: [VoicesController],
})
export class VoicesModule {}
