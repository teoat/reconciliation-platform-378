// Anomaly Detection Module
import { SecurityEvent, SecurityEventType, SecuritySeverity } from './types';

export interface AnomalyResult {
  type: string;
  severity: SecuritySeverity;
  description: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export class AnomalyDetector {
  detectAnomalies(
    events: SecurityEvent[],
    userId: string,
    eventType: string,
    timeWindowMinutes: number = 60
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const now = new Date();
    const timeWindowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

    const userEvents = events.filter(
      (event) => event.metadata?.userId === userId && new Date(event.timestamp) >= timeWindowStart
    );

    switch (eventType) {
      case 'login':
        anomalies.push(...this.detectLoginAnomalies(userEvents, userId));
        break;
      case 'failed_login':
        anomalies.push(...this.detectFailedLoginAnomalies(userEvents, userId));
        break;
      case 'access_pattern':
        anomalies.push(...this.detectAccessPatternAnomalies(userEvents, userId));
        break;
      case 'file_upload':
        anomalies.push(...this.detectFileUploadAnomalies(userEvents, userId));
        break;
      case 'data_access':
        anomalies.push(...this.detectDataAccessAnomalies(userEvents, userId));
        break;
    }

    return anomalies;
  }

  private detectLoginAnomalies(events: SecurityEvent[], userId: string): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const loginEvents = events.filter((e) => e.type === SecurityEventType.LOGIN_SUCCESS);

    const recentLogins = loginEvents.filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
    );

    const uniqueIPs = new Set(recentLogins.map((e) => e.metadata?.ipAddress).filter(Boolean));

    if (uniqueIPs.size > 2) {
      anomalies.push({
        type: 'multiple_ip_logins',
        severity: SecuritySeverity.HIGH,
        description: `Multiple IP addresses used for login in short time: ${Array.from(uniqueIPs).join(', ')}`,
        confidence: 0.85,
        metadata: { userId, ipAddresses: Array.from(uniqueIPs), loginCount: recentLogins.length },
      });
    }

    const unusualHours = loginEvents.filter((e) => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22;
    });

    if (unusualHours.length > loginEvents.length * 0.3) {
      anomalies.push({
        type: 'unusual_login_hours',
        severity: SecuritySeverity.MEDIUM,
        description: 'Unusual login hours detected',
        confidence: 0.7,
        metadata: { userId, unusualLogins: unusualHours.length, totalLogins: loginEvents.length },
      });
    }

    return anomalies;
  }

  private detectFailedLoginAnomalies(events: SecurityEvent[], userId: string): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const failedLogins = events.filter((e) => e.type === SecurityEventType.LOGIN_FAILURE);

    if (failedLogins.length >= 5) {
      const recentFailedLogins = failedLogins.filter(
        (e) => new Date(e.timestamp) > new Date(Date.now() - 15 * 60 * 1000)
      );

      if (recentFailedLogins.length >= 5) {
        anomalies.push({
          type: 'brute_force_attempt',
          severity: SecuritySeverity.CRITICAL,
          description: `Potential brute force attack: ${recentFailedLogins.length} failed login attempts`,
          confidence: 0.95,
          metadata: {
            userId,
            failedAttempts: recentFailedLogins.length,
            timeWindow: '15 minutes',
            ipAddresses: [
              ...new Set(recentFailedLogins.map((e) => e.metadata?.ipAddress).filter(Boolean)),
            ],
          },
        });
      }
    }

    const passwordAttempts = new Map<string, string[]>();
    failedLogins.forEach((event) => {
      const password = event.metadata?.passwordAttempt as string | undefined;
      const ip = event.metadata?.ipAddress as string | undefined;
      if (password && ip) {
        if (!passwordAttempts.has(password)) {
          passwordAttempts.set(password, []);
        }
        passwordAttempts.get(password)!.push(ip);
      }
    });

    for (const [password, ips] of passwordAttempts) {
      if (ips.length >= 3) {
        anomalies.push({
          type: 'distributed_attack',
          severity: SecuritySeverity.HIGH,
          description: `Same password attempted from multiple IPs: ${ips.length} different addresses`,
          confidence: 0.9,
          metadata: { userId, password: password.substring(0, 100), ipCount: ips.length, ips },
        });
      }
    }

    return anomalies;
  }

  private detectAccessPatternAnomalies(events: SecurityEvent[], userId: string): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const accessEvents = events.filter((e) =>
      [SecurityEventType.UNAUTHORIZED_ACCESS, SecurityEventType.PERMISSION_DENIED].includes(e.type)
    );

    const privilegeEvents = events.filter((e) => e.type === SecurityEventType.ELEVATED_PRIVILEGES);
    if (privilegeEvents.length > 0) {
      anomalies.push({
        type: 'privilege_escalation',
        severity: SecuritySeverity.HIGH,
        description: 'Attempted privilege escalation detected',
        confidence: 0.8,
        metadata: { userId, attempts: privilegeEvents.length },
      });
    }

    const resourceAccess = new Map<string, number>();
    accessEvents.forEach((event) => {
      const resource = event.metadata?.resource as string | undefined;
      if (resource) {
        resourceAccess.set(resource, (resourceAccess.get(resource) || 0) + 1);
      }
    });

    for (const [resource, count] of resourceAccess) {
      if (count >= 10) {
        anomalies.push({
          type: 'resource_access_anomaly',
          severity: SecuritySeverity.MEDIUM,
          description: `Unusual access pattern to resource: ${resource} (${count} attempts)`,
          confidence: 0.75,
          metadata: { userId, resource, accessCount: count },
        });
      }
    }

    return anomalies;
  }

  private detectFileUploadAnomalies(events: SecurityEvent[], userId: string): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const uploadEvents = events.filter((e) => e.type === SecurityEventType.FILE_UPLOAD_SUCCESS);
    const maliciousEvents = events.filter(
      (e) => e.type === SecurityEventType.MALICIOUS_FILE_DETECTED
    );

    const recentUploads = uploadEvents.filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
    );

    if (recentUploads.length >= 10) {
      anomalies.push({
        type: 'bulk_file_upload',
        severity: SecuritySeverity.MEDIUM,
        description: `Bulk file upload detected: ${recentUploads.length} files in 10 minutes`,
        confidence: 0.7,
        metadata: { userId, uploadCount: recentUploads.length, timeWindow: '10 minutes' },
      });
    }

    if (maliciousEvents.length > 0) {
      anomalies.push({
        type: 'malicious_file_pattern',
        severity: SecuritySeverity.HIGH,
        description: `Multiple malicious files detected: ${maliciousEvents.length} files`,
        confidence: 0.9,
        metadata: { userId, maliciousCount: maliciousEvents.length },
      });
    }

    return anomalies;
  }

  private detectDataAccessAnomalies(events: SecurityEvent[], userId: string): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const dataAccessEvents = events.filter(
      (e) => e.type === SecurityEventType.SENSITIVE_DATA_ACCESS
    );

    const bulkOperations = events.filter((e) => e.type === SecurityEventType.BULK_DATA_OPERATION);
    if (bulkOperations.length > 0) {
      const totalRecords = bulkOperations.reduce(
        (sum, e) => sum + ((e.metadata?.recordCount as number) || 0),
        0
      );
      if (totalRecords > 10000) {
        anomalies.push({
          type: 'large_data_export',
          severity: SecuritySeverity.MEDIUM,
          description: `Large data export detected: ${totalRecords.toLocaleString()} records`,
          confidence: 0.8,
          metadata: { userId, totalRecords, operations: bulkOperations.length },
        });
      }
    }

    const resourceAccess = new Map<string, number>();
    dataAccessEvents.forEach((event) => {
      const resource = event.metadata?.resource as string | undefined;
      if (resource) {
        resourceAccess.set(resource, (resourceAccess.get(resource) || 0) + 1);
      }
    });

    for (const [resource, count] of resourceAccess) {
      if (count >= 20) {
        anomalies.push({
          type: 'frequent_sensitive_access',
          severity: SecuritySeverity.MEDIUM,
          description: `Frequent access to sensitive resource: ${resource} (${count} times)`,
          confidence: 0.75,
          metadata: { userId, resource, accessCount: count },
        });
      }
    }

    return anomalies;
  }
}
