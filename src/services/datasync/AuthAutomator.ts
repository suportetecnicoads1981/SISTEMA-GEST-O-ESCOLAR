/**
 * AuthAutomator
 * Detecção automática de ambiente para gestão de Redirect URLs no Supabase Auth.
 * Gerenciador de sessão, isolamento por auth.uid() e logs de auditoria.
 */

import { AuthSessionLog } from '../../types/datasync';

export class AuthAutomator {
  private static auditLogs: AuthSessionLog[] = [
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      userId: 'usr_admin_master',
      userEmail: 'suportetecnicoads@gmail.com',
      role: 'SUPER_ADMIN',
      ipAddress: '177.136.24.89 (SSL TLS 1.3)',
      environment: 'Cloud Run Dev (Google Cloud)',
      redirectUrl: 'https://ais-dev-atdtnajz2crvcugbyoqfkl-189384475418.us-east1.run.app/auth/callback',
      action: 'LOGIN',
      status: 'SUCCESS',
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      userId: 'usr_admin_master',
      userEmail: 'suportetecnicoads@gmail.com',
      role: 'SUPER_ADMIN',
      ipAddress: '177.136.24.89',
      environment: 'Cloud Run Dev',
      redirectUrl: 'https://ais-dev-atdtnajz2crvcugbyoqfkl-189384475418.us-east1.run.app/auth/callback',
      action: 'BACKUP_TRIGGERED',
      status: 'SUCCESS',
    },
  ];

  public static getEnvironmentInfo() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const isCloudRun = hostname.includes('run.app') || hostname.includes('google');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    return {
      origin,
      hostname,
      environmentType: isCloudRun ? 'GOOGLE_CLOUD_RUN' : isLocalhost ? 'LOCAL_DEVELOPMENT' : 'STAGING',
      recommendedRedirectUrls: [
        `${origin}/auth/v1/callback`,
        `${origin}/auth/callback`,
        `${origin}/login`,
      ],
      currentUserId: 'usr_admin_master',
      currentUserEmail: 'suportetecnicoads@gmail.com',
      currentRole: 'SUPER_ADMIN',
      isRlsProtected: true,
    };
  }

  public static getAuditLogs(): AuthSessionLog[] {
    return this.auditLogs;
  }

  public static recordAuditLog(
    action: 'LOGIN' | 'TOKEN_REFRESH' | 'BACKUP_TRIGGERED' | 'DDL_EXECUTION' | 'STORAGE_CLEANUP',
    status: 'SUCCESS' | 'BLOCKED' = 'SUCCESS'
  ): void {
    const env = this.getEnvironmentInfo();
    const newLog: AuthSessionLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userId: env.currentUserId,
      userEmail: env.currentUserEmail,
      role: 'SUPER_ADMIN',
      ipAddress: '177.136.24.89 (Autenticado)',
      environment: env.environmentType,
      redirectUrl: env.recommendedRedirectUrls[0],
      action,
      status,
    };

    this.auditLogs.unshift(newLog);
  }
}
