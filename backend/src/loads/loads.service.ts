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
    
    // Validate Shipper
    const shipper = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: dto.shipperId },
          { email: dto.shipperId }
        ],
        accountType: 'SHIPPER'
      }
    });

    if (!shipper) {
      throw new BadRequestException(`Shipper with identifier ${dto.shipperId} not found or is not a valid shipper.`);
    }
    
    const load = await this.prisma.load.create({
      data: {
        shipperId: shipper.id, // Store actual UUID
        origin: dto.origin,
        destination: dto.destination,
        equipmentType: dto.equipmentType,
        commodity: dto.commodity,
        pickupDate: dto.pickupDate ? new Date(dto.pickupDate) : null,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        weight: dto.weight ?? null,
        targetOffer: dto.targetOffer ?? null,
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
    if (user.accountType === 'SHIPPER') {
      return this.prisma.load.findMany({
        where: { 
          // Match by exactly user.id or user.email
          shipperId: { in: [user.id, user.email] } 
        },
        include: { rates: true, carrierOrganization: true, brokerOrganization: true },
      });
    }

    const orgId = this.getOrgId(user);
    
    if (user.accountType === 'BROKER') {
      return this.prisma.load.findMany({
        where: { brokerOrganizationId: orgId },
        include: { rates: true, carrierOrganization: true, brokerOrganization: true },
      });
    } else if (user.accountType === 'CARRIER') {
      return this.prisma.load.findMany({
        where: { carrierOrganizationId: orgId },
        include: { rates: true, carrierOrganization: true, brokerOrganization: true },
      });
    } else {
      return [];
    }
  }

  async getLoadById(id: string, user: any) {
    const load = await this.prisma.load.findUnique({
      where: { id },
      include: {
        rates: { orderBy: { version: 'desc' } },
        carrierOrganization: true,
        brokerOrganization: true,
        podDocuments: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!load) throw new NotFoundException('Load not found');

    const orgId = user.accountType === 'SHIPPER' ? undefined : this.getOrgId(user);
    if (user.accountType === 'BROKER' && load.brokerOrganizationId !== orgId) {
      throw new ForbiddenException('Load belongs to another broker organization');
    }
    if (user.accountType === 'CARRIER' && load.carrierOrganizationId !== orgId) {
      throw new ForbiddenException('Load is not assigned to your carrier organization');
    }
    if (user.accountType === 'SHIPPER' && load.shipperId !== user.id && load.shipperId !== user.email) {
      throw new ForbiddenException('Load belongs to another shipper');
    }

    return load;
  }

  async uploadPod(id: string, dto: import('./dto/upload-pod.dto').UploadPodDto, user: any) {
    const orgId = this.getOrgId(user);

    if (user.accountType !== 'CARRIER') {
      throw new ForbiddenException('Only Carriers can upload Proof of Delivery.');
    }

    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');
    if (load.carrierOrganizationId !== orgId) {
      throw new ForbiddenException('Load is not assigned to your carrier organization');
    }

    if (load.status !== 'DELIVERED' && load.status !== 'POD_VERIFIED') {
      throw new BadRequestException('Load must be in DELIVERED state to upload POD.');
    }

    const pod = await this.prisma.podDocument.create({
      data: {
        loadId: id,
        uploadedById: user.id,
        fileName: dto.fileName,
        fileType: dto.fileType,
        fileData: dto.fileData,
      },
    });

    let updatedLoad = load;
    if (load.status === 'DELIVERED') {
      updatedLoad = await this.prisma.load.update({
        where: { id },
        data: { status: 'POD_VERIFIED' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Load',
        entityId: load.id,
        action: 'POD_UPLOADED',
        userId: user.id,
        previousState: load as any,
        newState: updatedLoad as any,
      }
    });

    return pod;
  }

  async assignCarrier(id: string, dto: AssignCarrierDto, user: any) {
    const orgId = this.getOrgId(user);
    
    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');
    if (load.brokerOrganizationId !== orgId) throw new ForbiddenException('Load belongs to another organization');
    if (load.status !== 'POSTED') throw new BadRequestException('Load is not in POSTED status');

    const carrierOrg = await this.prisma.organization.findUnique({
      where: { id: dto.carrierOrganizationId }
    });
    
    if (!carrierOrg || carrierOrg.type !== 'CARRIER') {
      throw new BadRequestException('Carrier organization not found.');
    }

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
      if (load.equipmentType && !compliance.approvedEquipment.includes(load.equipmentType)) {
        issues.push('UNAUTHORIZED_EQUIPMENT');
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
    if (load.status !== 'CARRIER_ASSIGNED') throw new BadRequestException('Load is no longer in a state to confirm rates');

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

  async updateStatus(id: string, dto: import('./dto/update-status.dto').UpdateStatusDto, user: any) {
    const orgId = this.getOrgId(user);

    const load = await this.prisma.load.findUnique({ where: { id } });
    if (!load) throw new NotFoundException('Load not found');

    if (user.accountType === 'BROKER' && load.brokerOrganizationId !== orgId) {
      throw new ForbiddenException('Load belongs to another broker organization');
    }
    if (user.accountType === 'CARRIER' && load.carrierOrganizationId !== orgId) {
      throw new ForbiddenException('Load is not assigned to your carrier organization');
    }

    const stateProgression: Record<string, string[]> = {
      'RATE_CONFIRMED': ['DISPATCHED'],
      'DISPATCHED': ['IN_TRANSIT'],
      'IN_TRANSIT': ['DELIVERED'],
      'DELIVERED': ['POD_VERIFIED'],
      'POD_VERIFIED': ['INVOICED_CLOSED']
    };

    const allowedNextStates = stateProgression[load.status] || [];
    if (!allowedNextStates.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition load from ${load.status} to ${dto.status}`);
    }

    const updatedLoad = await this.prisma.load.update({
      where: { id },
      data: { status: dto.status }
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Load',
        entityId: load.id,
        action: 'STATUS_UPDATED',
        userId: user.id,
        previousState: load as any,
        newState: updatedLoad as any,
      }
    });

    return updatedLoad;
  }
}
