import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { id: supabaseId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });
  }

  async getShippers() {
    return this.prisma.user.findMany({
      where: { accountType: 'SHIPPER' },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
  }

  async getCarrierOrgs() {
    return this.prisma.organization.findMany({
      where: { type: 'CARRIER' },
      select: {
        id: true,
        name: true
      }
    });
  }
}
