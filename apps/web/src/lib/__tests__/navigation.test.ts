import { getNavItems } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

describe('Navigation', () => {
  describe('getNavItems', () => {
    describe('PARTICIPANT', () => {
      const items = getNavItems(UserRole.PARTICIPANT);

      it('should return participant nav items', () => {
        expect(items.length).toBeGreaterThan(0);
      });

      it('should include Inbox as first item', () => {
        expect(items[0].label).toBe('Inbox');
        expect(items[0].href).toBe('/inbox');
      });

      it('should include Browse Bounties', () => {
        expect(items.find(i => i.label === 'Browse Bounties')).toBeDefined();
      });

      it('should include My Submissions', () => {
        expect(items.find(i => i.label === 'My Submissions')).toBeDefined();
      });

      it('should include My Disputes', () => {
        expect(items.find(i => i.label === 'My Disputes')).toBeDefined();
      });

      it('should include Wallet', () => {
        expect(items.find(i => i.label === 'Wallet')).toBeDefined();
      });

      it('should include Profile', () => {
        expect(items.find(i => i.label === 'Profile')).toBeDefined();
      });

      it('should NOT include Dashboard', () => {
        expect(items.find(i => i.label === 'Dashboard')).toBeUndefined();
      });

      it('should NOT contain any /admin or /business routes', () => {
        items.forEach(item => {
          expect(item.href).not.toContain('/admin');
          expect(item.href).not.toContain('/business');
        });
      });

      it('should have icons on all items', () => {
        items.forEach(item => {
          expect(item.icon).toBeDefined();
          expect(item.icon.length).toBeGreaterThan(0);
        });
      });
    });

    describe('BUSINESS_ADMIN', () => {
      const items = getNavItems(UserRole.BUSINESS_ADMIN);

      it('should include Inbox as first item', () => {
        expect(items[0].label).toBe('Inbox');
        expect(items[0].href).toBe('/inbox');
      });

      it('should include Dashboard', () => {
        expect(items.find(i => i.label === 'Dashboard')).toBeDefined();
      });

      it('should include Review Center', () => {
        expect(items.find(i => i.label === 'Review Center')).toBeDefined();
      });

      it('should include Organisation', () => {
        expect(items.find(i => i.label === 'Organisation')).toBeDefined();
      });

      it('should include Hunters', () => {
        expect(items.find(i => i.label === 'Hunters')).toBeDefined();
      });

      it('should NOT contain /admin routes', () => {
        items.forEach(item => {
          expect(item.href).not.toContain('/admin');
        });
      });
    });

    describe('SUPER_ADMIN', () => {
      const items = getNavItems(UserRole.SUPER_ADMIN);

      it('should include Inbox as first item', () => {
        expect(items[0].label).toBe('Inbox');
        expect(items[0].href).toBe('/inbox');
      });

      it('should include Users', () => {
        expect(items.find(i => i.label === 'Users')).toBeDefined();
      });

      it('should include Organisations', () => {
        expect(items.find(i => i.label === 'Organisations')).toBeDefined();
      });

      it('should include Audit Logs', () => {
        expect(items.find(i => i.label === 'Audit Logs')).toBeDefined();
      });

      it('should include System Health', () => {
        expect(items.find(i => i.label === 'System Health')).toBeDefined();
      });

      it('should include Component Library with children', () => {
        const compLib = items.find(i => i.label === 'Component Library');
        expect(compLib).toBeDefined();
        expect(compLib?.children?.length).toBeGreaterThan(0);
      });

      it('should have 7 Component Library sub-items', () => {
        const compLib = items.find(i => i.label === 'Component Library');
        expect(compLib?.children).toHaveLength(7);
      });
    });

    describe('default/unknown role', () => {
      it('should return participant nav for unknown role', () => {
        const items = getNavItems('UNKNOWN' as UserRole);
        expect(items[0].label).toBe('Inbox');
        // Should match participant nav
        const participantItems = getNavItems(UserRole.PARTICIPANT);
        expect(items).toEqual(participantItems);
      });
    });
  });
});
