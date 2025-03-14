import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentsService {
   constructor(private configService: ConfigService) { }

   async createNewOrder(body: any) {
      try {
         const { amount } = body
         const apiKey = this.configService.get<string>("bold_api_key")
         const apiUrl = this.configService.get<string>("bold_api_url")

         const headers = {
            'Authorization': `x-api-key ${apiKey}`,
            'Content-Type': 'application/json'
         }

         let currentNanoseconds = Date.now() * 1e6; // Convertir milisegundos a nanosegundos
         let tenMinutesInNanoseconds = 10 * 60 * 1e9; // 10 minutos en nanosegundos
         let futureNanoseconds = currentNanoseconds + tenMinutesInNanoseconds;

         const requestBody = {
            "amount_type": "CLOSE",
            "amount": {
               "currency": "COP",
               "total_amount": amount
            },
            "expiration_date": futureNanoseconds,
            "description": "Compra de perfumes en Nyctara",
            "payment_methods": [
               "PSE",
               "NEQUI",
               "BOTON_BANCOLOMBIA",
               "CREDIT_CARD"
            ],
            "image_url": "https://nyctara-perfumery-static.s3.us-east-1.amazonaws.com/nyctara%2Bgrande.webp"
         }

         const response = await fetch(`${apiUrl}/online/link/v1`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers,
         })


         if (!response.ok) {
            throw new Error(`${response.status} - ${response.statusText}`);
         }

         const data = await response.json()
         console.log(data)
         return data

      } catch (error: any) {
         console.log(error)
      }

   }

   async getPaymentStatus(paymentLink: any) {
      try {
         const apiKey = this.configService.get<string>("bold_api_key")
         const apiUrl = this.configService.get<string>("bold_api_url")

         const headers = {
            'Authorization': `x-api-key ${apiKey}`
         }

         const response = await fetch(`${apiUrl}/online/link/v1/${paymentLink}`, {
            headers
         })

         if (!response.ok) {
            throw new BadRequestException("Couldn't get the payment status")
         }

         const data = await response.json()

         return data
      } catch (err: any) {
         console.log(err)
      }
   }
}
