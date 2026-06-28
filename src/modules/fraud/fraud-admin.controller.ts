import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FraudService } from './fraud.service.js';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('fraud-admin')
@Controller('merchant/:merchantId/fraud-rules')
@UseGuards(AuthGuard('jwt'))
@ApiSecurity('JWT-auth')
export class FraudAdminController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  @ApiOperation({ summary: 'List fraud rules for a merchant' })
  async listRules(@Param('merchantId') merchantId: string) {
    return this.fraudService.getMerchantRules(merchantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fraud rule' })
  @HttpCode(HttpStatus.CREATED)
  async createRule(
    @Param('merchantId') merchantId: string,
    @Body() body: {
      ruleType: string;
      config: Record<string, unknown>;
      action: 'ALLOW' | 'FLAG' | 'BLOCK';
      priority?: number;
    },
  ) {
    return this.fraudService.createRule(merchantId, body);
  }

  @Put(':ruleId')
  @ApiOperation({ summary: 'Update a fraud rule' })
  async updateRule(
    @Param('merchantId') merchantId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: {
      enabled?: boolean;
      config?: Record<string, unknown>;
      action?: 'ALLOW' | 'FLAG' | 'BLOCK';
      priority?: number;
    },
  ) {
    const result = await this.fraudService.updateRule(merchantId, ruleId, body);
    if (!result) return { error: 'Rule not found' };
    return result;
  }

  @Delete(':ruleId')
  @ApiOperation({ summary: 'Delete a fraud rule' })
  async deleteRule(
    @Param('merchantId') merchantId: string,
    @Param('ruleId') ruleId: string,
  ) {
    const result = await this.fraudService.deleteRule(merchantId, ruleId);
    if (!result) return { error: 'Rule not found' };
    return { message: 'Rule deleted' };
  }

  @Get('check/:transactionId')
  @ApiOperation({ summary: 'Get fraud check result for a transaction' })
  async getFraudCheck(@Param('transactionId') transactionId: string) {
    return this.fraudService.getFraudCheck(transactionId);
  }
}
