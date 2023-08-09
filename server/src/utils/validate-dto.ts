import { HttpException, HttpStatus } from '@nestjs/common';
import { validate } from 'class-validator';

async function validateDto<T extends Record<any, any> = Record<any, any>>(dto: T) {
  const errors = await validate(dto);

  if (errors.length) {
    const messages = errors.reduce<string[]>((acc, error) => {
      if (error.constraints) {
        return acc.concat(Object.values(error.constraints));
      }

      return acc;
    }, []);

    throw new HttpException({ messages }, HttpStatus.BAD_REQUEST);
  }
}

export default validateDto;
