import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { FraudEngineService } from './fraud-engine.service.js';
import { FraudService } from './fraud.service.js';
import { FraudAdminController } from './fraud-admin.controller.js';
import { VelocityRule } from './rules/velocity.rule.js';
import { AmountThresholdRule } from './rules/amount-threshold.rule.js';
import { BinBlocklistRule } from './rules/bin-blocklist.rule.js';
import { IpCountryMatchRule } from './rules/ip-country-match.rule.js';
import { TimeRestrictionRule } from './rules/time-restriction.rule.js';

@Module({
  imports: [DatabaseModule],
  controllers: [FraudAdminController],
  providers: [
    FraudEngineService,
    FraudService,
    VelocityRule,
    AmountThresholdRule,
    BinBlocklistRule,
    IpCountryMatchRule,
    TimeRestrictionRule,
  ],
  exports: [FraudService, FraudEngineService],
})
export class FraudModule {}
