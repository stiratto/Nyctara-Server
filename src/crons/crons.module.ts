import { Logger, Module } from "@nestjs/common"
import { TasksService } from "./crons.service";
import { DatabaseService } from "src/database/database.service";

@Module({
   providers: [
      TasksService,
      DatabaseService,
      Logger,
   ]
})

export class TasksModule { }
