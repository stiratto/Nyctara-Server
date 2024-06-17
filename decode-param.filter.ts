import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DecodeParamPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    try {
      const decodedValue = decodeURIComponent(value);
      return decodedValue;
    } catch (error) {
      throw new BadRequestException('Invalid input');
    }
  }
}
