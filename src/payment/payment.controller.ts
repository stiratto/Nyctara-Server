import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PaymentsService } from "./payment.service";

@Controller('/api/payments')
export class PaymentsController {
   constructor(private paymentsService: PaymentsService) { }

   @Post('/newOrder')
   createNewOrder(@Body() body: any) {
      return this.paymentsService.createNewOrder(body)
   }

   @Get('/get-payment-status/:paymentLink')
   getPaymentStatus(@Param() paymentLink: string) {
      return this.paymentsService.getPaymentStatus(paymentLink)
   }
}
