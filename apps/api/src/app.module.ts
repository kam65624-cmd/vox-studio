import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { EpisodesModule } from "./modules/episodes/episodes.module";
import { CharactersModule } from "./modules/characters/characters.module";
import { StudiosModule } from "./modules/studios/studios.module";
import { StylesModule } from "./modules/styles/styles.module";
import { VoicesModule } from "./modules/voices/voices.module";
import { WardrobesModule } from "./modules/wardrobes/wardrobes.module";
import { PropsModule } from "./modules/props/props.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { RecipesModule } from "./modules/recipes/recipes.module";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),

    // Feature modules
    HealthModule,
    WorkspacesModule,
    ProjectsModule,
    EpisodesModule,
    CharactersModule,
    StudiosModule,
    StylesModule,
    VoicesModule,
    WardrobesModule,
    PropsModule,
    AssetsModule,
    RecipesModule,
  ],
})
export class AppModule {}
