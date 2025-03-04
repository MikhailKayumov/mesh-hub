import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/decorators/auth/auth.decorator';
import { CategoryResponse } from '@/modules/resources/dto/category.response';
import { CgSoftResponse } from '@/modules/resources/dto/cg-soft.response';
import { ResourcesService } from '@/modules/resources/resources.service';

@Controller('resources')
@ApiTags('resources')
export class ResourcesController {
  public constructor(private readonly resourcesService: ResourcesService) {}

  @Get('cg-soft/all')
  @Public()
  @ApiOkResponse({ type: () => CgSoftResponse, isArray: true })
  public async getCGSoft(): Promise<CgSoftResponse[]> {
    return this.resourcesService.getAllCGSoft();
  }

  @Get('category/all')
  @Public()
  @ApiOkResponse({ type: () => CategoryResponse, isArray: true })
  public async getCategories(): Promise<CategoryResponse[]> {
    return this.resourcesService.getAllCategories();
  }
}
