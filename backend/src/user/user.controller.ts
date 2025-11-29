import { Controller, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete('reset')
  async resetUserData(@Req() req: any) {
    return this.userService.resetUserData(req.user);
  }
}
