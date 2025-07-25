import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ReqUser } from '../decorators/req-user.decorator';
import { CurrentUser } from '../../users/types/current-user.type';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login efetuado com sucesso' })
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(data);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Login successful' };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar tokens com refreshToken' })
  @ApiResponse({ status: 200, description: 'Tokens atualizados com sucesso' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.cookies?.userId;
    const refreshToken = req.cookies?.refreshToken;

    const result = await this.authService.refreshTokens(userId, refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Logout do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(
    @ReqUser() currentUser: CurrentUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(currentUser.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out' };
  }
}
