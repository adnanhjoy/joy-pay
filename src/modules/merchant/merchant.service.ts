import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateMerchantDto } from './dto/create-merchant.dto.js';
import { HmacUtil } from '../../common/utils/hmac.util.js';
import { MerchantResponseDto } from './dto/merchant-response.dto.js';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new merchant with generated API keys
   */
  async createMerchant(dto: CreateMerchantDto): Promise<MerchantResponseDto> {
    // Check if email already exists
    const existingMerchant = await this.prisma.merchant.findUnique({
      where: { email: dto.email },
    });

    if (existingMerchant) {
      throw new ConflictException('Merchant with this email already exists');
    }

    // Generate API keys
    const apiKey = HmacUtil.generateApiKey('pk_live');
    const secretKey = HmacUtil.generateSecretKey('sk_live');

    // Create merchant
    const merchant = await this.prisma.merchant.create({
      data: {
        ...dto,
        apiKey,
        secretKey,
      },
    });

    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      apiKey: merchant.apiKey,
      secretKey: merchant.secretKey,
      webhookUrl: merchant.webhookUrl || undefined,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
    };
  }

  /**
   * Get merchant by ID
   */
  async getMerchantById(id: string): Promise<MerchantResponseDto> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      apiKey: merchant.apiKey,
      secretKey: merchant.secretKey,
      webhookUrl: merchant.webhookUrl || undefined,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
    };
  }

  /**
   * Get merchant by API key (internal use)
   */
  async getMerchantByApiKey(apiKey: string) {
    return this.prisma.merchant.findUnique({
      where: { apiKey, isActive: true },
    });
  }

  /**
   * Update merchant webhook URL
   */
  async updateWebhookUrl(
    merchantId: string,
    webhookUrl: string,
  ): Promise<MerchantResponseDto> {
    const merchant = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { webhookUrl },
    });

    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      apiKey: merchant.apiKey,
      secretKey: merchant.secretKey,
      webhookUrl: merchant.webhookUrl || undefined,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
    };
  }
}
