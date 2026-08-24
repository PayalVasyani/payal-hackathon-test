import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { AssignCarrierDto } from './dto/assign-carrier.dto';
import { CreateRateDto } from './dto/create-rate.dto';

@Injectable()
export class LoadsService {
  constructor(private prisma: PrismaService) {}

  // Helper to extract primary orgId based on user type
  private getOrgId(user: any): string {
    const membership = user.memberships?.[0];
    if (!membership) throw new ForbiddenException('User is not associated with any organization');
    return membership.organizationId;
  }

  async createLoad(dto: CreateLoadDto, user: any) {
    const orgId = this.getOrgId(user);
    
    // Create Load
    const load = await this.prisma.load.create({
      data: {
        shipperId: dto.shipperId,
        brokerOrganizationId: orgId,
        status: 'POSTED',
        createdBy: user.id,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Load',
        entityId: load.id,
        action: 'CREATED',
        userId: user.id,
        newState: load as any,
      }
    });

    return load;
  }

  async getLoads(user: any) {
    const orgId = this.getOrgId(user);
    
    if (user.accountType === 'BROKER') {
      return this.prisma.load.findMany({
        where: { brokerOrganizationId: orgId },
        include: { rates: true },
      });
    } else if (user.accountType === 'CARRIER') {
      return this.prisma.load.findMany({
        where: { carrierOrganizationId: orgId },
        include: { rates: true },
      });
    } else {
      return [];
    }
  }

  async assignCarrier(id: string, dto: AssignCarrierDto, user: any) {
    const orgId = this.getOrgId(user);
    
    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');
    if (load.brokerOrganizationId !== orgId) throw new ForbiddenException('Load belongs to another organization');
    if (load.status !== 'POSTED') throw new BadRequestException('Load is not in POSTED status');

    // Check Carrier Compliance
    const compliance = await this.prisma.carrierCompliance.findUnique({
      where: { organizationId: dto.carrierOrganizationId }
    });

    const issues: string[] = [];
    if (!compliance) {
      issues.push('NO_COMPLIANCE_RECORD');
    } else {
      if (compliance.insuranceExpiry && compliance.insuranceExpiry < new Date()) {
        issues.push('INSURANCE_EXPIRED');
      }
      if (compliance.mcDotStatus !== 'ACTIVE') {
        issues.push('AUTHORITY_INVALID');
      }
    }

    const isBlocked = issues.length > 0;

    if (isBlocked && !dto.overrideCompliance) {
      throw new BadRequestException('Carrier compliance blocked assignment. Override required.');
    }

    // Preserve the original issues if overridden
    const newComplianceStatus = isBlocked && dto.overrideCompliance ? 'OVERRIDDEN' : 'CLEAR';
    
    const updatedLoad = await this.prisma.load.update({
      where: { id },
      data: {
        carrierOrganizationId: dto.carrierOrganizationId,
        status: 'CARRIER_ASSIGNED',
        complianceStatus: newComplianceStatus,
        complianceIssues: issues,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Load',
        entityId: load.id,
        action: 'CARRIER_ASSIGNED',
        userId: user.id,
        previousState: load as any,
        newState: updatedLoad as any,
      }
    });

    return updatedLoad;
  }

  async createRate(id: string, dto: CreateRateDto, user: any) {
    const orgId = this.getOrgId(user);
    
    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');
    if (load.brokerOrganizationId !== orgId) throw new ForbiddenException('Load belongs to another organization');

    const latestRate = await this.prisma.rateConfirmation.findFirst({
      where: { loadId: id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latestRate ? latestRate.version + 1 : 1;
    const total = Number(dto.baseRate) + Number(dto.accessorials);

    const rate = await this.prisma.rateConfirmation.create({
      data: {
        loadId: id,
        version: nextVersion,
        baseRate: dto.baseRate,
        accessorials: dto.accessorials,
        total: total,
        status: 'DRAFT',
        createdBy: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'RateConfirmation',
        entityId: rate.id,
        action: 'CREATED',
        userId: user.id,
        newState: rate as any,
      }
    });

    return rate;
  }

  async confirmRate(id: string, version: number, user: any) {
    const orgId = this.getOrgId(user);

    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');
    if (load.carrierOrganizationId !== orgId) throw new ForbiddenException('Load is not assigned to your carrier organization');

    const rate = await this.prisma.rateConfirmation.findUnique({
      where: { loadId_version: { loadId: id, version: Number(version) } }
    });

    if (!rate) throw new NotFoundException('Rate version not found');
    if (rate.status !== 'DRAFT') throw new BadRequestException('Rate is not in DRAFT status');

    const confirmedRate = await this.prisma.rateConfirmation.update({
      where: { id: rate.id },
      data: {
        status: 'CONFIRMED',
        confirmedBy: user.id,
        confirmedAt: new Date(),
      },
    });

    // Update Load state
    await this.prisma.load.update({
      where: { id },
      data: {
        status: 'RATE_CONFIRMED',
        confirmedRateId: confirmedRate.id,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'RateConfirmation',
        entityId: rate.id,
        action: 'CONFIRMED',
        userId: user.id,
        previousState: rate as any,
        newState: confirmedRate as any,
      }
    });

    return confirmedRate;
  }
}
