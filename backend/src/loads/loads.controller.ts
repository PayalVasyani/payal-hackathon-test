import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { AssignCarrierDto } from './dto/assign-carrier.dto';
import { CreateRateDto } from './dto/create-rate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('loads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) { }

  @Post()
  @RequirePermissions('load.create')
  async createLoad(@Body() dto: CreateLoadDto, @Req() req: any) {
    return this.loadsService.createLoad(dto, req.appUser);
  }

  @Get()
  @RequirePermissions('load.read')
  async getLoads(@Req() req: any) {
    return this.loadsService.getLoads(req.appUser);
  }

  @Patch(':id/assign-carrier')
  @RequirePermissions('load.assign_carrier')
  async assignCarrier(@Param('id') id: string, @Body() dto: AssignCarrierDto, @Req() req: any) {
    const hasOverridePerm = req.appUser.roles.some((r: any) => r.role?.permissions?.some((p: any) => p.permission?.code === 'load.override_compliance_flag'));
    if (dto.overrideCompliance && !hasOverridePerm) {
      throw new ForbiddenException('You do not have permission to override compliance flags.');
    }
    return this.loadsService.assignCarrier(id, dto, req.appUser);
  }

  @Post(':id/rates')
  @RequirePermissions('rate.create')
  async createRate(@Param('id') id: string, @Body() dto: CreateRateDto, @Req() req: any) {
    return this.loadsService.createRate(id, dto, req.appUser);
  }

  @Patch(':id/rates/:version/confirm')
  @RequirePermissions('rate.confirm')
  async confirmRate(@Param('id') id: string, @Param('version') version: string, @Req() req: any) {
    return this.loadsService.confirmRate(id, Number(version), req.appUser);
  }
}
