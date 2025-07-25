import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh-token-jwt' })
  @IsJWT()
  refreshToken: string;
}
