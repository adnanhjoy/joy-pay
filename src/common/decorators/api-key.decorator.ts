import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers['x-api-key'] as string;
  },
);

export const MerchantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.merchant?.id;
  },
);
