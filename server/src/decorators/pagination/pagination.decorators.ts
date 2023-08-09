import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationDto } from './pagination.dto';

export const PaginatedRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Promise<PaginationDto> => {
    const request = ctx.switchToHttp().getRequest();

    return PaginationDto.build(parseInt(request.query.skip), parseInt(request.query.size));
  },
  [
    // (target: any, key: string) => {
    //   ApiQuery({
    //     name: 'skip',
    //     schema: { type: 'number' },
    //     required: false,
    //   })(target, key, Object.getOwnPropertyDescriptor(target, key));
    //   ApiQuery({
    //     name: 'size',
    //     schema: { default: DEFAULT_PAGE_SIZE, type: 'number', minimum: 1 },
    //     required: false,
    //   })(target, key, Object.getOwnPropertyDescriptor(target, key));
    //   ApiQuery({
    //     name: 'asc',
    //     schema: { default: false, type: 'boolean' },
    //     required: false,
    //   })(target, key, Object.getOwnPropertyDescriptor(target, key));
    // },
  ],
);

// export const PaginatedResponse = <T extends Type>(model: T) => {
//   return applyDecorators();
// ApiExtraModels(PaginationResponseMetrics),
// ApiResponse({
//   status: HttpStatus.OK,
//   schema: {
//     properties: {
//       data: {
//         type: 'array',
//         nullable: false,
//         items: { $ref: getSchemaPath(model), readOnly: true },
//       },
//       paginate: {
//         readOnly: true,
//         nullable: false,
//         $ref: getSchemaPath(PaginationResponseMetrics),
//       },
//     },
//   },
// }),
// };
