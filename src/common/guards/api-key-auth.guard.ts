import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HmacUtil } from '../utils/hmac.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract API key from header
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Extract timestamp and signature from headers
    const timestampHeader = request.headers['x-timestamp'] as string;
    const signatureHeader = request.headers['x-signature'] as string;

    if (!timestampHeader || !signatureHeader) {
      throw new UnauthorizedException(
        'Timestamp and signature headers are required',
      );
    }

    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
      throw new UnauthorizedException('Invalid timestamp format');
    }

    // Validate timestamp (prevent replay attacks)
    if (!HmacUtil.isTimestampValid(timestamp)) {
      throw new UnauthorizedException('Request timestamp expired or invalid');
    }

    // Find merchant by API key
    const merchant = await this.prisma.merchant.findUnique({
      where: { apiKey, isActive: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Verify HMAC signature
    const rawBody = request['rawBody'] || JSON.stringify(request.body);
    const isValidSignature = HmacUtil.verifySignature(
      rawBody,
      timestamp,
      signatureHeader,
      merchant.secretKey,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Attach merchant to request for use in controllers/services
    request.merchant = merchant;

    return true;
  }
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      merchant?: {
        id: string;
        name: string;
        email: string;
        apiKey: string;
        secretKey: string;
        webhookUrl: string | null;
        isActive: boolean;
      };
    }
  }
}
