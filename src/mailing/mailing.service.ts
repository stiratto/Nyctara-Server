import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from "nodemailer"
import { MailDto } from './dto/MailDto';

@Injectable()
export class MailingService {
   private transporter: nodemailer.Transporter;
   private readonly SMTP_GMAIL_USER: string;

   constructor(private configService: ConfigService) {
      const SMTP_GMAIL_APP_PASSWORD = this.configService.get<string>("smtp_gmail_app_password")
      this.SMTP_GMAIL_USER = this.configService.get<string>("smtp_gmail_user")

      if (!SMTP_GMAIL_APP_PASSWORD || !this.SMTP_GMAIL_USER) {
         throw new Error("Faltan variables de inicializacion para el protocolo SMTP")
      }

      this.transporter = nodemailer.createTransport({
         host: 'smtp.gmail.com',
         port: 587,
         secure: false, // true for port 465, false for other ports

         auth: {
            user: this.SMTP_GMAIL_USER,
            pass: SMTP_GMAIL_APP_PASSWORD
         }

      })

   }



   async sendNewMail(mail: MailDto) {
      try {

         const { message } = mail
         const info = await this.transporter.sendMail({
            from: `"Pedidos Nyctara Perfumes" <${this.SMTP_GMAIL_USER}>`,
            to: "moranmoralesj4@gmail.com",
            subject: "Pedido Nyctara Perfumes",
            text: message,
         })

         console.log("Email de pedido enviado :)")

         return info
      } catch (err: any) {
         console.log(err)

      }

   }
}
