import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Genera un nonce para la wallet
   */
  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  async getNonce(@Body('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      throw new Error('Wallet address es requerida');
    }

    const nonce = await this.authService.generateNonce(walletAddress);
    return { nonce };
  }

  /**
   * Verifica la firma y autentica al usuario
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body('walletAddress') walletAddress: string,
    @Body('signature') signature: string,
    @Body('message') message: string,
  ) {
    if (!walletAddress || !signature || !message) {
      throw new Error('Faltan parámetros requeridos');
    }

    return this.authService.verifySignature(walletAddress, signature, message);
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: Request & { user: { userId: string } }) {
    return this.authService.getUserById(req.user.userId);
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: Request & { user: { userId: string } },
    @Body() data: { username?: string; email?: string },
  ) {
    return this.authService.updateProfile(req.user.userId, data);
  }
}
