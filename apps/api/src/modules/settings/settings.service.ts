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
    if (data.signupsEnabled !== undefined) {
      this.signupsEnabled = data.signupsEnabled;
    }
    if (data.submissionsEnabled !== undefined) {
      this.submissionsEnabled = data.submissionsEnabled;
    }
    this.updatedAt = new Date();
    this.updatedById = data.updatedById;
  }
}
