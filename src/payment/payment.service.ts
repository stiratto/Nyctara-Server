import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentsService {
   constructor(private configService: ConfigService) { }

   async createNewOrder() {
      try {
         const apiKey = this.configService.get<string>("bold_api_key")
         const apiUrl = this.configService.get<string>("bold_api_url")

         console.log(apiKey, apiUrl)
         const headers = {
            'Authorization': `x-api-key ${apiKey}`,
            'Content-Type': 'application/json'
         }

         const requestBody = {
            amount_type: "OPEN"
         }
         //const response = await fetch(`${apiUrl}/online/link/v1/payment_methods`, {})
         const response = await fetch(`${apiUrl}/online/link/v1/`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers,
         })
         console.log(response)

         if (!response.ok) {
            throw new Error(`${response.status} - ${response.statusText}`);
         }

         const data = await response.json()
         return data

      } catch (error: any) {
         console.log(error)
      }

   }
}
