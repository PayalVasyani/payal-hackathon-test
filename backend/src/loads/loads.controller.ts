import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  @Get(':id')
  @RequirePermissions('load.read')
  async getLoadById(@Param('id') id: string, @Req() req: any) {
    return this.loadsService.getLoadById(id, req.appUser);
  }

  @Post(':id/pod')
  @RequirePermissions('pod.upload')
  async uploadPod(@Param('id') id: string, @Body() dto: import('./dto/upload-pod.dto').UploadPodDto, @Req() req: any) {
    return this.loadsService.uploadPod(id, dto, req.appUser);
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

  @Patch(':id/status')
  @RequirePermissions('load.update_status')
  async updateStatus(@Param('id') id: string, @Body() dto: import('./dto/update-status.dto').UpdateStatusDto, @Req() req: any) {
    return this.loadsService.updateStatus(id, dto, req.appUser);
  }

  @Post('ai/advisor')
  @RequirePermissions('load.read') // Adjust permission as necessary
  async getRouteAdvisor(@Body() dto: { origin: string, destination: string }) {
    if (!dto.origin || !dto.destination) {
      throw new BadRequestException('Origin and destination are required');
    }
    return this.loadsService.getRouteAdvisor(dto.origin, dto.destination);
  }
}
