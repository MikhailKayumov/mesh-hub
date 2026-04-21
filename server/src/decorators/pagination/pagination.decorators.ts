/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createParamDecorator, ExecutionContext, Type, applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { Request } from 'express';
import { PaginationResponseDto } from '@/decorators/pagination/pagination.response.dto';
import { PaginationDto, PaginationDtoSortItem, PaginationSortOrder } from './pagination.dto';

export const PaginatedRequest = createParamDecorator(
  async (_: unknown, ctx: ExecutionContext): Promise<PaginationDto> => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const skip = parseInt(request.query.skip as string);
    const size = parseInt(request.query.size as string);

    const sorts = (request.query?.sort as string)?.split(',') ?? [];
    const sort: PaginationDtoSortItem[] | undefined = await Promise.all(
      sorts.reduce((acc: Promise<PaginationDtoSortItem>[], item: string) => {
        if (item.length) {
          const field = (item[0] === '-' || item[0] === '+' ? item.substring(1) : item).trim();
          const order = item[0] === '-' ? PaginationSortOrder.DESC : PaginationSortOrder.ASC;
          acc.push(PaginationDtoSortItem.build(field, order));
        }

        return acc;
      }, []),
    );

    return PaginationDto.build(skip, size, sort);
  },
  [
    (target: any, propertyKey: string | symbol | undefined) => {
      const key = String(propertyKey);
      ApiQuery({
        name: 'skip',
        schema: { type: 'number', minimum: 0 },
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
      },
    }),
  );
};
