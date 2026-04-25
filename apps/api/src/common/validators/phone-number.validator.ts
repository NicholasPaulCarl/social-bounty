import { CountryCode, isValidPhoneNumber } from 'libphonenumber-js';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function isValidPhoneE164(value: unknown, region = 'ZA'): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  return isValidPhoneNumber(value, region as CountryCode);
}

export function IsValidPhoneE164(
  options: { region?: string } = {},
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneE164',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isValidPhoneE164(value, options.region ?? 'ZA');
        },
        defaultMessage() {
          return 'must be a valid international phone number (E.164)';
        },
      },
    });
  };
}
