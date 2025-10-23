import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { verifyMessage } from 'viem';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Genera un nonce único para la wallet
   */
  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = randomBytes(32).toString('hex');
    const normalizedAddress = walletAddress.toLowerCase();

    // Buscar o crear usuario
    await this.userModel.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      { nonce },
      { upsert: true, new: true },
    );

    return nonce;
  }

  /**
   * Verifica la firma del mensaje y autentica al usuario
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<{ token: string; user: User }> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Buscar usuario
    const user = await this.userModel.findOne({
      walletAddress: normalizedAddress,
    });

    if (!user || !user.nonce) {
      throw new UnauthorizedException('Usuario no encontrado o nonce inválido');
    }

    // Verificar que el mensaje contiene el nonce correcto
    if (!message.includes(user.nonce)) {
      throw new UnauthorizedException('Nonce inválido en el mensaje');
    }

    try {
      // Verificar la firma usando viem
      const isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!isValid) {
        throw new UnauthorizedException(
          `Firma inválida: ${signature} - ${message}`,
        );
      }
    } catch (error) {
      throw new UnauthorizedException(`Error al verificar la firma: ${error}`);
    }

    // Actualizar último login y limpiar nonce
    user.lastLogin = new Date();
    user.nonce = undefined;
    await user.save();

    // Generar JWT token
    const payload = {
      sub: user._id,
      walletAddress: user.walletAddress,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: user.toObject(),
    };
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Obtener usuario por wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    return this.userModel.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(
    userId: string,
    data: { username?: string; email?: string },
  ): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true },
    );

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
