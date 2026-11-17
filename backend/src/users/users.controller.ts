import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateMe(user.id, dto);
  }

  // Perfil público: requiere sesión (solo la comunidad FRT ve perfiles)
  @Get(':id')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getPublicProfile(id);
  }
}
