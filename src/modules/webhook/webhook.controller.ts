import { Controller, Post, Body } from '@nestjs/common';
import { WebhookService } from './webhook.service.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('test')
  @ApiOperation({ summary: 'Test webhook endpoint (internal use only)' })
  testWebhook(@Body() body: Record<string, unknown>) {
    // This is a test endpoint for webhook verification
    return {
      received: true,
      timestamp: new Date().toISOString(),
      payload: body,
    };
  }
}
