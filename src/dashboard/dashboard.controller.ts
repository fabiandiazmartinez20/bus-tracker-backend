import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    console.log('📊 GET /dashboard/stats');
    return this.dashboardService.getStats();
  }

  @Get('recent-choferes')
  getRecentChoferes() {
    console.log('📊 GET /dashboard/recent-choferes');
    return this.dashboardService.getRecentChoferes();
  }

  @Get('active-buses')
  getActiveBuses() {
    console.log('📊 GET /dashboard/active-buses');
    return this.dashboardService.getActiveBuses();
  }
}
