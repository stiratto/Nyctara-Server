import { Body, Controller, Post } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MailDto } from './dto/MailDto';

@Controller('/api/mailing')
export class MailingController {
  constructor(private readonly mailingService: MailingService) { }

  @Post('/send-mail')
  sendNewMail(@Body() mail: MailDto) {
    return this.mailingService.sendNewMail(mail)
  }
}
