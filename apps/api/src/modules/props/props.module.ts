import { Module } from "@nestjs/common";
import { PropsController } from "./props.controller";

@Module({
  controllers: [PropsController],
})
export class PropsModule {}
