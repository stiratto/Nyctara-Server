import { Body, Controller, Post } from "@nestjs/common";
import { PaymentsService } from "./payment.service";

@Controller('/api/payments')
export class PaymentsController {
   constructor(private paymentsService: PaymentsService) { }

   @Post('/newOrder')
   createNewOrder() {
      return this.paymentsService.createNewOrder()
   }
}
