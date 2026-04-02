import { TabMenu } from 'primereact/tabmenu';
import type { TabsConfig } from './types';

interface PageHeaderTabsProps {
  config: TabsConfig;
}

export function PageHeaderTabs({ config }: PageHeaderTabsProps) {
  const model = config.items.map((item) => ({
    label: item.label,
    icon: item.icon,
  }));

  return (
    <TabMenu
      model={model}
      activeIndex={config.activeIndex}
      onTabChange={(e) => config.onChange(e.index)}
      className="mb-0"
    />
  );
}
