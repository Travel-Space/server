import { IsJSON, IsNotEmpty, IsString, Matches } from 'class-validator';
import { CommonResponseDto } from 'src/common/dto';

export class FindPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(19[0-9][0-9]|20\d{2})(0[0-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/,
    {
      message: '양식에 맞춰서 생년월일을 작성해주세요.',
    },
  )
  birth: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class FindPasswordResponse extends CommonResponseDto {
  @IsJSON()
  @IsNotEmpty()
  result: { check: boolean };
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z\d!@#$%^&*()]{6,20}$/, {
    message: '양식에 맞춰서 비밀번호를 작성해주세요.',
  })
  password: string;
}

export class FindAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(19[0-9][0-9]|20\d{2})(0[0-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/,
    {
      message: '양식에 맞춰서 생년월일을 작성해주세요.',
    },
  )
  birth: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\d{3,4}\d{4}$/, {
    message: '양식에 맞춰서 휴대폰 번호를 작성해주세요.',
  })
  phone: string;
}

export class FindAccountResponse extends CommonResponseDto {
  @IsJSON()
  @IsNotEmpty()
  user: { name: string; email: string };
}

export class FindUserResponse extends CommonResponseDto {
  @IsJSON()
  @IsNotEmpty()
  user: { id: string };
}
