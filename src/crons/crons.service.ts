import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TasksService {
   constructor(
      private database: DatabaseService,
   ) { }

   private readonly logger = new Logger(TasksService.name)

   @Cron(CronExpression.EVERY_5_SECONDS)
   async handleDiscountsExpiration() {
      const currentDate = new Date()

      const discountsToDelete = await this.database.discount.findMany({
         where: {
            valid_until: {
               lte: currentDate
            }

         }
      })

      if (discountsToDelete.length > 0) {
         this.logger.warn(`Deleting discounts: ${discountsToDelete}`);
         await this.database.discount.deleteMany({
            where: {
               id: {
                  in: discountsToDelete.map((d) => d.id)
               }
            }
         })
      }
   }
}

