// Table Skeleton Components
// Replace blank screens during data loading with animated skeleton loaders

export interface SkeletonConfig {
  animation: 'pulse' | 'wave' | 'shimmer' | 'none';
  speed: 'slow' | 'normal' | 'fast';
  color: string;
  backgroundColor: string;
  borderRadius: string;
  enableGradient: boolean;
  gradientColors: string[];
}

export interface TableSkeletonConfig extends SkeletonConfig {
  rows: number;
  columns: number;
  showHeader: boolean;
  showPagination: boolean;
  showActions: boolean;
  cellHeight: string;
  headerHeight: string;
  spacing: string;
}

export interface CardSkeletonConfig extends SkeletonConfig {
  showImage: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showActions: boolean;
  showMetadata: boolean;
  imageAspectRatio: string;
  titleLines: number;
  descriptionLines: number;
}

export interface ListSkeletonConfig extends SkeletonConfig {
  items: number;
  showAvatar: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showActions: boolean;
  itemHeight: string;
  avatarSize: string;
}

class SkeletonService {
  private static instance: SkeletonService;
  private config: SkeletonConfig;
  private listeners: Map<string, ((...args: unknown[]) => unknown)[]> = new Map();

  public static getInstance(): SkeletonService {
    if (!SkeletonService.instance) {
      SkeletonService.instance = new SkeletonService();
    }
    return SkeletonService.instance;
  }

  constructor() {
    this.config = {
      animation: 'shimmer',
      speed: 'normal',
      color: '#e0e0e0',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      enableGradient: true,
      gradientColors: ['#e0e0e0', '#f0f0f0', '#e0e0e0'],
    };

    this.injectSkeletonStyles();
  }

  private injectSkeletonStyles(): void {
    if (document.getElementById('skeleton-styles')) return;

    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes skeleton-wave {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes skeleton-shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }

      .skeleton {
        background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
        background-size: 200px 100%;
        animation: skeleton-shimmer 1.5s infinite;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .skeleton-pulse {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-wave {
        position: relative;
        overflow: hidden;
      }

      .skeleton-wave::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: skeleton-wave 1.5s infinite;
      }

      .skeleton-none {
        animation: none;
      }

      .skeleton-slow { animation-duration: 2s; }
      .skeleton-normal { animation-duration: 1.5s; }
      .skeleton-fast { animation-duration: 1s; }
    `;
    document.head.appendChild(style);
  }

  public createTableSkeleton(config: Partial<TableSkeletonConfig> = {}): HTMLElement {
    const tableConfig: TableSkeletonConfig = {
      ...this.config,
      rows: 5,
      columns: 4,
      showHeader: true,
      showPagination: true,
      showActions: true,
      cellHeight: '40px',
      headerHeight: '50px',
      spacing: '8px',
      ...config,
    };

    const table = document.createElement('div');
    table.className = 'skeleton-table';
    table.style.cssText = `
      width: 100%;
      border: 1px solid #e0e0e0;
      border-radius: ${tableConfig.borderRadius};
      overflow: hidden;
    `;

    // Create header
    if (tableConfig.showHeader) {
      const header = this.createTableHeader(tableConfig);
      table.appendChild(header);
    }

    // Create body
    const body = this.createTableBody(tableConfig);
    table.appendChild(body);

    // Create pagination
    if (tableConfig.showPagination) {
      const pagination = this.createTablePagination(tableConfig);
      table.appendChild(pagination);
    }

    return table;
  }

  private createTableHeader(config: TableSkeletonConfig): HTMLElement {
    const header = document.createElement('div');
    header.className = 'skeleton-table-header';
    header.style.cssText = `
      display: flex;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 ${config.spacing};
    `;

    for (let i = 0; i < config.columns; i++) {
      const cell = document.createElement('div');
      cell.className = `skeleton skeleton-${config.animation} skeleton-${config.speed}`;
      cell.style.cssText = `
        height: ${config.headerHeight};
        flex: 1;
        margin: ${config.spacing} ${config.spacing} ${config.spacing} 0;
        background-color: ${config.color};
        border-radius: ${config.borderRadius};
      `;
      header.appendChild(cell);
    }

    return header;
  }

  private createTableBody(config: TableSkeletonConfig): HTMLElement {
    const body = document.createElement('div');
    body.className = 'skeleton-table-body';

    for (let row = 0; row < config.rows; row++) {
      const rowElement = document.createElement('div');
      rowElement.className = 'skeleton-table-row';
      rowElement.style.cssText = `
        display: flex;
        padding: 0 ${config.spacing};
        border-bottom: 1px solid #f0f0f0;
        align-items: center;
      `;

      for (let col = 0; col < config.columns; col++) {
        const cell = document.createElement('div');
        cell.className = `skeleton skeleton-${config.animation} skeleton-${config.speed}`;
        cell.style.cssText = `
          height: ${config.cellHeight};
          flex: 1;
          margin: ${config.spacing} ${config.spacing} ${config.spacing} 0;
          background-color: ${config.color};
          border-radius: ${config.borderRadius};
        `;
        rowElement.appendChild(cell);
      }

      // Add action column
      if (config.showActions) {
        const actionCell = document.createElement('div');
        actionCell.className = `skeleton skeleton-${config.animation} skeleton-${config.speed}`;
        actionCell.style.cssText = `
          height: ${config.cellHeight};
          width: 80px;
          margin: ${config.spacing} 0;
          background-color: ${config.color};
          border-radius: ${config.borderRadius};
        `;
        rowElement.appendChild(actionCell);
      }

      body.appendChild(rowElement);
    }

    return body;
  }

  private createTablePagination(config: TableSkeletonConfig): HTMLElement {
    const pagination = document.createElement('div');
    pagination.className = 'skeleton-table-pagination';
    pagination.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${config.spacing};
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    `;

    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = `skeleton skeleton-${config.animation} skeleton-${config.speed}`;
    pageInfo.style.cssText = `
      height: 20px;
      width: 120px;
      background-color: ${config.color};
      border-radius: ${config.borderRadius};
    `;
    pagination.appendChild(pageInfo);

    // Pagination controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: ${config.spacing};
    `;

    for (let i = 0; i < 5; i++) {
      const button = document.createElement('div');
      button.className = `skeleton skeleton-${config.animation} skeleton-${config.speed}`;
      button.style.cssText = `
        height: 32px;
        width: 32px;
        background-color: ${config.color};
        border-radius: ${config.borderRadius};
      `;
      controls.appendChild(button);
    }

    pagination.appendChild(controls);
    return pagination;
  }

  public createCardSkeleton(config: Partial<CardSkeletonConfig> = {}): HTMLElement {
    const cardConfig: CardSkeletonConfig = {
      ...this.config,
      showImage: true,
      showTitle: true,
      showDescription: true,
      showActions: true,
      showMetadata: true,
      imageAspectRatio: '16/9',
      titleLines: 1,
      descriptionLines: 3,
      ...config,
    };

    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.style.cssText = `
      width: 100%;
      border: 1px solid #e0e0e0;
      border-radius: ${cardConfig.borderRadius};
      padding: 16px;
      background: white;
    `;

    // Image
    if (cardConfig.showImage) {
      const image = document.createElement('div');
      image.className = `skeleton skeleton-${cardConfig.animation} skeleton-${cardConfig.speed}`;
      image.style.cssText = `
        width: 100%;
        aspect-ratio: ${cardConfig.imageAspectRatio};
        background-color: ${cardConfig.color};
        border-radius: ${cardConfig.borderRadius};
        margin-bottom: 12px;
      `;
      card.appendChild(image);
    }

    // Title
    if (cardConfig.showTitle) {
      for (let i = 0; i < cardConfig.titleLines; i++) {
        const title = document.createElement('div');
        title.className = `skeleton skeleton-${cardConfig.animation} skeleton-${cardConfig.speed}`;
        title.style.cssText = `
          height: 20px;
          width: ${i === cardConfig.titleLines - 1 ? '60%' : '100%'};
          background-color: ${cardConfig.color};
          border-radius: ${cardConfig.borderRadius};
          margin-bottom: 8px;
        `;
        card.appendChild(title);
      }
    }

    // Description
    if (cardConfig.showDescription) {
      for (let i = 0; i < cardConfig.descriptionLines; i++) {
        const description = document.createElement('div');
        description.className = `skeleton skeleton-${cardConfig.animation} skeleton-${cardConfig.speed}`;
        description.style.cssText = `
          height: 16px;
          width: ${i === cardConfig.descriptionLines - 1 ? '80%' : '100%'};
          background-color: ${cardConfig.color};
          border-radius: ${cardConfig.borderRadius};
          margin-bottom: 6px;
        `;
        card.appendChild(description);
      }
    }

    // Metadata
    if (cardConfig.showMetadata) {
      const metadata = document.createElement('div');
      metadata.style.cssText = `
        display: flex;
        gap: 12px;
        margin: 12px 0;
      `;

      for (let i = 0; i < 2; i++) {
        const metaItem = document.createElement('div');
        metaItem.className = `skeleton skeleton-${cardConfig.animation} skeleton-${cardConfig.speed}`;
        metaItem.style.cssText = `
          height: 14px;
          width: 80px;
          background-color: ${cardConfig.color};
          border-radius: ${cardConfig.borderRadius};
        `;
        metadata.appendChild(metaItem);
      }

      card.appendChild(metadata);
    }

    // Actions
    if (cardConfig.showActions) {
      const actions = document.createElement('div');
      actions.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 12px;
      `;

      for (let i = 0; i < 2; i++) {
        const action = document.createElement('div');
        action.className = `skeleton skeleton-${cardConfig.animation} skeleton-${cardConfig.speed}`;
        action.style.cssText = `
          height: 32px;
          width: 80px;
          background-color: ${cardConfig.color};
          border-radius: ${cardConfig.borderRadius};
        `;
        actions.appendChild(action);
      }

      card.appendChild(actions);
    }

    return card;
  }

  public createListSkeleton(config: Partial<ListSkeletonConfig> = {}): HTMLElement {
    const listConfig: ListSkeletonConfig = {
      ...this.config,
      items: 5,
      showAvatar: true,
      showTitle: true,
      showSubtitle: true,
      showActions: true,
      itemHeight: '60px',
      avatarSize: '40px',
      ...config,
    };

    const list = document.createElement('div');
    list.className = 'skeleton-list';
    list.style.cssText = `
      width: 100%;
      border: 1px solid #e0e0e0;
      border-radius: ${listConfig.borderRadius};
      overflow: hidden;
    `;

    for (let i = 0; i < listConfig.items; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-list-item';
      item.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        height: ${listConfig.itemHeight};
      `;

      // Avatar
      if (listConfig.showAvatar) {
        const avatar = document.createElement('div');
        avatar.className = `skeleton skeleton-${listConfig.animation} skeleton-${listConfig.speed}`;
        avatar.style.cssText = `
          width: ${listConfig.avatarSize};
          height: ${listConfig.avatarSize};
          background-color: ${listConfig.color};
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        `;
        item.appendChild(avatar);
      }

      // Content
      const content = document.createElement('div');
      content.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;

      // Title
      if (listConfig.showTitle) {
        const title = document.createElement('div');
        title.className = `skeleton skeleton-${listConfig.animation} skeleton-${listConfig.speed}`;
        title.style.cssText = `
          height: 16px;
          width: 70%;
          background-color: ${listConfig.color};
          border-radius: ${listConfig.borderRadius};
        `;
        content.appendChild(title);
      }

      // Subtitle
      if (listConfig.showSubtitle) {
        const subtitle = document.createElement('div');
        subtitle.className = `skeleton skeleton-${listConfig.animation} skeleton-${listConfig.speed}`;
        subtitle.style.cssText = `
          height: 14px;
          width: 50%;
          background-color: ${listConfig.color};
          border-radius: ${listConfig.borderRadius};
        `;
        content.appendChild(subtitle);
      }

      item.appendChild(content);

      // Actions
      if (listConfig.showActions) {
        const actions = document.createElement('div');
        actions.style.cssText = `
          display: flex;
          gap: 8px;
          margin-left: 12px;
        `;

        for (let j = 0; j < 2; j++) {
          const action = document.createElement('div');
          action.className = `skeleton skeleton-${listConfig.animation} skeleton-${listConfig.speed}`;
          action.style.cssText = `
            height: 24px;
            width: 24px;
            background-color: ${listConfig.color};
            border-radius: ${listConfig.borderRadius};
          `;
          actions.appendChild(action);
        }

        item.appendChild(actions);
      }

      list.appendChild(item);
    }

    return list;
  }

  public createCustomSkeleton(
    width: string,
    height: string,
    config: Partial<SkeletonConfig> = {}
  ): HTMLElement {
    const skeletonConfig: SkeletonConfig = {
      ...this.config,
      ...config,
    };

    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${skeletonConfig.animation} skeleton-${skeletonConfig.speed}`;
    skeleton.style.cssText = `
      width: ${width};
      height: ${height};
      background-color: ${skeletonConfig.color};
      border-radius: ${skeletonConfig.borderRadius};
    `;

    return skeleton;
  }

  public showSkeleton(
    container: HTMLElement,
    skeletonType: 'table' | 'card' | 'list' | 'custom',
    config: Partial<
      SkeletonConfig | TableSkeletonConfig | CardSkeletonConfig | ListSkeletonConfig
    > = {}
  ): HTMLElement {
    // Hide existing content
    const existingContent = container.querySelectorAll(':not(.skeleton-container)');
    existingContent.forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });

    // Create skeleton container
    const skeletonContainer = document.createElement('div');
    skeletonContainer.className = 'skeleton-container';
    skeletonContainer.style.cssText = `
      width: 100%;
      height: 100%;
    `;

    let skeleton: HTMLElement;

    switch (skeletonType) {
      case 'table':
        skeleton = this.createTableSkeleton(config);
        break;
      case 'card':
        skeleton = this.createCardSkeleton(config);
        break;
      case 'list':
        skeleton = this.createListSkeleton(config);
        break;
      case 'custom':
        skeleton = this.createCustomSkeleton(
          config.width || '100%',
          config.height || '100px',
          config
        );
        break;
      default:
        skeleton = this.createCustomSkeleton('100%', '100px', config);
    }

    skeletonContainer.appendChild(skeleton);
    container.appendChild(skeletonContainer);

    this.emit('skeletonShown', { container, skeletonType, config });
    return skeletonContainer;
  }

  public hideSkeleton(container: HTMLElement): void {
    const skeletonContainer = container.querySelector('.skeleton-container');
    if (skeletonContainer) {
      skeletonContainer.remove();
    }

    // Show existing content
    const existingContent = container.querySelectorAll(':not(.skeleton-container)');
    existingContent.forEach((element) => {
      (element as HTMLElement).style.display = '';
    });

    this.emit('skeletonHidden', container);
  }

  public updateConfig(newConfig: Partial<SkeletonConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getConfig(): SkeletonConfig {
    return { ...this.config };
  }

  // Event system
  public on(event: string, callback: (...args: unknown[]) => unknown): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    this.listeners.clear();
  }
}

// React hook for skeleton components
export const useSkeleton = () => {
  const service = SkeletonService.getInstance();

  const createTableSkeleton = (config?: Partial<TableSkeletonConfig>) => {
    return service.createTableSkeleton(config);
  };

  const createCardSkeleton = (config?: Partial<CardSkeletonConfig>) => {
    return service.createCardSkeleton(config);
  };

  const createListSkeleton = (config?: Partial<ListSkeletonConfig>) => {
    return service.createListSkeleton(config);
  };

  const createCustomSkeleton = (
    width: string,
    height: string,
    config?: Partial<SkeletonConfig>
  ) => {
    return service.createCustomSkeleton(width, height, config);
  };

  const showSkeleton = (
    container: HTMLElement,
    skeletonType: 'table' | 'card' | 'list' | 'custom',
    config?: Partial<SkeletonConfig | TableSkeletonConfig | CardSkeletonConfig | ListSkeletonConfig>
  ) => {
    return service.showSkeleton(container, skeletonType, config);
  };

  const hideSkeleton = (container: HTMLElement) => {
    service.hideSkeleton(container);
  };

  const updateConfig = (newConfig: Partial<SkeletonConfig>) => {
    service.updateConfig(newConfig);
  };

  const getConfig = () => {
    return service.getConfig();
  };

  return {
    createTableSkeleton,
    createCardSkeleton,
    createListSkeleton,
    createCustomSkeleton,
    showSkeleton,
    hideSkeleton,
    updateConfig,
    getConfig,
  };
};

// Export singleton instance
export const skeletonService = SkeletonService.getInstance();
