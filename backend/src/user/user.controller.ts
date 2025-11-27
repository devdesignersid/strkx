import { Controller, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete('reset')
  async resetUserData() {
    return this.userService.resetUserData();
  }
}
