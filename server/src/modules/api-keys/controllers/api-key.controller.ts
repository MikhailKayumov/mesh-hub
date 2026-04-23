import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyCreateRequestDto } from '@/modules/api-keys/dto/api-key.create.request.dto';
import { ApiKeyResponseDto } from '@/modules/api-keys/dto/api-key.response.dto';
import { ApiKeyService } from '@/modules/api-keys/services/api-key.service';

@Controller('api-keys')
@ApiTags('api-keys')
export class ApiKeyController {
  public constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ApiKeyResponseDto, description: 'API key created. rawKey is shown only once.' })
  public generate(@Body() dto: ApiKeyCreateRequestDto): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.generate(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [ApiKeyResponseDto] })
  public list(@Query('orgId', ParseUUIDPipe) orgId: string): Promise<ApiKeyResponseDto[]> {
    return this.apiKeyService.list(orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'API key revoked' })
  @ApiUnauthorizedResponse({ description: 'Key not found or not owned by organization' })
  public revoke(@Param('id', ParseUUIDPipe) id: string, @Query('orgId', ParseUUIDPipe) orgId: string): Promise<void> {
    return this.apiKeyService.revoke(id, orgId);
  }
}
