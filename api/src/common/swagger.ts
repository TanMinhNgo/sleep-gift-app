import type { INestApplication } from '@nestjs/common';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 'invalid data',
    description:
      'Thông báo lỗi; validation có thể nối nhiều thông báo bằng dấu chấm phẩy.',
  })
  error!: string;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Sleep Gift API')
    .setDescription(
      'API cho partner và sleeper. Register/join cấp token ngẫu nhiên, không phải JWT. Nhập token vào Authorize để thử các endpoint được bảo vệ. Ngày tính theo Asia/Ho_Chi_Minh. Mọi lỗi trả {error: string}.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      description:
        'Token từ POST /register hoặc POST /join; chỉ nhập token, không nhập tiền tố Bearer.',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
