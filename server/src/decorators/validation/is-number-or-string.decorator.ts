import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'number-or-string', async: false })
export class IsNumberOrStringDecorator implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    return (typeof value === 'number' && !isNaN(value)) || value === 'new';
  }

  defaultMessage(): string {
    return 'Поле "id" может быть целым числом большим нуля или строкой "new"';
  }
}
