import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { LogsModule } from './logs/logs.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [AuthModule, MeModule, LogsModule, NotesModule],
})
export class AppModule {}
