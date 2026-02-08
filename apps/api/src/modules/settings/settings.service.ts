import { Injectable } from '@nestjs/common';

/**
 * Lightweight in-memory settings service.
 * Extracted from AdminService to avoid circular module dependencies.
 * For production, replace with database-backed settings.
 */
@Injectable()
export class SettingsService {
  private signupsEnabled = true;
  private submissionsEnabled = true;
  private updatedAt = new Date();
  private updatedById: string | null = null;

  isSignupEnabled(): boolean {
    return this.signupsEnabled;
  }

  isSubmissionEnabled(): boolean {
    return this.submissionsEnabled;
  }

  getSettings() {
    return {
      signupsEnabled: this.signupsEnabled,
      submissionsEnabled: this.submissionsEnabled,
      updatedAt: this.updatedAt,
      updatedById: this.updatedById,
    };
  }

  updateSettings(data: {
    signupsEnabled?: boolean;
    submissionsEnabled?: boolean;
    updatedById: string;
  }) {
    let changed = false;
    if (data.signupsEnabled !== undefined && data.signupsEnabled !== this.signupsEnabled) {
      this.signupsEnabled = data.signupsEnabled;
      changed = true;
    }
    if (data.submissionsEnabled !== undefined && data.submissionsEnabled !== this.submissionsEnabled) {
      this.submissionsEnabled = data.submissionsEnabled;
      changed = true;
    }
    if (changed) {
      this.updatedAt = new Date();
      this.updatedById = data.updatedById;
    }
  }
}
