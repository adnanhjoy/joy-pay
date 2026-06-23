import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MerchantResponseDto } from './dto/merchant-response.dto';

@ApiTags('merchant')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new merchant' })
  @ApiResponse({ status: 201, type: MerchantResponseDto })
  @ApiResponse({ status: 409, description: 'Merchant already exists' })
  @HttpCode(HttpStatus.CREATED)
  async createMerchant(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.createMerchant(createMerchantDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, type: MerchantResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getMerchant(@Param('id') id: string) {
    return this.merchantService.getMerchantById(id);
  }
}
