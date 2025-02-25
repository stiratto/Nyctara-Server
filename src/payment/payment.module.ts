import { Module } from "@nestjs/common";
import { PaymentsService } from "./payment.service";
import { PaymentsController } from "./payment.controller";

@Module({
   imports: [],
   providers: [PaymentsService],
   controllers: [PaymentsController],
   exports: []
})

export class PaymentsModule { }
