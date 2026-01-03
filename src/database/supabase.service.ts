import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY'); // <-- SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are missing in .env file');
    }

    console.log('🔧 Inicializando Supabase con URL:', supabaseUrl);
    console.log('🔧 Service Key length:', supabaseKey.length); // Para verificar que existe

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
