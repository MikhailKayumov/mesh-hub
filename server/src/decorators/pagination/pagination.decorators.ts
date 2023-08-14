import { createParamDecorator, ExecutionContext, Type, applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export const PaginatedRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Promise<PaginationDto> => {
    const request = ctx.switchToHttp().getRequest();

    return PaginationDto.build(parseInt(request.query.skip), parseInt(request.query.size));
  },
  [
    (target: any, key: string) => {
      ApiQuery({
        name: 'skip',
        schema: { type: 'number' },
        required: false,
      })(target, key, Object.getOwnPropertyDescriptor(target, key) as any);
      ApiQuery({
        name: 'size',
        schema: { type: 'number', minimum: 1 },
        required: false,
      })(target, key, Object.getOwnPropertyDescriptor(target, key) as any);
      //   ApiQuery({
      //     name: 'asc',
      //     schema: { default: false, type: 'boolean' },
      //     required: false,
      //   })(target, key, Object.getOwnPropertyDescriptor(target, key));
    },
  ],
);

export const ApiPaginatedResponse = <T extends Type>(model: T, status: HttpStatus = HttpStatus.OK) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      schema: {
        properties: {
          data: {
            type: 'array',
            nullable: false,
            items: { $ref: getSchemaPath(model), readOnly: true },
          },
          skip: {
            type: 'number',
            readOnly: true,
            nullable: false,
          },
          size: {
            type: 'number',
            readOnly: true,
            nullable: true,
          },
          totalCount: {
            type: 'number',
            readOnly: true,
            nullable: true,
          },
          hasMore: {
            type: 'boolean',
            readOnly: true,
            nullable: true,
          },
        },
      },
    }),
  );
};
