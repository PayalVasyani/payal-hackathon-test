import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateComplianceDto } from './dto/update-compliance.dto';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  private getOrgId(user: any): string {
    const membership = user.memberships?.[0];
    if (!membership) throw new ForbiddenException('User is not associated with any organization');
    return membership.organizationId;
  }

  async getMyCompliance(user: any) {
    if (user.accountType !== 'CARRIER') {
      throw new ForbiddenException('Only carriers have compliance records');
    }
    const orgId = this.getOrgId(user);
    
    let compliance = await this.prisma.carrierCompliance.findUnique({
      where: { organizationId: orgId }
    });
    
    // Auto-create blank record if missing
    if (!compliance) {
      compliance = await this.prisma.carrierCompliance.create({
        data: {
          organizationId: orgId,
        }
      });
    }
    return compliance;
  }

  async updateMyCompliance(dto: UpdateComplianceDto, user: any) {
    if (user.accountType !== 'CARRIER') {
      throw new ForbiddenException('Only carriers can update their compliance records');
    }
    const orgId = this.getOrgId(user);
    
    const compliance = await this.prisma.carrierCompliance.upsert({
      where: { organizationId: orgId },
      update: {
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        mcDotStatus: dto.mcDotStatus,
        approvedEquipment: dto.approvedEquipment || [],
        approvedCommodities: dto.approvedCommodities || [],
      },
      create: {
        organizationId: orgId,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        mcDotStatus: dto.mcDotStatus,
        approvedEquipment: dto.approvedEquipment || [],
        approvedCommodities: dto.approvedCommodities || [],
      }
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'CarrierCompliance',
        entityId: compliance.id,
        action: 'UPDATED',
        userId: user.id,
        newState: compliance as any,
      }
    });

    return compliance;
  }
}
