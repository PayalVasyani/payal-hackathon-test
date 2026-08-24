import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('me')
  async getMyCompliance(@Req() req: any) {
    return this.complianceService.getMyCompliance(req.appUser);
  }

  @Put('me')
  async updateMyCompliance(@Body() dto: UpdateComplianceDto, @Req() req: any) {
    return this.complianceService.updateMyCompliance(dto, req.appUser);
  }
}
