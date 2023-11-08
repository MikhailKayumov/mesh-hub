import { PaginationResponseDto } from '@decorators/pagination/pagination.response.dto';
import { createParamDecorator, ExecutionContext, Type, applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationDto, PaginationDtoSortItem, PaginationSortOrder } from './pagination.dto';

export const PaginatedRequest = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<PaginationDto> => {
    const request = ctx.switchToHttp().getRequest();

    const skip = parseInt(request.query.skip);
    const size = parseInt(request.query.size);

    const sort: PaginationDtoSortItem[] | undefined = await Promise.all(
      (request.query?.sort?.split(',') ?? []).reduce((acc: Promise<PaginationDtoSortItem>[], item: string) => {
        if (item.length) {
          acc.push(
            PaginationDtoSortItem.build(
              (item[0] === '-' || item[0] === '+' ? item.substring(1) : item).trim(),
              item[0] === '-' ? PaginationSortOrder.DESC : PaginationSortOrder.ASC,
            ),
          );
        }

        return acc;
      }, []),
    );

    return PaginationDto.build(skip, size, sort);
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
      ApiQuery({
        name: 'sort',
        schema: {
          type: 'string',
          description: 'Sorting fields in format: [+-][fieldName]',
        },
        required: false,
      })(target, key, Object.getOwnPropertyDescriptor(target, key) as any);
    },
  ],
);

export const PaginatedResponse = <T extends Type>(Model: T, status: HttpStatus = HttpStatus.OK) => {
  return applyDecorators(
    ApiExtraModels(PaginationResponseDto, PaginationDtoSortItem, Model),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                readOnly: true,
                nullable: false,
                items: { $ref: getSchemaPath(Model) },
              },
            },
            required: ['data'],
          },
        ],
        // properties: {
        //   data: {
        //     type: 'array',
        //     readOnly: true,
        //     nullable: false,
        //     items: { $ref: getSchemaPath(Model) },
        //   },
        //   skip: {
        //     type: 'number',
        //     readOnly: true,
        //     nullable: false,
        //   },
        //   size: {
        //     type: 'number',
        //     readOnly: true,
        //     nullable: false,
        //   },
        //   sort: {
        //     type: 'array',
        //     readOnly: true,
        //     nullable: false,
        //     items: { $ref: getSchemaPath(PaginationDtoSortItem) },
        //   },
        //   totalCount: {
        //     type: 'number',
        //     readOnly: true,
        //     nullable: false,
        //   },
        //   hasMore: {
        //     type: 'boolean',
        //     readOnly: true,
        //     nullable: false,
        //   },
        // },
        // required: ['data', 'skip', 'size', 'sort', 'totalCount', 'hasMore'],
      },
    }),
  );
};
