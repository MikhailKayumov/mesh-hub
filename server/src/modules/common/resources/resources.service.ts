import { Injectable } from '@nestjs/common';
import { CgSoftResponse } from '@/modules/common/resources/dto/cg-soft.response';
import { CgSoftMapper } from '@/modules/common/resources/mappers/cg-soft.mapper';
import { CgSoftRepository } from '@/modules/common/resources/repositories/cg-soft.repository';

@Injectable()
export class ResourcesService {
  public constructor(private readonly cgSoftRepository: CgSoftRepository) {}

  public async getAllCGSoft(): Promise<CgSoftResponse[]> {
    const entities = await this.cgSoftRepository.find();
    return entities.map(CgSoftMapper.toResponse);
  }
}
